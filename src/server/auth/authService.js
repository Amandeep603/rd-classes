import "server-only";
import connectDB from "../db/connect.js";
import { User } from "../db/models/User.js";
import { Device } from "../db/models/Device.js";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
import { Session } from "../db/models/Session.js";
import { comparePassword, comparePasswordDummy } from "./password.js";
import { generateSessionToken, hashToken } from "./tokens.js";
import {
  setCookie,
  deleteCookie,
  COOKIE_NAMES,
  COOKIE_DURATIONS,
} from "./cookies.js";
import { resolveDeviceContext } from "./device.js";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "./rateLimit.js";

/**
 * Handles student login flow with single-device lock policy.
 */
export async function studentLogin({ loginId, password }) {
  await connectDB();
  const normalizedId = (loginId || "").trim().toLowerCase();

  const deviceCtx = await resolveDeviceContext();
  const { deviceId, label, userAgent, ip } = deviceCtx;

  const userKey = `u:${normalizedId}`;
  const ipKey = `ip:${ip}`;

  // 1. Check rate limits
  const userRate = await checkRateLimit(userKey);
  if (userRate.locked) {
    return { success: false, error: userRate.message };
  }

  const ipRate = await checkRateLimit(ipKey);
  if (ipRate.locked) {
    return { success: false, error: ipRate.message };
  }

  // 2. Lookup user
  const user = await User.findOne({
    loginId: normalizedId,
    role: "student",
  });

  if (!user) {
    // Run dummy compare to eliminate timing side-channel
    await comparePasswordDummy(password);
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid ID or password" };
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid ID or password" };
  }

  // Only after password is confirmed, check for blocked status
  if (user.status === "blocked") {
    return {
      success: false,
      error: "Your account is blocked. Please contact RD Classes administration.",
    };
  }

  // Clear rate-limits upon valid authentication
  await resetRateLimit(userKey);
  await resetRateLimit(ipKey);

  const now = new Date();
  const sessionExpiresAt = new Date(
    now.getTime() + COOKIE_DURATIONS.SESSION * 1000
  );

  // 3a. Device already approved for this user
  const existingDevice = await Device.findOne({
    userId: user._id,
    deviceId,
  });

  if (existingDevice) {
    existingDevice.lastUsedAt = now;
    existingDevice.userAgent = userAgent;
    existingDevice.ip = ip;
    await existingDevice.save();

    user.lastLoginAt = now;
    await user.save();

    // Remove any existing session for this device
    await Session.deleteMany({ userId: user._id, deviceId });

    // Issue session
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
    });

    await setCookie(COOKIE_NAMES.SESSION, rawToken, COOKIE_DURATIONS.SESSION);

    return {
      success: true,
      redirectTo: user.mustChangePassword ? "/student/account" : "/student",
    };
  }

  // 3b. First-login auto-registration (deviceCount === 0)
  if (user.deviceCount === 0) {
    // Atomically increment deviceCount from 0 to 1
    const updateResult = await User.updateOne(
      { _id: user._id, deviceCount: 0 },
      { $inc: { deviceCount: 1 }, $set: { lastLoginAt: now } }
    );

    if (updateResult.modifiedCount === 1) {
      try {
        await Device.create({
          userId: user._id,
          deviceId,
          label,
          userAgent,
          ip,
          approvedAt: now,
          approvedBy: "auto-first-login",
          lastUsedAt: now,
        });

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
        });

        await setCookie(
          COOKIE_NAMES.SESSION,
          rawToken,
          COOKIE_DURATIONS.SESSION
        );

        return {
          success: true,
          redirectTo: user.mustChangePassword ? "/student/account" : "/student",
        };
      } catch (err) {
        // Rollback deviceCount if device/session creation failed
        await User.updateOne({ _id: user._id }, { $inc: { deviceCount: -1 } });
        throw err;
      }
    }
  }

  // 3c. Otherwise: new device with no free slot -> NO session
  // Check if a pending request already exists for this device (reuse)
  let deviceRequest = await DeviceRequest.findOne({
    userId: user._id,
    deviceId,
    status: "pending",
  });

  if (!deviceRequest) {
    // Rate limit: at most 5 new requests per user in 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentRequestsCount = await DeviceRequest.countDocuments({
      userId: user._id,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (recentRequestsCount >= 5) {
      return {
        success: false,
        error:
          "Too many pending device requests within 24 hours. Please contact RD Classes support.",
      };
    }

    deviceRequest = await DeviceRequest.create({
      userId: user._id,
      deviceId,
      label,
      userAgent,
      ip,
      status: "pending",
    });
  } else {
    deviceRequest.label = label;
    deviceRequest.userAgent = userAgent;
    deviceRequest.ip = ip;
    await deviceRequest.save();
  }

  return {
    success: false,
    status: "pending",
    redirectTo: `/student/login/pending?deviceId=${encodeURIComponent(
      deviceId
    )}`,
    deviceRequest: {
      label: deviceRequest.label,
      createdAt: deviceRequest.createdAt,
    },
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
    loginId: normalizedId,
    role: "admin",
  });

  if (!admin) {
    await comparePasswordDummy(password);
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid Admin ID or password" };
  }

  const isPasswordValid = await comparePassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    await recordFailedAttempt(userKey, 5);
    await recordFailedAttempt(ipKey, 20);
    return { success: false, error: "Invalid Admin ID or password" };
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
    lastSeenAt: now,
    expiresAt,
    ip,
    userAgent,
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
