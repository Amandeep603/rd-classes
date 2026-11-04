import "server-only";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";

/**
 * Validates and parses client hints JSON string from rd_hints cookie.
 * Client hints contain: sw, sh, dpr, tp, pf, md.
 */
export function parseClientHints(rawCookie) {
  if (!rawCookie) return null;
  try {
    let data = rawCookie;
    if (typeof data === "string") {
      try {
        data = JSON.parse(decodeURIComponent(rawCookie));
      } catch {
        data = JSON.parse(rawCookie);
      }
    }
    if (!data || typeof data !== "object") return null;

    const sw = Number(data.sw);
    const sh = Number(data.sh);
    const dpr = Number(data.dpr);
    const tp = Number(data.tp) || 0;

    let md = typeof data.md === "string" ? data.md.trim() : "";
    if (md.length <= 1 || md.toLowerCase() === "k") {
      md = "";
    }
    // md at most 40 safe characters
    md = md.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 40);

    // Validate bounds: sw/sh 200 to 10000, dpr 0.5 to 6
    if (
      Number.isFinite(sw) &&
      sw >= 200 &&
      sw <= 10000 &&
      Number.isFinite(sh) &&
      sh >= 200 &&
      sh <= 10000 &&
      Number.isFinite(dpr) &&
      dpr >= 0.5 &&
      dpr <= 6
    ) {
      return {
        sw: Math.round(sw),
        sh: Math.round(sh),
        dpr: Number(dpr.toFixed(2)),
        tp,
        pf: typeof data.pf === "string" ? data.pf.slice(0, 40) : "",
        md,
      };
    }
  } catch {
    // Ignore invalid hints
  }
  return null;
}

/**
 * Extracts and normalizes server signals from user agent and request headers.
 */
export function parseServerSignals(userAgentString = "", headerList = null, clientHints = null) {
  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const rawOsName = os.name || "";
  const rawBrowserName = browser.name || "Browser";
  const rawBrowserVersion = browser.version || "";
  const rawOsVersion = os.version || "";

  // Check iPad detection: Macintosh user agent with tp > 1 is an iPadOS tablet
  const isMacintoshUA = /Macintosh/i.test(userAgentString) && !/iPhone|iPad|iPod/i.test(userAgentString);
  const touchPoints = clientHints?.tp || 0;
  const isIPadFromTouch = isMacintoshUA && touchPoints > 1;

  let deviceType = "desktop";
  if (device.type === "mobile" || /iPhone|Mobile/i.test(userAgentString)) {
    deviceType = "mobile";
  } else if (device.type === "tablet" || isIPadFromTouch || /iPad/i.test(userAgentString)) {
    deviceType = "tablet";
  }

  // OS Family normalization
  let osFamily = "Unknown";
  let osName = rawOsName;

  if (isIPadFromTouch || /iPad/i.test(userAgentString) || /iPad/i.test(rawOsName)) {
    osFamily = "iPadOS";
    deviceType = "tablet";
    osName = "iPadOS";
  } else if (/iPhone/i.test(userAgentString) || /iPod/i.test(userAgentString) || /iOS/i.test(rawOsName) || rawOsName === "iOS") {
    osFamily = "iOS";
    deviceType = "mobile";
    osName = "iOS";
  } else if (/Windows/i.test(rawOsName) || /Windows/i.test(userAgentString)) {
    osFamily = "Windows";
    osName = "Windows";
  } else if (isMacintoshUA || (/Mac/i.test(rawOsName) && !/iPhone|iPad/i.test(userAgentString))) {
    osFamily = "macOS";
    osName = "macOS";
  } else if (/Android/i.test(rawOsName) || /Android/i.test(userAgentString)) {
    osFamily = "Android";
    osName = "Android";
  } else if (/CrOS|ChromeOS/i.test(userAgentString) || /Chrome OS/i.test(rawOsName)) {
    osFamily = "ChromeOS";
    osName = "ChromeOS";
  } else if (/Linux/i.test(rawOsName) || /Linux/i.test(userAgentString)) {
    osFamily = "Linux";
    osName = "Linux";
  }

  // Model detection
  let rawModel = (clientHints?.md || device.model || device.vendor || "").trim();
  if (!rawModel || rawModel.length <= 1 || rawModel.toLowerCase() === "k") {
    rawModel = "";
  }
  const model = rawModel;

  // Header signals
  let ip = "127.0.0.1";
  let city = "";
  let region = "";
  let country = "";
  let timezone = "";

  if (headerList) {
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    } else {
      const realIp = headerList.get("x-real-ip");
      if (realIp) ip = realIp.trim();
    }

    const rawCity = headerList.get("x-vercel-ip-city") || "";
    try {
      city = rawCity ? decodeURIComponent(rawCity) : "";
    } catch {
      city = rawCity;
    }

    region = headerList.get("x-vercel-ip-country-region") || "";
    country = headerList.get("x-vercel-ip-country") || "";
    timezone = headerList.get("x-vercel-ip-timezone") || "";
  }

  // Label construction
  let label = "";
  const browserLabel = rawBrowserName;

  if (osFamily === "iPadOS") {
    label = `iPad · ${browserLabel}`;
  } else if (osFamily === "macOS") {
    label = `MacBook · ${browserLabel}`;
  } else if (osFamily === "iOS") {
    label = `iPhone · ${browserLabel}`;
  } else if (osFamily === "Windows") {
    label = `Windows laptop · ${browserLabel}`;
  } else if (osFamily === "Android") {
    if (model) {
      label = `Android phone · ${model} · ${browserLabel}`;
    } else {
      label = `Android phone · ${browserLabel}`;
    }
  } else if (osFamily === "Linux") {
    label = `Linux PC · ${browserLabel}`;
  } else if (osFamily === "ChromeOS") {
    label = `Chromebook · ${browserLabel}`;
  } else {
    label = `${osName || "Unknown"} · ${browserLabel}`;
  }

  // coarseKey = hash(deviceType + osFamily)
  const coarseKey = crypto
    .createHash("sha256")
    .update(`${deviceType}:${osFamily}`)
    .digest("hex")
    .slice(0, 32);

  // Slot assignment:
  // slot = "handheld" for deviceType mobile or tablet (including iPadOS: a Macintosh user agent with touch points > 1 from the rd_hints cookie)
  // and "computer" for Windows, macOS without touch, Linux and ChromeOS. A Macintosh user agent with no hints is treated as "computer".
  let slot = "computer";
  if (
    deviceType === "mobile" ||
    deviceType === "tablet" ||
    isIPadFromTouch ||
    osFamily === "iPadOS" ||
    osFamily === "iOS" ||
    osFamily === "Android"
  ) {
    slot = "handheld";
  } else {
    slot = "computer";
  }

  // Raw user agent trimmed to 300 characters
  const trimmedUA = (userAgentString || "").slice(0, 300);

  return {
    slot,
    deviceType,
    osFamily,
    osName,
    osVersion: rawOsVersion,
    browserName: rawBrowserName,
    browserVersion: rawBrowserVersion,
    model,
    label,
    ip,
    firstIp: ip,
    city,
    region,
    country,
    timezone,
    userAgent: trimmedUA,
    coarseKey,
  };
}

