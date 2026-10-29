import "server-only";
import crypto from "crypto";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";
import { getCookie, setCookie, COOKIE_NAMES, COOKIE_DURATIONS } from "./cookies.js";
import { signDeviceToken, verifyDeviceToken } from "./tokens.js";
import connectDB from "../db/connect.js";
import { Setting } from "../../lib/models/Setting.ts";

export function parseDeviceDetails(userAgentString, headerList) {
  const parser = new UAParser(userAgentString || "");
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType = "desktop";
  if (device.type === "mobile") {
    deviceType = "mobile";
  } else if (device.type === "tablet") {
    deviceType = "tablet";
  }

  const osName = os.name || "Unknown OS";
  const browserName = browser.name || "Browser";
  const model = device.model || device.vendor || "";

  let label = `${osName} · ${browserName}`;
  if (deviceType === "mobile" || deviceType === "tablet") {
    const mobileDevice = model ? `${model} (${osName})` : `${osName} phone`;
    label = `${mobileDevice} · ${browserName}`;
  }

  let ip = "127.0.0.1";
  let city = "";
  let country = "";

  if (headerList) {
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    } else {
      const realIp = headerList.get("x-real-ip");
      if (realIp) ip = realIp.trim();
    }

    city = headerList.get("x-vercel-ip-city") || "";
    country = headerList.get("x-vercel-ip-country") || "";
  }

  return {
    deviceType,
    osName,
    browserName,
    model,
    label,
    ip,
    city,
    country,
  };
}

export function formatDeviceLabel(userAgentString) {
  const details = parseDeviceDetails(userAgentString);
  return details.label;
}

export function computeDeviceKey(deviceType, osName, cookieToken = "", isStrict = false) {
  const normType = String(deviceType || "desktop").toLowerCase().trim();
  const normOs = String(osName || "unknown").toLowerCase().trim();

  if (isStrict) {
    return crypto
      .createHash("sha256")
      .update(`${normType}:${normOs}:${cookieToken || ""}`)
      .digest("hex")
      .slice(0, 32);
  }

  return crypto
    .createHash("sha256")
    .update(`${normType}:${normOs}`)
    .digest("hex")
    .slice(0, 32);
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
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  const details = parseDeviceDetails(userAgent, headerList);

  const rawCookie = await getCookie(COOKIE_NAMES.DEVICE);
  let cookieToken = null;

  if (rawCookie) {
    cookieToken = verifyDeviceToken(rawCookie);
  }

  if (!cookieToken) {
    cookieToken = crypto.randomUUID();
    const signed = signDeviceToken(cookieToken);
    await setCookie(COOKIE_NAMES.DEVICE, signed, COOKIE_DURATIONS.DEVICE);
  }

  let isStrict = false;
  try {
    await connectDB();
    const setting = await Setting.findOne().lean();
    isStrict = setting?.deviceLockMode === "strict";
  } catch {
    isStrict = false;
  }

  const deviceKey = computeDeviceKey(details.deviceType, details.osName, cookieToken, isStrict);

  return {
    deviceKey,
    deviceId: deviceKey, // Backwards compatibility for existing code expecting deviceId
    deviceType: details.deviceType,
    osName: details.osName,
    browserName: details.browserName,
    model: details.model,
    label: details.label,
    ip: details.ip,
    city: details.city,
    country: details.country,
    userAgent,
    cookieToken,
    isStrict,
  };
}
