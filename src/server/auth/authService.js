import "server-only";
import crypto from "crypto";
import mongoose from "mongoose";
import { headers } from "next/headers";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
import { Session } from "../../lib/models/Session.ts";
import { Setting } from "../../lib/models/Setting.ts";
import { createOrReplaceSession } from "./session.js";
export { createOrReplaceSession } from "./session.js";
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
  computeRequestFlags,
  deriveSlot,
  isInAppBrowser,
} from "./deviceIdentity.js";
import { DeviceHistory } from "../../lib/models/DeviceHistory.ts";
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

  // 0. Detect in-app browsers and WebViews
  if (isInAppBrowser(signals.userAgent)) {
    return {
      success: false,
      error: "Please open rd-classes.in in Chrome or Safari to log in (tap the menu and choose Open in browser)",
      reason: "in_app_browser",
    };
  }

  // 0b. Test cookie check
  const rawTestCookie = await getCookie(COOKIE_NAMES.TEST);
  const rawDeviceCookie = await getCookie(COOKIE_NAMES.DEVICE);
  const rawPendingCookie = await getCookie(COOKIE_NAMES.PENDING);
  if (!rawTestCookie && !rawHintsCookie && !rawDeviceCookie && !rawPendingCookie) {
    return {
      success: false,
      error: "Please enable cookies and do not use private browsing.",
      reason: "cookies_disabled",
    };
  }

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

  // Settings
  const setting = await Setting.findOne().lean();
  const deviceBinding =
    setting?.deviceBinding || (setting?.deviceLockMode === "smart" ? "smart" : "browser");

  // Fetch approved devices of student
  const approvedDevices = await Device.find({
    studentId: user._id,
    status: "approved",
  });

  let incomingTokenHash = null;
  if (rawDeviceCookie) {
    incomingTokenHash = crypto
      .createHash("sha256")
      .update(rawDeviceCookie)
      .digest("hex");
  }

  // Check if incoming cookie belongs to a replaced device of this student
  let replacedDevice = null;
  if (incomingTokenHash) {
    replacedDevice = await Device.findOne({
      studentId: user._id,
      status: "replaced",
      $or: [
        { browserTokenHashes: incomingTokenHash },
        { tokenHashes: incomingTokenHash },
      ],
    });
  }

  // Helper to create and set a session without revoking existing sessions
  const createStudentSession = async (deviceId) => {
    const rawSessionToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawSessionToken);

    await createOrReplaceSession({
      userId: user._id,
      deviceId,
      tokenHash: sessionTokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip: signals.ip,
      userAgent: signals.userAgent,
      role: "student",
    });

    await setCookie(COOKIE_NAMES.STUDENT_SESSION, rawSessionToken);
    return rawSessionToken;
  };

  // Helper to issue fresh rd_device token (random 32 bytes, httpOnly, Secure, SameSite=Lax, path /, 1 year)
  const issueDeviceToken = async () => {
    const freshToken = crypto.randomBytes(32).toString("base64url");
    const freshHash = crypto.createHash("sha256").update(freshToken).digest("hex");
    await setCookie(COOKIE_NAMES.DEVICE, freshToken, COOKIE_DURATIONS.DEVICE);
    return { token: freshToken, hash: freshHash };
  };

  // Run device match according to policy
  const matchResult = matchDevice({
    signals,
    profile,
    cookieTokenHash: incomingTokenHash,
    approvedDevices,
    deviceBinding,
  });

  // STEP 3.1: MATCH -> Allow and rotate/learn token
  if (matchResult.matched) {
    const matchedDevice = matchResult.device;
    const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();

    if (!Array.isArray(matchedDevice.browserTokenHashes)) {
      matchedDevice.browserTokenHashes = [];
    }
    if (!Array.isArray(matchedDevice.tokenHashes)) {
      matchedDevice.tokenHashes = [];
    }

    if (matchResult.isLearnedMatch) {
      // Step 3.3: Grace for old records - device learns this cookie once
      matchedDevice.browserTokenHashes.push(freshTokenHash);
      matchedDevice.tokenHashes.push(freshTokenHash);
      console.log(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_cookie_learned deviceId=${matchedDevice.deviceId} slot=${signals.slot}`
      );
    } else {
      // Step 3.1: Normal cookie match - rotate token, previous remains valid 10 min
      if (incomingTokenHash) {
        matchedDevice.browserTokenHashes = matchedDevice.browserTokenHashes.filter(
          (h) => h !== incomingTokenHash
        );
        matchedDevice.tokenHashes = matchedDevice.tokenHashes.filter(
          (h) => h !== incomingTokenHash
        );

        if (!Array.isArray(matchedDevice.graceTokenHashes)) {
          matchedDevice.graceTokenHashes = [];
        }
        matchedDevice.graceTokenHashes.push({
          hash: incomingTokenHash,
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        });
      }

      matchedDevice.browserTokenHashes.push(freshTokenHash);
      if (matchedDevice.browserTokenHashes.length > 10) {
        matchedDevice.browserTokenHashes.shift();
      }
      matchedDevice.tokenHashes.push(freshTokenHash);
      if (matchedDevice.tokenHashes.length > 10) {
        matchedDevice.tokenHashes.shift();
      }
    }

    matchedDevice.lastUsedAt = now;
    matchedDevice.lastIp = signals.ip;
    matchedDevice.ip = signals.ip;
    if (signals.city) matchedDevice.city = signals.city;
    if (signals.region) matchedDevice.region = signals.region;
    if (signals.country) matchedDevice.country = signals.country;
    if (signals.timezone) matchedDevice.timezone = signals.timezone;
    matchedDevice.loginAttempts = (matchedDevice.loginAttempts || 1) + 1;
    if (!Array.isArray(matchedDevice.browsersSeen)) {
      matchedDevice.browsersSeen = [];
    }
    if (!matchedDevice.browsersSeen.includes(signals.browserName)) {
      matchedDevice.browsersSeen.push(signals.browserName);
    }
    await matchedDevice.save();

    user.lastLoginAt = now;
    user.lastLoginIp = signals.ip;
    await user.save();

    await createStudentSession(matchedDevice.deviceId);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_matched deviceId=${matchedDevice.deviceId} slot=${signals.slot} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // If cookie matched another slot or OS family, log device_cookie_mismatch
  if (matchResult.isCopiedCookie) {
    console.warn(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_cookie_mismatch slot=${signals.slot} ip=${signals.ip}`
    );
  }

  // STEP 3.2: Student has zero approved devices -> register current device as approved
  // Atomic: only one first device can win a race across slots; loser becomes pending request
  const totalApproved = approvedDevices.length;
  if (totalApproved === 0) {
    const wonFirstLoginRace = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [{ deviceCount: 0 }, { deviceCount: { $exists: false } }, { deviceCount: null }],
      },
      { $set: { deviceCount: 1 } },
      { returnDocument: "after" }
    );

    if (wonFirstLoginRace) {
      const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
      const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");

      await Device.create({
        studentId: user._id,
        userId: user._id,
        deviceId: newDeviceId,
        deviceKey: newDeviceId,
        slot: signals.slot,
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
        browserTokenHashes: [freshTokenHash],
        tokenHashes: [freshTokenHash],
        graceTokenHashes: [],
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

      await DeviceHistory.create({
        studentId: user._id,
        slot: signals.slot,
        event: "registered",
        deviceId: newDeviceId,
        deviceLabel: signals.label,
        ip: signals.ip,
        city: signals.city,
        adminName: "system",
      }).catch(() => {});

      user.lastLoginAt = now;
      user.lastLoginIp = signals.ip;
      await user.save();

      await createStudentSession(newDeviceId);

      console.log(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_registered deviceId=${newDeviceId} slot=${signals.slot} ip=${signals.ip}`
      );

      return {
        success: true,
        redirectTo: "/student",
      };
    }
  }

  // STEP 3.4: Otherwise NO MATCH -> do NOT create session, do NOT set session cookie.
  // Issue or use request token (rd_device): that token only becomes a device token on approval.
  let reqToken = rawDeviceCookie;
  let reqTokenHash = incomingTokenHash;
  if (!reqToken || !reqTokenHash) {
    const issued = await issueDeviceToken();
    reqToken = issued.token;
    reqTokenHash = issued.hash;
  }

  // Check if a REJECTED request exists for that token
  const rejectedReq = await DeviceRequest.findOne({
    studentId: user._id,
    $or: [{ requestTokenHash: reqTokenHash }, { tokenHash: reqTokenHash }],
    status: "rejected",
  });

  if (rejectedReq) {
    rejectedReq.attemptCount = (rejectedReq.attemptCount || 1) + 1;
    rejectedReq.lastAttemptAt = now;
    rejectedReq.ip = signals.ip;
    if (signals.city) rejectedReq.city = signals.city;
    await rejectedReq.save();

    const declinedMsg = "Your request for this device was declined. Please contact RD Classes.";
    console.warn(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_declined reqTokenHash=${reqTokenHash} ip=${signals.ip}`
    );

    return {
      success: false,
      pendingApproval: false,
      isRejected: true,
      error: declinedMsg,
      message: declinedMsg,
      reason: "device_rejected",
    };
  }

  // Find occupied device for this slot
  const occupiedDevice = approvedDevices.find((d) => deriveSlot(d) === signals.slot);
  const flags = computeRequestFlags({
    signals,
    profile,
    occupiedDevice,
    isCopiedCookie: matchResult.isCopiedCookie,
    replacedDevice,
  });

  const dedupeKey = computeDedupeKey(user._id, reqTokenHash, profile, signals.slot);

  let pendingReq = await DeviceRequest.findOne({
    studentId: user._id,
    status: "pending",
    $or: [
      { requestTokenHash: reqTokenHash },
      { tokenHash: reqTokenHash },
      { dedupeKey },
    ],
  });

  if (pendingReq) {
    pendingReq.attemptCount = (pendingReq.attemptCount || 1) + 1;
    pendingReq.lastAttemptAt = now;
    pendingReq.ip = signals.ip;
    if (signals.city) pendingReq.city = signals.city;
    if (signals.region) pendingReq.region = signals.region;
    if (signals.country) pendingReq.country = signals.country;
    pendingReq.flags = flags;
    if (replacedDevice?.deviceId && !pendingReq.previousDeviceId) {
      pendingReq.previousDeviceId = replacedDevice.deviceId;
    }
    if (!pendingReq.requestTokenHash) pendingReq.requestTokenHash = reqTokenHash;
    if (!pendingReq.tokenHash) pendingReq.tokenHash = reqTokenHash;
    await pendingReq.save();
  } else {
    const newReqDeviceId = "req_" + crypto.randomBytes(8).toString("hex");

    pendingReq = await DeviceRequest.create({
      studentId: user._id,
      userId: user._id,
      slot: signals.slot,
      dedupeKey,
      deviceId: newReqDeviceId,
      tokenHash: reqTokenHash,
      requestTokenHash: reqTokenHash,
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
      userAgent: signals.userAgent,
      ip: signals.ip,
      city: signals.city,
      region: signals.region,
      country: signals.country,
      timezone: signals.timezone,
      flags,
      previousDeviceId: replacedDevice ? replacedDevice.deviceId : null,
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      status: "pending",
    });

    await createAdminNotification({
      type: "device_request",
      title: `New Device Request: ${user.name}`,
      message: `${user.name} (${user.loginId}) requested login from ${signals.label} (${signals.slot}).`,
      link: "/admin/device-requests",
      meta: {
        studentId: user._id.toString(),
        studentName: user.name,
        loginId: user.loginId,
        requestId: pendingReq._id.toString(),
        label: signals.label,
        slot: signals.slot,
      },
    }).catch(() => {});
  }

  // Exact student messages
  let message = "";
  if (replacedDevice) {
    message = "This device was replaced. Please log in again to request access.";
  } else if (occupiedDevice) {
    const slotWord = signals.slot === "handheld" ? "phone" : "laptop";
    message = `This account is registered on another device. Only one phone and one laptop can be used per account. A request has been sent to RD Classes. You can log in here after the admin approves it. Always use the same browser and do not use private mode. Approving this device will log out your earlier ${slotWord}.`;
  } else {
    message =
      "This account is registered on another device. Only one phone and one laptop can be used per account. A request has been sent to RD Classes. You can log in here after the admin approves it. Always use the same browser and do not use private mode.";
  }

  console.warn(
    `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_pending reqTokenHash=${reqTokenHash} ip=${signals.ip}`
  );

  return {
    success: false,
    pendingApproval: true,
    error: message,
    message,
    reason: replacedDevice ? "device_replaced" : "device_pending",
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
  await createOrReplaceSession({
    userId: admin._id,
    deviceId: "admin-" + crypto.randomUUID(),
    tokenHash,
    role: "admin",
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
 * Completely idempotent: safe to call repeatedly or on already-deleted sessions.
 */
export async function logoutUser(role = "student") {
  await connectDB();
  try {
    if (role === "admin") {
      const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
      if (adminToken) {
        await Session.deleteOne({ tokenHash: hashToken(adminToken) }).catch(() => {});
      }
      await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    } else {
      const studentToken =
        (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
        (await getCookie(COOKIE_NAMES.LEGACY_SESSION));
      if (studentToken) {
        await Session.deleteOne({ tokenHash: hashToken(studentToken) }).catch(() => {});
      }
      await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
      await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    }
  } catch (err) {
    // Idempotent logout - never fail
  }
}
