import "server-only";
import crypto from "crypto";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { Session } from "../../lib/models/Session.ts";
import { Setting } from "../../lib/models/Setting.ts";
import { comparePassword, comparePasswordDummy } from "./password.js";
import { generateSessionToken, hashToken } from "./tokens.js";
import {
  setCookie,
  deleteCookie,
  getCookie,
  COOKIE_NAMES,
  COOKIE_DURATIONS,
} from "./cookies.js";
import { resolveDeviceContext } from "./device.js";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "./rateLimit.js";
import { createAdminNotification } from "@/server/services/notificationService.js";

/**
 * Handles student login flow with single-device lock policy.
 */
export async function studentLogin({ loginId, password }) {
  await connectDB();
  const rawId = (loginId || "").trim();
  const normalizedId = rawId.toLowerCase();

  const deviceCtx = await resolveDeviceContext();
  const { deviceId, label, userAgent, ip } = deviceCtx;

  const userKey = `u:${normalizedId}`;
  const ipKey = `ip:${ip}`;

  // 1. Check rate limits (5 failed attempts per 15 minutes per IP and per account)
  const userRate = await checkRateLimit(userKey);
  if (userRate.locked) {
    return { success: false, error: userRate.message };
  }

  const ipRate = await checkRateLimit(ipKey);
  if (ipRate.locked) {
    return { success: false, error: ipRate.message };
  }

  // 2. Lookup user by loginId OR email
  const user = await User.findOne({
    role: "student",
    $or: [
      { loginId: rawId },
      { loginId: normalizedId },
      { email: normalizedId },
    ],
  });

  if (!user) {
    // Run dummy compare to eliminate timing side-channel
    await comparePasswordDummy(password);
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid Login ID or password." };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid Login ID or password." };
  }

  // Only after password is confirmed, check for blocked status
  if (user.status === "blocked") {
    return {
      success: false,
      error: "Your account has been deactivated. Please contact RD Classes administration.",
    };
  }

  // Clear rate-limits upon valid authentication
  await resetRateLimit(userKey);
  await resetRateLimit(ipKey);

  const now = new Date();
  const sessionExpiresAt = new Date(
    now.getTime() + COOKIE_DURATIONS.SESSION * 1000
  );

  // 3. Query all currently approved devices for this student
  const approvedDevices = await Device.find({
    $or: [{ studentId: user._id }, { userId: user._id }],
    status: "approved",
  });

  const isAlreadyApproved = approvedDevices.some((d) => d.deviceId === deviceId);

  // Determine allowed max devices (student override or system default 1)
  let maxAllowed = user.maxDevices;
  if (!maxAllowed || maxAllowed < 1) {
    const setting = await Setting.findOne().lean();
    maxAllowed = setting?.defaultMaxDevices || 1;
  }

  // CASE 1: Device is already approved
  if (isAlreadyApproved) {
    await Device.updateOne(
      {
        $or: [{ studentId: user._id }, { userId: user._id }],
        deviceId,
      },
      {
        $set: {
          lastUsedAt: now,
          userAgent,
          ip,
          deviceLabel: label,
          label,
        },
      }
    );

    user.lastLoginAt = now;
    await user.save();

    // Enforce one active session per device: replace old session
    await Session.deleteMany({ userId: user._id, deviceId });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);

    await Session.create({
      userId: user._id,
      deviceId,
      tokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip,
      userAgent,
      revoked: false,
    });

    await setCookie(COOKIE_NAMES.SESSION, rawToken, COOKIE_DURATIONS.SESSION);

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // CASE 2: Device is NOT approved, but student has available slots (e.g. 0 devices or < maxAllowed)
  if (approvedDevices.length < maxAllowed) {
    await Device.findOneAndUpdate(
      {
        $or: [{ studentId: user._id }, { userId: user._id }],
        deviceId,
      },
      {
        $set: {
          studentId: user._id,
          userId: user._id,
          deviceId,
          deviceLabel: label,
          label,
          userAgent,
          ip,
          status: "approved",
          approvedAt: now,
          decidedAt: now,
          requestedAt: now,
          lastUsedAt: now,
        },
      },
      { upsert: true, new: true }
    );

    user.lastLoginAt = now;
    await user.save();

    // One active session per device
    await Session.deleteMany({ userId: user._id, deviceId });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);

    await Session.create({
      userId: user._id,
      deviceId,
      tokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip,
      userAgent,
      revoked: false,
    });

    await setCookie(COOKIE_NAMES.SESSION, rawToken, COOKIE_DURATIONS.SESSION);

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // CASE 3: Device is NOT approved and student has reached their allowed device limit
  // Do NOT log in. Create/update a Device document with status 'pending' (only one pending request per device)
  const existingDeviceDoc = await Device.findOne({
    $or: [{ studentId: user._id }, { userId: user._id }],
    deviceId,
  });

  let deviceDoc;
  if (existingDeviceDoc) {
    existingDeviceDoc.status = "pending";
    existingDeviceDoc.deviceLabel = label;
    existingDeviceDoc.label = label;
    existingDeviceDoc.userAgent = userAgent;
    existingDeviceDoc.ip = ip;
    existingDeviceDoc.requestedAt = now;
    await existingDeviceDoc.save();
    deviceDoc = existingDeviceDoc;
  } else {
    deviceDoc = await Device.create({
      studentId: user._id,
      userId: user._id,
      deviceId,
      deviceLabel: label,
      label,
      userAgent,
      ip,
      status: "pending",
      requestedAt: now,
    });
  }

  // Trigger admin notification (de-duplicated by entityId / deviceDoc._id)
  await createAdminNotification({
    type: "device_request",
    title: "New Device Request",
    message: `New device request from ${user.name || user.loginId || "Student"}`,
    link: "/admin/device-requests",
    entityId: deviceDoc._id.toString(),
  });

  return {
    success: false,
    pendingApproval: true,
    message:
      "This device is not approved. Your account works on one device only. A request has been sent to RD Classes. You can login once the admin approves it.",
  };
}

