import "server-only";
import crypto from "crypto";
import { env } from "../env.js";

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signDeviceToken(deviceId) {
  const secret = env.AUTH_SECRET;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(deviceId)
    .digest("hex");
  return `${deviceId}.${hmac}`;
}

export function verifyDeviceToken(signedToken) {
  if (!signedToken || typeof signedToken !== "string") return null;

  const parts = signedToken.split(".");
  if (parts.length !== 2) return null;

  const [deviceId, providedHmac] = parts;
  if (!deviceId || !providedHmac) return null;

  try {
    const secret = env.AUTH_SECRET;
    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(deviceId)
      .digest("hex");

    const providedBuf = Buffer.from(providedHmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");

    if (providedBuf.length !== expectedBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return null;
    }

    return deviceId;
  } catch {
    return null;
  }
}
