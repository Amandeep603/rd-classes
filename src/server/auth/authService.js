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

  // Settings
  const setting = await Setting.findOne().lean();
  const rawMode = setting?.deviceLockMode;
  const deviceLockMode = rawMode === "relaxed" ? "strict" : rawMode || "strict";

  // Check incoming cookies: rd_device and rd_pending
  const rawDeviceCookie = await getCookie(COOKIE_NAMES.DEVICE);
  const rawPendingCookie = await getCookie(COOKIE_NAMES.PENDING);
  const pendingId = rawPendingCookie ? String(rawPendingCookie).trim() : null;

  // Helper to create and set a session without revoking existing sessions
  const createStudentSession = async (deviceId) => {
    const rawSessionToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawSessionToken);

    await Session.create({
      userId: user._id,
      deviceId,
      tokenHash: sessionTokenHash,
      lastSeenAt: now,
      expiresAt: sessionExpiresAt,
      ip: signals.ip,
      userAgent: signals.userAgent,
      revoked: false,
    });

    await setCookie(COOKIE_NAMES.STUDENT_SESSION, rawSessionToken);
    return rawSessionToken;
  };

  // Helper to issue fresh rd_device token
  const issueDeviceToken = async () => {
    const freshToken = crypto.randomBytes(32).toString("base64url");
    const freshHash = crypto.createHash("sha256").update(freshToken).digest("hex");
    await setCookie(COOKIE_NAMES.DEVICE, freshToken, COOKIE_DURATIONS.DEVICE);
    return { token: freshToken, hash: freshHash };
  };

  // 1. Check if this browser carries rd_pending matching an APPROVED DeviceRequest
  let approvedReq = null;
  if (pendingId) {
    approvedReq = await DeviceRequest.findOne({
      studentId: user._id,
      pendingId,
      status: "approved",
      fulfilledAt: null,
    });
  }

  if (approvedReq) {
    const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
    let activeDeviceId = null;

    if (approvedReq.mode === "same_device") {
      let target = null;
      if (approvedReq.targetDeviceId) {
        const targetCond = mongoose.isValidObjectId(approvedReq.targetDeviceId)
          ? [{ deviceId: approvedReq.targetDeviceId }, { _id: approvedReq.targetDeviceId }]
          : [{ deviceId: approvedReq.targetDeviceId }];
        target = await Device.findOne({
          studentId: user._id,
          $or: targetCond,
          status: "approved",
        });
      }
      if (!target) {
        target = await Device.findOne({ studentId: user._id, status: "approved" });
      }

      if (target) {
        activeDeviceId = target.deviceId;
        if (!Array.isArray(target.browserTokenHashes)) target.browserTokenHashes = [];
        target.browserTokenHashes.push(freshTokenHash);
        if (target.browserTokenHashes.length > 10) target.browserTokenHashes.shift();

        if (profile?.screenMajor) {
          if (!Array.isArray(target.aliases)) target.aliases = [];
          target.aliases.push({
            screenMajor: profile.screenMajor,
            screenMinor: profile.screenMinor,
            model: profile.model || null,
            addedAt: now,
            reason: "admin_alias",
          });
        }
        target.lastUsedAt = now;
        target.lastIp = signals.ip;
        if (!Array.isArray(target.browsersSeen)) target.browsersSeen = [];
        if (!target.browsersSeen.includes(signals.browserName)) {
          target.browsersSeen.push(signals.browserName);
        }
        await target.save();
      }
    } else if (approvedReq.mode === "replace") {
      if (approvedReq.replaceDeviceId) {
        const replaceCond = mongoose.isValidObjectId(approvedReq.replaceDeviceId)
          ? [{ deviceId: approvedReq.replaceDeviceId }, { _id: approvedReq.replaceDeviceId }]
          : [{ deviceId: approvedReq.replaceDeviceId }];
        await Device.updateMany(
          {
            studentId: user._id,
            $or: replaceCond,
          },
          { $set: { status: "revoked", decidedAt: now, decidedBy: approvedReq.decidedBy || "admin" } }
        );
        await Session.deleteMany({ userId: user._id, deviceId: approvedReq.replaceDeviceId });
      }

      let existingDev = approvedReq.targetDeviceId
        ? await Device.findOne({ studentId: user._id, deviceId: approvedReq.targetDeviceId, status: "approved" })
        : null;

      if (existingDev) {
        activeDeviceId = existingDev.deviceId;
        if (!Array.isArray(existingDev.browserTokenHashes)) existingDev.browserTokenHashes = [];
        existingDev.browserTokenHashes.push(freshTokenHash);
        existingDev.lastUsedAt = now;
        existingDev.lastIp = signals.ip;
        await existingDev.save();
      } else {
        const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");
        activeDeviceId = newDeviceId;

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
          browserTokenHashes: [freshTokenHash],
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
          decidedBy: approvedReq.decidedBy || "admin",
          loginAttempts: 1,
          deviceLabel: signals.label,
          label: signals.label,
          userAgent: signals.userAgent,
          status: "approved",
        });
      }
    } else {
      // "additional" (default)
      let existingDev = approvedReq.targetDeviceId
        ? await Device.findOne({ studentId: user._id, deviceId: approvedReq.targetDeviceId, status: "approved" })
        : null;

      if (existingDev) {
        activeDeviceId = existingDev.deviceId;
        if (!Array.isArray(existingDev.browserTokenHashes)) existingDev.browserTokenHashes = [];
        existingDev.browserTokenHashes.push(freshTokenHash);
        existingDev.lastUsedAt = now;
        existingDev.lastIp = signals.ip;
        await existingDev.save();
      } else {
        const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");
        activeDeviceId = newDeviceId;

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
          browserTokenHashes: [freshTokenHash],
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
          decidedBy: approvedReq.decidedBy || "admin",
          loginAttempts: 1,
          deviceLabel: signals.label,
          label: signals.label,
          userAgent: signals.userAgent,
          status: "approved",
        });
      }

      const totalApproved = await Device.countDocuments({ studentId: user._id, status: "approved" });
      user.maxDevices = Math.max(user.maxDevices || 1, totalApproved);
      user.deviceCount = totalApproved;
      await user.save();
    }

    approvedReq.fulfilledAt = now;
    await approvedReq.save();

    user.lastLoginAt = now;
    user.lastLoginIp = signals.ip;
    await user.save();

    await createStudentSession(activeDeviceId);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=approved_request_login deviceId=${activeDeviceId} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // 2. Request carries cookie rd_device: check SHA-256(token) against browserTokenHashes / graceTokenHashes
  if (rawDeviceCookie) {
    const incomingTokenHash = crypto
      .createHash("sha256")
      .update(rawDeviceCookie)
      .digest("hex");

    const matchedDevice = await Device.findOne({
      studentId: user._id,
      status: "approved",
      $or: [
        { browserTokenHashes: incomingTokenHash },
        { graceTokenHashes: { $elemMatch: { hash: incomingTokenHash, expiresAt: { $gt: now } } } },
      ],
    });

    if (matchedDevice) {
      // Rotate token: issue fresh token, previous hash remains valid for 10 minutes only
      const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();

      if (!Array.isArray(matchedDevice.browserTokenHashes)) {
        matchedDevice.browserTokenHashes = [];
      }
      matchedDevice.browserTokenHashes = matchedDevice.browserTokenHashes.filter(
        (h) => h !== incomingTokenHash
      );
      matchedDevice.browserTokenHashes.push(freshTokenHash);
      if (matchedDevice.browserTokenHashes.length > 10) {
        matchedDevice.browserTokenHashes.shift();
      }

      if (!Array.isArray(matchedDevice.graceTokenHashes)) {
        matchedDevice.graceTokenHashes = [];
      }
      matchedDevice.graceTokenHashes.push({
        hash: incomingTokenHash,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      });
      // Purge expired grace hashes
      matchedDevice.graceTokenHashes = matchedDevice.graceTokenHashes.filter(
        (g) => g && g.expiresAt && new Date(g.expiresAt).getTime() > now.getTime()
      );

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
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_matched deviceId=${matchedDevice.deviceId} ip=${signals.ip}`
      );

      return {
        success: true,
        redirectTo: "/student",
      };
    }
  }

  // 3. First login ever: no device cookie AND zero approved/existing devices
  const totalApproved = await Device.countDocuments({
    studentId: user._id,
    status: "approved",
  });
  const totalAnyDevices = await Device.countDocuments({
    studentId: user._id,
  });

  if (!rawDeviceCookie && totalApproved === 0 && totalAnyDevices === 0) {
    const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
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
      browserTokenHashes: [freshTokenHash],
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

    user.lastLoginAt = now;
    user.lastLoginIp = signals.ip;
    user.deviceCount = 1;
    await user.save();

    await createStudentSession(newDeviceId);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_registered deviceId=${newDeviceId} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // 4. If deviceLockMode === "off", allow login if student has an approved device
  if (deviceLockMode === "off") {
    const anyApproved = await Device.findOne({ studentId: user._id, status: "approved" });
    if (anyApproved) {
      await createStudentSession(anyApproved.deviceId);
      return { success: true, redirectTo: "/student" };
    }
  }

  // 5. EVERYTHING ELSE => BLOCK!
  // Assign or read pending browser ID cookie rd_pending
  let currentPendingId = pendingId;
  if (!currentPendingId) {
    currentPendingId = crypto.randomBytes(16).toString("hex");
    await setCookie(COOKIE_NAMES.PENDING, currentPendingId, COOKIE_DURATIONS.PENDING);
  }

  // Check if a REJECTED request exists for this student & pendingId
  const rejectedReq = await DeviceRequest.findOne({
    studentId: user._id,
    pendingId: currentPendingId,
    status: "rejected",
  });

  if (rejectedReq) {
    rejectedReq.attemptCount = (rejectedReq.attemptCount || 1) + 1;
    rejectedReq.lastAttemptAt = now;
    rejectedReq.ip = signals.ip;
    await rejectedReq.save();

    const rejectMsg = rejectedReq.rejectionReason || "Your request for this device was declined. Please contact RD Classes.";
    console.warn(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_rejected pendingId=${currentPendingId} ip=${signals.ip}`
    );

    return {
      success: false,
      pendingApproval: false,
      isRejected: true,
      error: rejectMsg,
      message: rejectMsg,
      reason: "device_rejected",
    };
  }

  // Deduplicate pending request: by pendingId or fallback studentId + userAgent + screen profile
  const fallbackDedupeKey = `${user._id}_${signals.userAgent}_${profile?.screenMajor || 0}x${profile?.screenMinor || 0}`;

  let pendingReq = await DeviceRequest.findOne({
    studentId: user._id,
    status: "pending",
    $or: [{ pendingId: currentPendingId }, { dedupeKey: fallbackDedupeKey }],
  });

  if (pendingReq) {
    pendingReq.attemptCount = (pendingReq.attemptCount || 1) + 1;
    pendingReq.lastAttemptAt = now;
    pendingReq.ip = signals.ip;
    if (signals.city) pendingReq.city = signals.city;
    if (signals.region) pendingReq.region = signals.region;
    if (signals.country) pendingReq.country = signals.country;
    if (!pendingReq.pendingId) pendingReq.pendingId = currentPendingId;
    await pendingReq.save();
  } else {
    const closestDevice = await Device.findOne({ studentId: user._id, status: "approved" }).lean();
    const flags = computeDeviceDifferences(signals, profile, closestDevice);
    const newReqDeviceId = "req_" + crypto.randomBytes(8).toString("hex");

    pendingReq = await DeviceRequest.create({
      studentId: user._id,
      userId: user._id,
      dedupeKey: fallbackDedupeKey,
      pendingId: currentPendingId,
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

  const blockMsg = "Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.";

  console.warn(
    `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_pending pendingId=${currentPendingId} ip=${signals.ip}`
  );

  return {
    success: false,
    pendingApproval: true,
    error: blockMsg,
    message: blockMsg,
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