/**
 * Derives device slot ("handheld" | "computer") in memory for any device or request record.
 */
export function deriveSlot(item) {
  if (!item) return "computer";
  if (item.slot === "handheld" || item.slot === "computer") {
    return item.slot;
  }
  const type = String(item.deviceType || "").toLowerCase();
  const os = String(item.osFamily || item.os || "").toLowerCase();
  if (
    type === "mobile" ||
    type === "tablet" ||
    os.includes("ipad") ||
    os.includes("ios") ||
    os.includes("android")
  ) {
    return "handheld";
  }
  return "computer";
}

/**
 * Detects in-app browsers and WebViews from User-Agent.
 * User agent tokens: FBAN, FBAV, Instagram, Line, Snapchat, Twitter, LinkedInApp, GSA, "; wv)" on Android,
 * and an iOS Mobile user agent without the "Safari/" token. Fail open when unsure.
 */
export function isInAppBrowser(userAgentString = "") {
  if (!userAgentString || typeof userAgentString !== "string") return false;
  if (/FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|LinkedInApp|GSA\//i.test(userAgentString)) {
    return true;
  }
  if (/Android/i.test(userAgentString) && /;\s*wv/i.test(userAgentString)) {
    return true;
  }
  const isIOSMobile = /iPhone|iPod/i.test(userAgentString) || (/iPad/i.test(userAgentString) && /Mobile/i.test(userAgentString));
  if (isIOSMobile && !/Safari\//i.test(userAgentString)) {
    return true;
  }
  return false;
}

/**
 * Computes profile from client hints and signals.
 * Profile = { screenMajor, screenMinor, model }
 * Independent of orientation and browser zoom.
 */