/**
 * Handles admin login.
 */
export async function adminLogin({ loginId, password }) {
  await connectDB();
  const normalizedId = (loginId || "").trim().toLowerCase();
  const deviceCtx = await resolveDeviceContext();
  const { ip, userAgent } = deviceCtx;

  const userKey = `admin:u:${normalizedId}`;
  const ipKey = `admin:ip:${ip}`;

  const userRate = await checkRateLimit(userKey);
  if (userRate.locked) {
    return { success: false, error: userRate.message };
  }

  const ipRate = await checkRateLimit(ipKey);
  if (ipRate.locked) {
    return { success: false, error: ipRate.message };
  }

  const admin = await User.findOne({
    role: "admin",
    $or: [
      { loginId: (loginId || "").trim() },
      { loginId: normalizedId },
      { email: normalizedId },
    ],
  });

  if (!admin) {
    await comparePasswordDummy(password);
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid login ID or password" };
  }

  const isPasswordValid = await comparePassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid login ID or password" };
  }

  if (admin.status === "blocked") {
    return { success: false, error: "Admin account is blocked." };
  }

  await resetRateLimit(userKey);
  await resetRateLimit(ipKey);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + COOKIE_DURATIONS.ADMIN_SESSION * 1000
  );

  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);

  // Admins do not have single-device lock
  await Session.create({
    userId: admin._id,
    deviceId: "admin-" + crypto.randomUUID(),
    tokenHash,
    role: "admin",
    lastSeenAt: now,
    expiresAt,
    ip,
    userAgent,
    revoked: false,
  });

  await setCookie(
    COOKIE_NAMES.ADMIN_SESSION,
    rawToken,
    COOKIE_DURATIONS.ADMIN_SESSION
  );

  admin.lastLoginAt = now;
  await admin.save();

  return { success: true, redirectTo: "/admin" };
}

/**
 * Log out user (removes active session and clears cookie).
 */
export async function logoutUser(role = "student") {
  await connectDB();
  if (role === "admin") {
    const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
    if (adminToken) {
      await Session.deleteOne({ tokenHash: hashToken(adminToken) });
    }
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
  } else {
    const studentToken = await getCookie(COOKIE_NAMES.SESSION);
    if (studentToken) {
      await Session.deleteOne({ tokenHash: hashToken(studentToken) });
    }
    await deleteCookie(COOKIE_NAMES.SESSION);
  }
}
