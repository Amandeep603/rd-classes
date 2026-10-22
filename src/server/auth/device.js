import "server-only";
import crypto from "crypto";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import { getCookie, setCookie, COOKIE_NAMES, COOKIE_DURATIONS } from "./cookies.js";
import { signDeviceToken, verifyDeviceToken } from "./tokens.js";

export function formatDeviceLabel(userAgentString) {
  if (!userAgentString) return "Unknown Device";
  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserName = browser.name || "Browser";
  const osName = os.name || "OS";

  if (device.type === "mobile" || device.type === "tablet") {
    const model = device.model || device.vendor || osName;
    return `${browserName} on ${model}`;
  }

  return `${browserName} on ${osName}`;
}

export async function getClientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function getClientUserAgent() {
  const headerList = await headers();
  return headerList.get("user-agent") || "";
}

export async function resolveDeviceContext() {
  const rawCookie = await getCookie(COOKIE_NAMES.DEVICE);
  let deviceId = null;

  if (rawCookie) {
    deviceId = verifyDeviceToken(rawCookie);
  }

  // If no valid cookie, issue a fresh deviceId
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    const signed = signDeviceToken(deviceId);
    await setCookie(COOKIE_NAMES.DEVICE, signed, COOKIE_DURATIONS.DEVICE);
  }

  const userAgent = await getClientUserAgent();
  const ip = await getClientIp();
  const label = formatDeviceLabel(userAgent);

  return {
    deviceId,
    label,
    userAgent,
    ip,
  };
}
