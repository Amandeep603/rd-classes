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
  deriveOsFamily,
  isInAppBrowser,
  getInAppBrowserLabel,
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
  const inAppLabel = getInAppBrowserLabel(signals.userAgent);
  const isInApp = Boolean(inAppLabel);

  // 0. Test cookie check
  const rawTestCookie = await getCookie(COOKIE_NAMES.TEST);
  const rawDeviceCookie = await getCookie(COOKIE_NAMES.DEVICE);
  const rawPendingCookie = await getCookie(COOKIE_NAMES.PENDING);
  if (rawTestCookie === "0") {
    return {
      success: false,
      error: "Please enable cookies to log in.",
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
      error: `Too many failed attempts, try again in ${mins} minutes`,
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
      error: "Your account has been deactivated (blocked). Please contact RD Classes administration.",
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

  // Fetch approved devices of student - match by studentId OR legacy userId
  const approvedDevices = await Device.find({
    $or: [{ studentId: user._id }, { userId: user._id }],
    status: "approved",
  });

  let incomingTokenHash = null;
  if (rawDeviceCookie) {
    incomingTokenHash = crypto
      .createHash("sha256")
      .update(rawDeviceCookie)
      .digest("hex");
  }

  // Check if incoming cookie belongs to a replaced or revoked device of this student
  let replacedDevice = null;
  let revokedDevice = null;
  if (incomingTokenHash) {
    replacedDevice = await Device.findOne({
      $or: [{ studentId: user._id }, { userId: user._id }],
      status: "replaced",
      $or: [
        { browserTokenHashes: incomingTokenHash },
        { tokenHashes: incomingTokenHash },
      ],
    });
    revokedDevice = await Device.findOne({
      $or: [{ studentId: user._id }, { userId: user._id }],
      status: "revoked",
      $or: [
        { browserTokenHashes: incomingTokenHash },
        { tokenHashes: incomingTokenHash },
      ],
    });
  }

  const anyDeviceEver = Boolean(
    await Device.exists({
      $or: [{ studentId: user._id }, { userId: user._id }],
    })
  );

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
    await setCookie(COOKIE_NAMES.LEGACY_SESSION, rawSessionToken);
    return rawSessionToken;
  };

  // Helper to issue fresh rd_device token (random 32 bytes, httpOnly, Secure, SameSite=Lax, path /, 1 year)
  const issueDeviceToken = async () => {
    const freshToken = crypto.randomBytes(32).toString("base64url");
    const freshHash = crypto.createHash("sha256").update(freshToken).digest("hex");
    await setCookie(COOKIE_NAMES.DEVICE, freshToken, COOKIE_DURATIONS.DEVICE);
    return { token: freshToken, hash: freshHash };
  };

  // 1. Check if this browser carries rd_pending matching an APPROVED DeviceRequest
  let approvedReq = null;
  if (rawPendingCookie) {
    const pendingVal = String(rawPendingCookie).trim();
    const query = mongoose.isValidObjectId(pendingVal)
      ? { $or: [{ _id: pendingVal }, { pendingId: pendingVal }, { deviceId: pendingVal }] }
      : { $or: [{ pendingId: pendingVal }, { deviceId: pendingVal }] };

    approvedReq = await DeviceRequest.findOne({
      $or: [{ studentId: user._id }, { userId: user._id }],
      ...query,
      status: "approved",
      fulfilledAt: null,
    });
  }

  if (approvedReq) {
    const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
    let activeDeviceId = null;

    let existingDev = null;
    if (approvedReq.targetDeviceId) {
      existingDev = await Device.findOne({
        $or: [{ studentId: user._id }, { userId: user._id }],
        $or: [
          { deviceId: approvedReq.targetDeviceId },
          { _id: mongoose.isValidObjectId(approvedReq.targetDeviceId) ? approvedReq.targetDeviceId : undefined },
        ],
        status: "approved",
      });
    }
    if (!existingDev && approvedReq.mode === "same_device") {
      existingDev = await Device.findOne({
        $or: [{ studentId: user._id }, { userId: user._id }],
        status: "approved",
      });
    }

    if (existingDev) {
      activeDeviceId = existingDev.deviceId;
      if (!Array.isArray(existingDev.browserTokenHashes)) existingDev.browserTokenHashes = [];
      existingDev.browserTokenHashes.push(freshTokenHash);
      if (!Array.isArray(existingDev.tokenHashes)) existingDev.tokenHashes = [];
      existingDev.tokenHashes.push(freshTokenHash);
      if (existingDev.tokenHashes.length > 10) existingDev.tokenHashes.shift();
      existingDev.lastUsedAt = now;
      existingDev.lastIp = signals.ip;
      await existingDev.save();
    } else {
      const newDevId = "dev_" + crypto.randomBytes(8).toString("hex");
      activeDeviceId = newDevId;
      await Device.create({
        studentId: user._id,
        userId: user._id,
        deviceId: newDevId,
        deviceKey: newDevId,
        slot: deriveSlot(approvedReq) || signals.slot,
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
        approvedBy: "auto-first-login",
        decidedAt: now,
        decidedBy: approvedReq.decidedBy || "admin",
        loginAttempts: 1,
        deviceLabel: signals.label,
        label: signals.label,
        userAgent: signals.userAgent,
        status: "approved",
      });
    }

    approvedReq.fulfilledAt = now;
    await approvedReq.save();

    await deleteCookie(COOKIE_NAMES.PENDING);
    await createStudentSession(activeDeviceId);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=approved_request_login deviceId=${activeDeviceId} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

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

    // Lazy upgrade & defensive fields on old documents
    if (!matchedDevice.deviceId) {
      matchedDevice.deviceId = matchedDevice.deviceKey || ("dev_" + (matchedDevice._id ? matchedDevice._id.toString() : crypto.randomBytes(8).toString("hex")));
    }
    if (!matchedDevice.deviceKey) {
      matchedDevice.deviceKey = matchedDevice.deviceId;
    }
    if (!matchedDevice.studentId) {
      matchedDevice.studentId = user._id;
    }
    if (!matchedDevice.userId) {
      matchedDevice.userId = user._id;
    }
    matchedDevice.slot = deriveSlot(matchedDevice);
    matchedDevice.osFamily = matchedDevice.osFamily || deriveOsFamily(matchedDevice) || signals.osFamily;
    if (signals.osName && !matchedDevice.os) matchedDevice.os = signals.osName;
    if (signals.browserName && !matchedDevice.browser) matchedDevice.browser = signals.browserName;
    if (!matchedDevice.deviceLabel) matchedDevice.deviceLabel = signals.label;
    if (!matchedDevice.label) matchedDevice.label = matchedDevice.deviceLabel;
    if (profile && !matchedDevice.profile) matchedDevice.profile = profile;

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

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: now, lastLoginIp: signals.ip } }
    );

    await createStudentSession(matchedDevice.deviceId);

    console.log(
      `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_matched deviceId=${matchedDevice.deviceId} slot=${signals.slot} ip=${signals.ip}`
    );

    return {
      success: true,
      redirectTo: "/student",
    };
  }

  // Provisional confirmation: normal browser confirms provisional device from in-app registration
  if (!matchResult.matched && !isInApp && approvedDevices.length > 0) {
    const provisionalDevice = approvedDevices.find((d) => {
      if (!d.provisional) return false;
      if (d.slot !== signals.slot) return false;
      const dOs = d.osFamily || deriveOsFamily(d);
      if (dOs !== signals.osFamily) return false;
      if (!d.profile?.screenMajor || !d.profile?.screenMinor || !profile?.screenMajor || !profile?.screenMinor) return false;

      const dMajor = Math.max(d.profile.screenMajor, d.profile.screenMinor);
      const dMinor = Math.min(d.profile.screenMajor, d.profile.screenMinor);
      const cMajor = Math.max(profile.screenMajor, profile.screenMinor);
      const cMinor = Math.min(profile.screenMajor, profile.screenMinor);

      const majorTol = Math.abs(dMajor - cMajor) / Math.max(dMajor, cMajor);
      const minorTol = Math.abs(dMinor - cMinor) / Math.max(dMinor, cMinor);
      if (majorTol > 0.03 || minorTol > 0.03) return false;

      if (d.profile.model && profile.model) {
        if (d.profile.model.toLowerCase().trim() !== profile.model.toLowerCase().trim()) return false;
      }
      return true;
    });

    if (provisionalDevice) {
      provisionalDevice.provisional = false;
      const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
      if (!Array.isArray(provisionalDevice.browserTokenHashes)) provisionalDevice.browserTokenHashes = [];
      provisionalDevice.browserTokenHashes.push(freshTokenHash);
      if (!Array.isArray(provisionalDevice.tokenHashes)) provisionalDevice.tokenHashes = [];
      provisionalDevice.tokenHashes.push(freshTokenHash);
      if (signals.browserName) {
        if (!Array.isArray(provisionalDevice.browsersSeen)) provisionalDevice.browsersSeen = [];
        if (!provisionalDevice.browsersSeen.includes(signals.browserName)) {
          provisionalDevice.browsersSeen.push(signals.browserName);
        }
      }
      provisionalDevice.lastUsedAt = now;
      provisionalDevice.lastIp = signals.ip;
      await provisionalDevice.save();

      await createStudentSession(provisionalDevice.deviceId);

      console.log(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_provisional_confirmed deviceId=${provisionalDevice.deviceId} slot=${signals.slot} ip=${signals.ip}`
      );

      return {
        success: true,
        redirectTo: "/student",
      };
    }
  }

  // In-app soft match: OS family + screen within 3% + model equal when both known
  if (!matchResult.matched && isInApp && approvedDevices.length > 0) {
    if (clientHints && clientHints.sw && clientHints.sh && clientHints.dpr && profile) {
      const softMatchDev = approvedDevices.find((d) => {
        if (d.slot !== signals.slot) return false;
        const dOs = d.osFamily || deriveOsFamily(d);
        if (dOs !== signals.osFamily) return false;
        if (!d.profile?.screenMajor || !d.profile?.screenMinor) return false;

        const dMajor = Math.max(d.profile.screenMajor, d.profile.screenMinor);
        const dMinor = Math.min(d.profile.screenMajor, d.profile.screenMinor);
        const cMajor = Math.max(profile.screenMajor, profile.screenMinor);
        const cMinor = Math.min(profile.screenMajor, profile.screenMinor);

        const majorDiff = Math.abs(dMajor - cMajor) / Math.max(dMajor, cMajor);
        const minorDiff = Math.abs(dMinor - cMinor) / Math.max(dMinor, cMinor);
        if (majorDiff > 0.03 || minorDiff > 0.03) return false;

        if (d.profile.model && profile.model) {
          if (d.profile.model.toLowerCase().trim() !== profile.model.toLowerCase().trim()) return false;
        }
        return true;
      });

      if (softMatchDev) {
        const { token: freshToken, hash: freshTokenHash } = await issueDeviceToken();
        if (!Array.isArray(softMatchDev.browserTokenHashes)) softMatchDev.browserTokenHashes = [];
        softMatchDev.browserTokenHashes.push(freshTokenHash);
        if (!Array.isArray(softMatchDev.tokenHashes)) softMatchDev.tokenHashes = [];
        softMatchDev.tokenHashes.push(freshTokenHash);
        if (!Array.isArray(softMatchDev.browsersSeen)) softMatchDev.browsersSeen = [];
        if (inAppLabel && !softMatchDev.browsersSeen.includes(inAppLabel)) {
          softMatchDev.browsersSeen.push(inAppLabel);
        }
        softMatchDev.lastUsedAt = now;
        softMatchDev.lastIp = signals.ip;
        await softMatchDev.save();

        await createStudentSession(softMatchDev.deviceId);

        console.log(
          `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_soft_match_inapp deviceId=${softMatchDev.deviceId} slot=${softMatchDev.slot} inAppBrowser=${inAppLabel} ip=${signals.ip}`
        );

        return {
          success: true,
          redirectTo: "/student",
        };
      }
    }
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
  if (totalApproved === 0 && !anyDeviceEver && !revokedDevice) {
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
        approvedBy: "auto-first-login",
        decidedAt: now,
        loginAttempts: 1,
        deviceLabel: signals.label,
        label: signals.label,
        userAgent: signals.userAgent,
        status: "approved",
        provisional: isInApp ? true : false,
        inAppBrowser: inAppLabel || "",
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
      }).catch(() => { });

      await User.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: now, lastLoginIp: signals.ip } }
      );

      await createStudentSession(newDeviceId);

      console.log(
        `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_registered deviceId=${newDeviceId} slot=${signals.slot} ip=${signals.ip}${isInApp ? ` provisional=true inAppBrowser=${inAppLabel}` : ""}`
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

  // Check if a REJECTED request exists for that token, pending cookie, or dedupe key
  const rejectCond = [];
  if (rawPendingCookie) {
    const pVal = String(rawPendingCookie).trim();
    if (mongoose.isValidObjectId(pVal)) {
      rejectCond.push({ _id: pVal });
    }
    rejectCond.push({ pendingId: pVal });
    rejectCond.push({ deviceId: pVal });
  }
  if (reqTokenHash) {
    rejectCond.push({ requestTokenHash: reqTokenHash });
    rejectCond.push({ tokenHash: reqTokenHash });
  }
  if (dedupeKey) {
    rejectCond.push({ dedupeKey });
  }

  let rejectedReq = null;
  if (rejectCond.length > 0) {
    rejectedReq = await DeviceRequest.findOne({
      $or: [{ studentId: user._id }, { userId: user._id }],
      status: "rejected",
      $or: rejectCond,
    });
  }

  if (rejectedReq) {
    rejectedReq.attemptCount = (rejectedReq.attemptCount || 1) + 1;
    rejectedReq.lastAttemptAt = now;
    rejectedReq.ip = signals.ip;
    if (signals.city) rejectedReq.city = signals.city;
    await rejectedReq.save();

    const declinedMsg = rejectedReq.rejectionReason
      ? rejectedReq.rejectionReason
      : "Your request for this device was declined. Please contact RD Classes.";
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

  const pendingCond = [];
  if (rawPendingCookie) {
    const pVal = String(rawPendingCookie).trim();
    if (mongoose.isValidObjectId(pVal)) {
      pendingCond.push({ _id: pVal });
    }
    pendingCond.push({ pendingId: pVal });
    pendingCond.push({ deviceId: pVal });
  }
  if (reqTokenHash) {
    pendingCond.push({ requestTokenHash: reqTokenHash });
    pendingCond.push({ tokenHash: reqTokenHash });
  }
  if (dedupeKey) {
    pendingCond.push({ dedupeKey });
  }

  let pendingReq = await DeviceRequest.findOne({
    $or: [{ studentId: user._id }, { userId: user._id }],
    status: "pending",
    $or: pendingCond,
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
    // Rate limit: at most 5 new requests per user in 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentRequestsCount = await DeviceRequest.countDocuments({
      $or: [{ studentId: user._id }, { userId: user._id }],
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (recentRequestsCount >= 5) {
      return {
        success: false,
        pendingApproval: false,
        error: "Too many pending device requests within 24 hours. Please contact RD Classes support.",
        reason: "rate_limited",
      };
    }

    const newReqDeviceId = "req_" + crypto.randomBytes(8).toString("hex");

    try {
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
        inAppBrowser: inAppLabel || "",
        previousDeviceId: replacedDevice ? replacedDevice.deviceId : null,
        attemptCount: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        status: "pending",
      });
    } catch (createErr) {
      const isDup = createErr && (createErr.code === 11000 || String(createErr.message).includes("E11000"));
      if (isDup) {
        pendingReq = await DeviceRequest.findOne({
          $or: [{ studentId: user._id }, { userId: user._id }],
          $or: pendingCond,
        });
        if (pendingReq) {
          pendingReq.status = "pending";
          pendingReq.attemptCount = (pendingReq.attemptCount || 1) + 1;
          pendingReq.lastAttemptAt = now;
          if (inAppLabel && !pendingReq.inAppBrowser) pendingReq.inAppBrowser = inAppLabel;
          await pendingReq.save();
        }
      }
      if (!pendingReq) throw createErr;
    }

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
    }).catch(() => { });
  }

  // Set pending cookie
  await setCookie(COOKIE_NAMES.PENDING, pendingReq._id.toString(), COOKIE_DURATIONS.PENDING);

  // Exact student messages
  let message = "";
  if (replacedDevice) {
    message = "This device was replaced. Please log in again to request access.";
  } else {
    message =
      "Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.";
  }

  console.warn(
    `[STUDENT_LOGIN] timestamp=${now.toISOString()} loginId=${upperId} result=device_pending reqTokenHash=${reqTokenHash} ip=${signals.ip}`
  );

  return {
    success: false,
    pendingApproval: true,
    status: "pending",
    redirectTo: "/student/login/pending",
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
        await Session.deleteOne({ tokenHash: hashToken(adminToken) }).catch(() => { });
      }
      await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    } else {
      const studentToken =
        (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
        (await getCookie(COOKIE_NAMES.LEGACY_SESSION));
      if (studentToken) {
        await Session.deleteOne({ tokenHash: hashToken(studentToken) }).catch(() => { });
      }
      await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
      await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    }
  } catch (err) {
    // Idempotent logout - never fail
  }
}