export function computeProfile(signals, hints) {
  if (!hints || !hints.sw || !hints.sh || !hints.dpr) {
    return null;
  }

  const rawMajor = Math.max(hints.sw, hints.sh) * hints.dpr;
  const rawMinor = Math.min(hints.sw, hints.sh) * hints.dpr;

  const screenMajor = Math.round(rawMajor);
  const screenMinor = Math.round(rawMinor);
  const model = (hints.md || signals?.model || "").toLowerCase().trim() || null;

  return {
    screenMajor,
    screenMinor,
    model,
  };
}

/**
 * Computes profile bucket for deduplication (screenMajor & screenMinor rounded to nearest 50).
 */
export function computeProfileBucket(profile) {
  if (!profile || !profile.screenMajor || !profile.screenMinor) {
    return "no_hints";
  }
  const bucketMajor = Math.round(profile.screenMajor / 50) * 50;
  const bucketMinor = Math.round(profile.screenMinor / 50) * 50;
  const modelPart = profile.model || "generic";
  return `${bucketMajor}x${bucketMinor}:${modelPart}`;
}

/**
 * Dedupe key for pending device requests:
 * Dedupe by studentId + request token (fall back to studentId + slot + screen bucket + model if cookies are rejected).
 */
export function computeDedupeKey(studentId, requestTokenHash, profile, slot = "computer") {
  if (requestTokenHash) {
    return `req_${studentId}_${requestTokenHash}`;
  }
  const bucket = computeProfileBucket(profile);
  const modelPart = profile?.model || "generic";
  return `req_${studentId}_${slot}_${bucket}_${modelPart}`;
}

/**
 * Compares two profiles with 3% screen tolerance and model equality.
 */
export function matchProfilePair(p1, p2) {
  if (!p1 || !p2) return false;

  // 3% screen tolerance in either orientation
  const majDiff = Math.abs(p1.screenMajor - p2.screenMajor) / Math.max(1, p2.screenMajor);
  const minDiff = Math.abs(p1.screenMinor - p2.screenMinor) / Math.max(1, p2.screenMinor);
  const normalMatches = majDiff <= 0.03 && minDiff <= 0.03;

  // Swapped orientation fallback
  const swappedMajDiff = Math.abs(p1.screenMajor - p2.screenMinor) / Math.max(1, p2.screenMinor);
  const swappedMinDiff = Math.abs(p1.screenMinor - p2.screenMajor) / Math.max(1, p2.screenMajor);
  const swappedMatches = swappedMajDiff <= 0.03 && swappedMinDiff <= 0.03;

  if (!normalMatches && !swappedMatches) {
    return false;
  }

  // Model check: if both models are known, they must match; if either is unknown, ignore
  const m1 = p1.model ? p1.model.trim().toLowerCase() : "";
  const m2 = p2.model ? p2.model.trim().toLowerCase() : "";
  if (m1 && m2 && m1 !== m2) {
    return false;
  }

  return true;
}

/**
 * Matches a login attempt against approved devices according to the policy:
 * - Cookie token hash matches an approved device d AND d.slot === slot AND d.osFamily === osFamily -> MATCH.
 *   If cookie matches but slot or osFamily differ (copied cookie) -> treat as NO MATCH and log device_cookie_mismatch.
 * - Grace for old records (Browser mode): approved device in same slot without tokens + profile match -> learns cookie, MATCH.
 * - Smart mode: soft-matches by coarseKey + screen tolerance within 3% and model equality, missing hints fail open.
 */
