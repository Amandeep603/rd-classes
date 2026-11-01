import "server-only";
import crypto from "crypto";
import { headers } from "next/headers";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
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
import {
  parseClientHints,
  parseServerSignals,
  computeProfile,
  computeProfileBucket,
  computeDedupeKey,
  matchDevice,
  computeDeviceDifferences,
} from "./deviceIdentity.js";
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

  // Extract signals and hints
  const headerList = await headers();
  const rawHintsCookie = await getCookie(COOKIE_NAMES.HINTS);
  const clientHints = parseClientHints(rawHintsCookie);
  const signals = parseServerSignals(
    headerList.get("user-agent") || "",
    headerList,
    clientHints
  );
  const profile = computeProfile(signals, clientHints);
  const ip = signals.ip;

  // Keyed on IP + student loginId so one student's failure doesn't lock others on a shared network
  const rateLimitKey = `rl:${ip}:${upperId}`;

  // 1. Check rate limits (5 failed attempts per 15 minutes)
  const rateCheck = await checkRateLimit(rateLimitKey);
  if (rateCheck.locked) {
    const mins = Math.max(1, Math.ceil(rateCheck.remainingSec / 60));
    console.warn(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=rate_limited ip=${ip} remainingMin=${mins}`
    );
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
    console.error(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=db_error ip=${ip} error=${dbErr.message}`
    );
    return {
      success: false,
      error: "Server error (code DB_ERR), contact RD Classes",
      reason: "db_error",
    };
  }

  if (!user) {
    await comparePasswordDummy(cleanPassword);
    await recordFailedAttempt(rateLimitKey, 5);
    console.warn(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=user_not_found ip=${ip}`
    );
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
    console.error(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=config_error ip=${ip} error=${err.message}`
    );
    return {
      success: false,
      error: "Server error (code AUTH_CFG), contact RD Classes",
      reason: "config_error",
    };
  }

  if (!isPasswordValid) {
    await recordFailedAttempt(rateLimitKey, 5);
    console.warn(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=wrong_password ip=${ip}`
    );
    return {
      success: false,
      error: "Invalid login ID or password",
      reason: "wrong_password",
    };
  }

  // 4. Blocked check (only after password verification)
  if (user.status === "blocked") {
    console.warn(
      `[STUDENT_LOGIN] timestamp=${new Date().toISOString()} loginId=${upperId} result=blocked ip=${ip}`
    );
    return {
      success: false,
      error: "Your account has been deactivated. Please contact RD Classes administration.",
      reason: "blocked",
    };
  }

  // Clear rate limits on successful authentication
  await resetRateLimit(rateLimitKey);

  const now = new Date();
  // 30-day sliding safety cap for session in database
  const sessionExpiresAt = new Date(
    now.getTime() + COOKIE_DURATIONS.SESSION * 1000
  );

  // 5. Query approved devices for this student
  const approvedDevices = await Device.find({
    studentId: user._id,
    status: "approved",
  });

  const setting = await Setting.findOne().lean();
  const rawMode = setting?.deviceLockMode;
  const deviceLockMode = rawMode === "relaxed" ? "smart" : rawMode || "smart";

  // Check rd_device cookie
  const rawDeviceCookie = await getCookie(COOKIE_NAMES.DEVICE);
  let cookieTokenHash = null;
  if (rawDeviceCookie) {
    cookieTokenHash = crypto
      .createHash("sha256")
      .update(rawDeviceCookie)
      .digest("hex");
  }

  // CASE 1: Student has zero approved devices -> Auto-register current device
  if (approvedDevices.length === 0) {
    const rawDeviceToken = rawDeviceCookie || crypto.randomUUID();
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawDeviceToken)
      .digest("hex");
    const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");

    await Device.create({
      studentId: user._id,
      userId: user._id,
      deviceId: newDeviceId,
      deviceKey: newDeviceId,
      coarseKey: signals.coarseKey,
      deviceType: signals.deviceType,
      osFamily: signals.osFamily,
      os: signals.osName,
      osVersion: signals.osVersion,
      browser: signals.browserName,
      browserName: signals.browserName,
      browserVersion: signals.browserVersion,
      browsersSeen: [signals.browserName],
      model: signals.model,
      profile: profile || null,
      aliases: [],
      browserTokenHashes: [tokenHash],
      city: signals.city,
      region: signals.region,
      country: signals.country,
      timezone: signals.timezone,
      firstIp: signals.ip,
      lastIp: signals.ip,
      ip: signals.ip,
      firstLoginAt: now,
      lastUsedAt: now,
      approvedAt: now,
      decidedAt: now,
      loginAttempts: 1,
      deviceLabel: signals.label,
      label: signals.label,
      userAgent: signals.userAgent,
      status: "approved",
    });

    // Set 1-year rd_device cookie
    await setCookie(
      COOKIE_NAMES.DEVICE,
      rawDeviceToken,
      COOKIE_DURATIONS.DEVICE
    );

    user.lastLoginAt = now;
    user.lastLoginIp = signals.ip;
    user.deviceCount = 1;
    await user.save();

    // Replace any old active session for student
    await Session.deleteMany({ userId: user._id });

    const rawSessionToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawSessionToken);

    await Session.create({
      userId: user._id,
      deviceId: newDeviceId,
      tokenHash: sessionTokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip: signals.ip,
      userAgent: signals.userAgent,
      revoked: false,
    });

    // Browser session cookie (no Max-Age/Expires)
    await setCookie(COOKIE_NAMES.STUDENT_SESSION, rawSessionToken);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_registered deviceId=${newDeviceId} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // CASE 2: Match against student's approved devices
  const matchResult = matchDevice({
    signals,
    profile,
    cookieTokenHash,
    approvedDevices,
    deviceLockMode,
  });

  if (matchResult.matched && matchResult.device) {
    const matchedDevice = matchResult.device;
    const activeDeviceId = matchedDevice.deviceId;

    // Update lastUsedAt, lastIp, location, browsersSeen
    matchedDevice.lastUsedAt = now;
    matchedDevice.lastIp = signals.ip;
    matchedDevice.ip = signals.ip;
    if (signals.city) matchedDevice.city = signals.city;
    if (signals.country) matchedDevice.country = signals.country;
    if (signals.region) matchedDevice.region = signals.region;
    if (signals.timezone) matchedDevice.timezone = signals.timezone;
    matchedDevice.loginAttempts = (matchedDevice.loginAttempts || 1) + 1;

    if (!Array.isArray(matchedDevice.browsersSeen)) {
      matchedDevice.browsersSeen = [];
    }
    if (!matchedDevice.browsersSeen.includes(signals.browserName)) {
      matchedDevice.browsersSeen.push(signals.browserName);
    }

    // Legacy device profile learning
    if (matchResult.shouldLearnProfile && profile) {
      matchedDevice.profile = profile;
    }

    // Continuity: ensure rd_device cookie token hash is added to browserTokenHashes
    let activeDeviceToken = rawDeviceCookie;
    if (!activeDeviceToken) {
      activeDeviceToken = crypto.randomUUID();
    }
    const tokenHash = crypto
      .createHash("sha256")
      .update(activeDeviceToken)
      .digest("hex");

    if (!Array.isArray(matchedDevice.browserTokenHashes)) {
      matchedDevice.browserTokenHashes = [];
    }
    if (!matchedDevice.browserTokenHashes.includes(tokenHash)) {
      matchedDevice.browserTokenHashes.push(tokenHash);
      if (matchedDevice.browserTokenHashes.length > 10) {
        matchedDevice.browserTokenHashes.shift();
      }
    }

    await setCookie(
      COOKIE_NAMES.DEVICE,
      activeDeviceToken,
      COOKIE_DURATIONS.DEVICE
    );
    await matchedDevice.save();

    user.lastLoginAt = now;
    user.lastLoginIp = signals.ip;
    await user.save();

    // Replace any active session on this device
    await Session.deleteMany({
      userId: user._id,
      deviceId: activeDeviceId,
    });

    const rawSessionToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawSessionToken);

    await Session.create({
      userId: user._id,
      deviceId: activeDeviceId,
      tokenHash: sessionTokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip: signals.ip,
      userAgent: signals.userAgent,
      revoked: false,
    });

    // Browser session cookie (no Max-Age/Expires)
    await setCookie(COOKIE_NAMES.STUDENT_SESSION, rawSessionToken);

    if (matchResult.failOpen) {
      console.warn(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=hints_missing deviceId=${activeDeviceId} ip=${signals.ip}`
      );
    } else {
      console.log(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_matched deviceId=${activeDeviceId} ip=${signals.ip}`
      );
    }

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // CASE 3: NO MATCH -> Second device flow
  const dedupeKey = computeDedupeKey(
    user._id.toString(),
    signals.coarseKey,
    profile
  );

  // Check if a REJECTED request exists with the same key
  const rejectedReq = await DeviceRequest.findOne({
    studentId: user._id,
    dedupeKey,
    status: "rejected",
  });

  if (rejectedReq) {
    rejectedReq.attemptCount = (rejectedReq.attemptCount || 1) + 1;
    rejectedReq.lastAttemptAt = now;
    rejectedReq.ip = signals.ip;
    await rejectedReq.save();

    console.warn(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_rejected dedupeKey=${dedupeKey} ip=${signals.ip}`
    );

    return {
      success: false,
      error:
        "Your request for this device was declined. Please contact RD Classes.",
      reason: "device_rejected",
    };
  }

  // Ensure rd_device token cookie is set for continuity across requests
  let reqDeviceToken = rawDeviceCookie;
  if (!reqDeviceToken) {
    reqDeviceToken = crypto.randomUUID();
  }
  const reqTokenHash = crypto
    .createHash("sha256")
    .update(reqDeviceToken)
    .digest("hex");
  await setCookie(
    COOKIE_NAMES.DEVICE,
    reqDeviceToken,
    COOKIE_DURATIONS.DEVICE
  );

  // Check if a PENDING request exists with the same key
  let pendingReq = await DeviceRequest.findOne({
    studentId: user._id,
    dedupeKey,
    status: "pending",
  });

  if (pendingReq) {
    pendingReq.attemptCount = (pendingReq.attemptCount || 1) + 1;
    pendingReq.lastAttemptAt = now;
    pendingReq.ip = signals.ip;
    if (signals.city) pendingReq.city = signals.city;
    if (signals.region) pendingReq.region = signals.region;
    if (signals.country) pendingReq.country = signals.country;
    pendingReq.tokenHash = reqTokenHash;
    await pendingReq.save();
  } else {
    // Find closest approved device to calculate flags
    const closest =
      approvedDevices.find((d) => d.coarseKey === signals.coarseKey) ||
      approvedDevices[0];
    const flags = computeDeviceDifferences(signals, profile, closest);
    const newReqDeviceId = "req_" + crypto.randomBytes(8).toString("hex");

    pendingReq = await DeviceRequest.create({
      studentId: user._id,
      userId: user._id,
      dedupeKey,
      deviceId: newReqDeviceId,
      coarseKey: signals.coarseKey,
      deviceType: signals.deviceType,
      osFamily: signals.osFamily,
      osName: signals.osName,
      osVersion: signals.osVersion,
      browserName: signals.browserName,
      browserVersion: signals.browserVersion,
      model: signals.model,
      label: signals.label,
      profile: profile || null,
      bucketKey: computeProfileBucket(profile),
      tokenHash: reqTokenHash,
      userAgent: signals.userAgent,
      ip: signals.ip,
      city: signals.city,
      region: signals.region,
      country: signals.country,
      timezone: signals.timezone,
      flags,
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      status: "pending",
    });

    // Create admin notification
    await createAdminNotification({
      type: "device_request",
      title: `New Device Request: ${user.name}`,
      message: `${user.name} (${user.loginId}) requested login from ${signals.label}.`,
      link: "/admin/device-requests",
      meta: {
        studentId: user._id.toString(),
        studentName: user.name,
        loginId: user.loginId,
        requestId: pendingReq._id.toString(),
        label: signals.label,
      },
    }).catch(() => {});
  }

  console.warn(
    `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_pending dedupeKey=${dedupeKey} ip=${signals.ip}`
  );

  const pendingMsg =
    "This account is registered on another device. You cannot log in here. A request has been sent to RD Classes. You can log in after the admin approves this device.";

  return {
    success: false,
    pendingApproval: true,
    error: pendingMsg,
    message: pendingMsg,
    reason: "device_pending",
    deviceId: pendingReq.deviceId,
  };
}

/**
 * Handles admin login.
 */
export async function adminLogin({ loginId, password }) {
  await connectDB();
  const normalizedId = (loginId || "").trim().toLowerCase();
  const headerList = await headers();
  const rawHintsCookie = await getCookie(COOKIE_NAMES.HINTS);
  const clientHints = parseClientHints(rawHintsCookie);
  const signals = parseServerSignals(
    headerList.get("user-agent") || "",
    headerList,
    clientHints
  );
  const { ip, userAgent } = signals;

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
    const studentToken =
      (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
      (await getCookie(COOKIE_NAMES.LEGACY_SESSION));
    if (studentToken) {
      await Session.deleteOne({ tokenHash: hashToken(studentToken) });
    }
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
  }
}
