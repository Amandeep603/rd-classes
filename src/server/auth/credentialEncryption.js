import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

/**
 * Validates lazily whether CREDENTIAL_ENC_KEY is present and parses to 32 bytes.
 * Supports 32-byte base64 (primary spec) or raw 32-byte/64-char hex strings.
 */
export function isEncryptionKeyConfigured(keyVersion = 1) {
  try {
    const buf = getKeyBuffer(keyVersion);
    return Boolean(buf && buf.length === 32);
  } catch {
    return false;
  }
}

/**
 * Resolves the 32-byte key buffer for a given key version.
 */
export function getKeyBuffer(keyVersion = 1) {
  const envVarName =
    keyVersion > 1 ? `CREDENTIAL_ENC_KEY_V${keyVersion}` : "CREDENTIAL_ENC_KEY";
  const rawKey = process.env[envVarName] || (keyVersion === 1 ? process.env.CREDENTIAL_ENC_KEY : "");

  if (!rawKey || typeof rawKey !== "string") {
    return null;
  }

  const trimmed = rawKey.trim();

  // 1. Try base64 (spec format: 32 bytes base64 -> 44 chars)
  const b64Buf = Buffer.from(trimmed, "base64");
  if (b64Buf.length === 32) {
    return b64Buf;
  }

  // 2. Try hex (64 chars)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const hexBuf = Buffer.from(trimmed, "hex");
    if (hexBuf.length === 32) return hexBuf;
  }

  // 3. Raw utf8 32-byte string fallback
  const utf8Buf = Buffer.from(trimmed, "utf8");
  if (utf8Buf.length === 32) {
    return utf8Buf;
  }

  return null;
}

/**
 * Encrypts a plaintext password using AES-256-GCM.
 * Returns { iv, tag, ciphertext, keyVersion } or null if key is not configured.
 */
export function encryptPassword(plainText, keyVersion = 1) {
  if (!plainText || typeof plainText !== "string") {
    return null;
  }

  const keyBuffer = getKeyBuffer(keyVersion);
  if (!keyBuffer || keyBuffer.length !== 32) {
    return null;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const ciphertextBuf = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertextBuf.toString("base64"),
    keyVersion,
  };
}

/**
 * Decrypts an encrypted password structure.
 * Throws if the key is missing, payload is invalid, or authentication fails.
 */
export function decryptPassword(passwordEnc) {
  if (!passwordEnc || typeof passwordEnc !== "object") {
    throw new Error("Missing encrypted password payload.");
  }

  const { iv, tag, ciphertext, keyVersion = 1 } = passwordEnc;
  if (!iv || !tag || !ciphertext) {
    throw new Error("Invalid encrypted password payload (missing iv, tag, or ciphertext).");
  }

  const keyBuffer = getKeyBuffer(keyVersion);
  if (!keyBuffer || keyBuffer.length !== 32) {
    throw new Error(
      `Credential encryption key (version ${keyVersion}) is not configured on this server.`
    );
  }

  const ivBuffer = Buffer.from(iv, "base64");
  const tagBuffer = Buffer.from(tag, "base64");
  const cipherBuffer = Buffer.from(ciphertext, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  const decrypted = Buffer.concat([
    decipher.update(cipherBuffer),
    decipher.final(),
  ]).toString("utf8");

  return decrypted;
}
