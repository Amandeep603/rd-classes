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

  // Raw user agent trimmed to 300 characters
  const trimmedUA = (userAgentString || "").slice(0, 300);

  return {
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
 * studentId + coarseKey + profileBucket
 */
export function computeDedupeKey(studentId, coarseKey, profile) {
  const bucket = computeProfileBucket(profile);
  return `${studentId}_${coarseKey}_${bucket}`;
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
 * Matches a login attempt against approved devices.
 * STRICT TOKEN-ONLY SYSTEM:
 * A login matches ONLY if cookieTokenHash is found in browserTokenHashes
 * or non-expired graceTokenHashes of an approved, non-revoked device.
 * All hardware, screen, OS, and missing-hint fallbacks are completely removed.
 */
export function matchDevice({
  signals,
  profile,
  cookieTokenHash = null,
  approvedDevices = [],
  deviceLockMode = "strict",
}) {
  const mode = deviceLockMode === "relaxed" ? "strict" : deviceLockMode || "strict";

  if (mode === "off") {
    if (approvedDevices.length > 0) {
      return {
        matched: true,
        device: approvedDevices[0],
        reason: "lock_disabled",
      };
    }
  }

  // Token Hash matching (Active token or 10-minute multi-tab grace token)
  if (cookieTokenHash) {
    const now = new Date();
    for (const d of approvedDevices) {
      if (d.status !== "approved") continue;

      // 1. Direct active token match
      if (Array.isArray(d.browserTokenHashes) && d.browserTokenHashes.includes(cookieTokenHash)) {
        return {
          matched: true,
          device: d,
          reason: "token_hash_match",
          isCookieMatch: true,
        };
      }

      // 2. Grace token match (valid for 10 minutes after rotation)
      if (Array.isArray(d.graceTokenHashes)) {
        const graceMatch = d.graceTokenHashes.find(
          (g) => g.hash === cookieTokenHash && new Date(g.expiresAt).getTime() > now.getTime()
        );
        if (graceMatch) {
          return {
            matched: true,
            device: d,
            reason: "grace_token_match",
            isCookieMatch: true,
            isGraceMatch: true,
          };
        }
      }
    }
  }

  // Strict Token-Only: All other attempts fail
  return {
    matched: false,
    reason: "strict_token_mismatch",
  };
}

/**
 * Computes diagnostic flags comparing login attempt against closest approved device.
 */
export function computeDeviceDifferences(signals, profile, closestDevice) {
  const flags = [];
  if (!closestDevice) return flags;

  if (signals.osFamily !== closestDevice.osFamily) {
    flags.push(`OS family differs: ${closestDevice.osFamily || "Unknown"} vs ${signals.osFamily}`);
  }

  if (signals.deviceType !== closestDevice.deviceType) {
    flags.push(`Device type differs: ${closestDevice.deviceType} vs ${signals.deviceType}`);
  }

  if (profile && closestDevice.profile && closestDevice.profile.screenMajor) {
    const cd = closestDevice.profile;
    const majDiff = Math.abs(profile.screenMajor - cd.screenMajor);
    const minDiff = Math.abs(profile.screenMinor - cd.screenMinor);
    if (majDiff > 30 || minDiff > 30) {
      flags.push(`Screen differs: ${cd.screenMajor}x${cd.screenMinor} vs ${profile.screenMajor}x${profile.screenMinor}`);
    }
    if (profile.model && cd.model && profile.model.toLowerCase() !== cd.model.toLowerCase()) {
      flags.push(`Model differs: ${cd.model} vs ${profile.model}`);
    }
  }

  return flags;
}

