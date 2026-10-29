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

function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Handles student login flow with single-device lock policy.
 */
export async function studentLogin({ loginId, password }) {
  await connectDB();
  const cleanId = (loginId || "").trim();
  const upperId = cleanId.toUpperCase();
  const cleanPassword = (password || "").trim();

  const deviceCtx = await resolveDeviceContext();
  const {
    deviceKey,
    deviceType,
    osName,
    browserName,
    model,
    label,
    ip,
    city,
    country,
    userAgent,
  } = deviceCtx;

  // Keyed on IP + student loginId so one student's failure doesn't lock others on a shared network
  const rateLimitKey = `rl:${ip}:${upperId}`;

  // 1. Check rate limits (5 failed attempts per 15 minutes)
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (rateCheck.locked) {
    console.warn(`[AUTH_LOGIN_FAILED] reason=rate_limited loginId=${upperId} ip=${ip}`);
    const mins = Math.max(1, Math.ceil(rateCheck.remainingSec / 60));
    return {
      success: false,
      error: `Too many attempts, try again in ${mins} minutes`,
      reason: "rate_limited",
    };
  }

  // 2. Lookup student by loginId (case-insensitive), email, or phone
  let user;
  try {
    user = await User.findOne({
      role: "student",
      $or: [
        { loginId: upperId },
        { loginId: cleanId },
        { loginId: { $regex: new RegExp(`^${escapeRegex(cleanId)}$`, "i") } },
        { email: cleanId.toLowerCase() },
        { phone: cleanId },
      ],
    });
  } catch (dbErr) {
    console.error("[AUTH_LOGIN_ERROR] reason=db_error", dbErr.message);
    return {
      success: false,
      error: "Server error (code DB_ERR), contact RD Classes",
      reason: "db_error",
    };
  }

  if (!user) {
    await comparePasswordDummy(cleanPassword);
    await recordFailedAttempt(rateLimitKey, 5);
    console.warn(`[AUTH_LOGIN_FAILED] reason=user_not_found loginId=${upperId} ip=${ip}`);
    return {
      success: false,
      error: "Invalid login ID or password",
      reason: "user_not_found",
    };
  }

  // 3. Password check
  let isPasswordValid = false;
  try {
    isPasswordValid = await comparePassword(cleanPassword, user.passwordHash);
  } catch (err) {
    console.error("[AUTH_LOGIN_ERROR] reason=config_error", err.message);
    return {
      success: false,
      error: "Server error (code AUTH_CFG), contact RD Classes",
      reason: "config_error",
    };
  }

  if (!isPasswordValid) {
    await recordFailedAttempt(rateLimitKey, 5);
    console.warn(`[AUTH_LOGIN_FAILED] reason=wrong_password loginId=${upperId} ip=${ip}`);
    return {
      success: false,
      error: "Invalid login ID or password",
      reason: "wrong_password",
    };
  }

  // 4. Blocked check (only after password verification)
  if (user.status === "blocked") {
    console.warn(`[AUTH_LOGIN_BLOCKED] reason=blocked loginId=${upperId} ip=${ip}`);
    return {
      success: false,
      error: "Your account has been deactivated. Please contact RD Classes administration.",
      reason: "blocked",
    };
  }

  // Clear rate limits on successful authentication
  await resetRateLimit(rateLimitKey);

  const now = new Date();
  const sessionExpiresAt = new Date(
    now.getTime() + COOKIE_DURATIONS.SESSION * 1000
  );

  // 5. Query approved devices for this student
  const approvedDevices = await Device.find({
    $or: [{ studentId: user._id }, { userId: user._id }],
    status: "approved",
  });

  const matchingApproved = approvedDevices.find(
    (d) => d.deviceKey === deviceKey || d.deviceId === deviceKey
  );

  let maxAllowed = user.maxDevices;
  if (!maxAllowed || maxAllowed < 1) {
    const setting = await Setting.findOne().lean();
    maxAllowed = setting?.defaultMaxDevices || 1;
  }

  // CASE 1: Device is already approved
  if (matchingApproved) {
    const activeDeviceId = matchingApproved.deviceId || matchingApproved.deviceKey || deviceKey;
    await Device.updateOne(
      { _id: matchingApproved._id },
      {
        $set: {
          lastUsedAt: now,
          lastIp: ip,
          ip,
          browser: browserName,
          userAgent,
          city: city || matchingApproved.city || "",
          country: country || matchingApproved.country || "",
        },
      }
    );

    user.lastLoginAt = now;
    user.lastLoginIp = ip;
    await user.save();

    // Enforce one active session per device: replace old session
    await Session.deleteMany({ userId: user._id, deviceId: activeDeviceId });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);

    await Session.create({
      userId: user._id,
      deviceId: activeDeviceId,
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

  // CASE 2: Device is NOT approved, but student has available slots (e.g. first login or < maxAllowed)
  if (approvedDevices.length < maxAllowed) {
    await Device.findOneAndUpdate(
      {
        $or: [{ studentId: user._id }, { userId: user._id }],
        $or: [{ deviceKey }, { deviceId: deviceKey }],
      },
      {
        $set: {
          studentId: user._id,
          userId: user._id,
          deviceId: deviceKey,
          deviceKey,
          deviceType,
          os: osName,
          browser: browserName,
          model,
          city,
          country,
          lastIp: ip,
          ip,
          deviceLabel: label,
          label,
          userAgent,
          status: "approved",
          firstLoginAt: now,
          lastUsedAt: now,
          approvedAt: now,
          decidedAt: now,
          requestedAt: now,
        },
      },
      { upsert: true, new: true }
    );

    user.lastLoginAt = now;
    user.lastLoginIp = ip;
    await user.save();

    // One active session per device
    await Session.deleteMany({ userId: user._id, deviceId: deviceKey });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);

    await Session.create({
      userId: user._id,
      deviceId: deviceKey,
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
  console.warn(
    `[AUTH_LOGIN_PENDING] reason=device_pending loginId=${upperId} ip=${ip} deviceKey=${deviceKey}`
  );

  let pendingDoc = await Device.findOne({
    $or: [{ studentId: user._id }, { userId: user._id }],
    $or: [{ deviceKey }, { deviceId: deviceKey }],
  });

  if (pendingDoc) {
    pendingDoc.status = "pending";
    pendingDoc.lastAttemptAt = now;
    pendingDoc.lastIp = ip;
    pendingDoc.ip = ip;
    pendingDoc.userAgent = userAgent;
    pendingDoc.browser = browserName;
    pendingDoc.deviceType = deviceType;
    pendingDoc.os = osName;
    pendingDoc.model = model;
    pendingDoc.city = city;
    pendingDoc.country = country;
    pendingDoc.deviceLabel = label;
    pendingDoc.label = label;
    await pendingDoc.save();
  } else {
    pendingDoc = await Device.create({
      studentId: user._id,
      userId: user._id,
      deviceId: deviceKey,
      deviceKey,
      deviceType,
      os: osName,
      browser: browserName,
      model,
      city,
      country,
      lastIp: ip,
      ip,
      deviceLabel: label,
      label,
      userAgent,
      status: "pending",
      requestedAt: now,
      lastAttemptAt: now,
    });
  }

  // Trigger admin notification
  await createAdminNotification({
    type: "device_request",
    title: "New Device Request",
    message: `New device request from ${user.name || user.loginId || "Student"}`,
    link: "/admin/device-requests",
    entityId: pendingDoc._id.toString(),
  });

  const pendingNotice =
    "This account is registered on another device. You cannot log in here. A request has been sent to RD Classes. You can log in after the admin approves this device.";

  return {
    success: false,
    pendingApproval: true,
    reason: "device_pending",
    message: pendingNotice,
    error: pendingNotice,
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