export function matchDevice({
  signals,
  profile,
  cookieTokenHash = null,
  approvedDevices = [],
  deviceBinding = "browser",
  deviceLockMode = null,
}) {
  const binding = deviceBinding || (deviceLockMode === "smart" ? "smart" : "browser");
  const now = new Date();

  // 1. Direct active token or grace token match
  if (cookieTokenHash) {
    for (const d of approvedDevices) {
      if (d.status !== "approved") continue;

      const hashes = [
        ...(Array.isArray(d.browserTokenHashes) ? d.browserTokenHashes : []),
        ...(Array.isArray(d.tokenHashes) ? d.tokenHashes : []),
      ];

      const directMatch = hashes.includes(cookieTokenHash);
      const graceMatch =
        Array.isArray(d.graceTokenHashes) &&
        d.graceTokenHashes.some(
          (g) => g.hash === cookieTokenHash && new Date(g.expiresAt).getTime() > now.getTime()
        );

      if (directMatch || graceMatch) {
        const dSlot = deriveSlot(d);
        const curSlot = signals.slot;
        const dOsFamily = d.osFamily || "";
        const curOsFamily = signals.osFamily || "";

        if (dSlot === curSlot && dOsFamily === curOsFamily) {
          return {
            matched: true,
            device: d,
            reason: directMatch ? "token_hash_match" : "grace_token_match",
            isCookieMatch: true,
            isGraceMatch: !directMatch && graceMatch,
          };
        } else {
          return {
            matched: false,
            device: d,
            reason: "device_cookie_mismatch",
            isCopiedCookie: true,
          };
        }
      }
    }
  }

  // 2. Grace for old records (Browser mode)
  if (binding === "browser") {
    for (const d of approvedDevices) {
      if (d.status !== "approved") continue;
      const dSlot = deriveSlot(d);
      if (dSlot !== signals.slot) continue;

      const hasTokens =
        (Array.isArray(d.browserTokenHashes) && d.browserTokenHashes.length > 0) ||
        (Array.isArray(d.tokenHashes) && d.tokenHashes.length > 0);

      if (!hasTokens) {
        const sameOs = (d.osFamily || "") === (signals.osFamily || "");
        const profileMatch = matchProfilePair(profile, d.profile);
        if (sameOs && profileMatch) {
          return {
            matched: true,
            device: d,
            reason: "device_cookie_learned",
            isLearnedMatch: true,
          };
        }
      }
    }
  }

  // 3. Smart mode soft match
  if (binding === "smart") {
    for (const d of approvedDevices) {
      if (d.status !== "approved") continue;
      const dSlot = deriveSlot(d);
      if (dSlot !== signals.slot) continue;

      const sameCoarse = d.coarseKey === signals.coarseKey;
      if (sameCoarse) {
        if (!profile || !profile.screenMajor || !d.profile || !d.profile.screenMajor) {
          return {
            matched: true,
            device: d,
            reason: "smart_soft_match_missing_hints",
            isSoftMatch: true,
          };
        }
        if (matchProfilePair(profile, d.profile)) {
          return {
            matched: true,
            device: d,
            reason: "smart_soft_match",
            isSoftMatch: true,
          };
        }
      }
    }
  }

  return {
    matched: false,
    reason: "no_match",
  };
}

/**
 * Computes diagnostic flags for pending device request according to policy:
 * - "Slot occupied by <device label>" or "Slot free"
 * - "Same specs as the registered <slot> but no cookie: the student switched browser or cleared cookies, or someone else is using the account"
 * - "Previously replaced on <date>"
 * - "Cookie copied from another OS"
 * - "Screen differs"
 */
export function computeRequestFlags({
  signals,
  profile,
  occupiedDevice = null,
  isCopiedCookie = false,
  replacedDevice = null,
}) {
  const flags = [];

  if (occupiedDevice) {
    const occLabel =
      occupiedDevice.deviceLabel ||
      occupiedDevice.label ||
      (signals.slot === "handheld" ? "phone/tablet" : "laptop/desktop");
    flags.push(`Slot occupied by ${occLabel}`);
  } else {
    flags.push("Slot free");
  }

  if (occupiedDevice) {
    const isSameSlot = deriveSlot(occupiedDevice) === signals.slot;
    const isSameOs = (occupiedDevice.osFamily || "") === (signals.osFamily || "");
    const isProfileMatch = matchProfilePair(profile, occupiedDevice.profile);

    if (isSameSlot && isSameOs && isProfileMatch) {
      flags.push(
        `Same specs as the registered ${signals.slot} but no cookie: the student switched browser or cleared cookies, or someone else is using the account`
      );
    } else if (profile && occupiedDevice.profile?.screenMajor) {
      const majDiff =
        Math.abs(profile.screenMajor - occupiedDevice.profile.screenMajor) /
        Math.max(1, occupiedDevice.profile.screenMajor);
      const minDiff =
        Math.abs(profile.screenMinor - occupiedDevice.profile.screenMinor) /
        Math.max(1, occupiedDevice.profile.screenMinor);
      if (majDiff > 0.03 || minDiff > 0.03) {
        flags.push("Screen differs");
      }
    }
  }

  if (replacedDevice && replacedDevice.replacedAt) {
    const dateStr = new Date(replacedDevice.replacedAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    flags.push(`Previously replaced on ${dateStr}`);
  }

  if (isCopiedCookie) {
    flags.push("Cookie copied from another OS");
  }

  return flags;
}

export function computeDeviceDifferences(signals, profile, closestDevice) {
  return computeRequestFlags({ signals, profile, occupiedDevice: closestDevice });
}

