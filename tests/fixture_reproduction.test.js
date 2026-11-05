import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let currentHeaders = new Map();
let currentCookies = new Map();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key) => currentHeaders.get(key.toLowerCase()) || null,
  }),
  cookies: async () => ({
    get: (name) => {
      const val = currentCookies.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name, value, opts) => {
      currentCookies.set(name, value);
    },
    delete: (name) => {
      currentCookies.delete(name);
    },
  }),
}));

vi.mock("next/server", () => ({
  connection: async () => {},
  NextResponse: {
    json: (data, init) => ({ data, status: init?.status || 200, json: async () => data }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

let mongod = null;
let assertTestDatabase;
let User, Device, Session, DeviceRequest;
let studentLogin, hashPassword, comparePassword;
let formatPublicError, GENERIC_PUBLIC_ERROR_TEXT;

function setContext({ userAgent, ip, deviceCookie, hintsCookie, testCookie = "1" } = {}) {
  currentHeaders.clear();
  currentCookies.clear();

  if (userAgent) currentHeaders.set("user-agent", userAgent);
  if (ip) currentHeaders.set("x-forwarded-for", ip);
  if (deviceCookie) currentCookies.set("rd_device", deviceCookie);
  if (hintsCookie) currentCookies.set("rd_hints", hintsCookie);
  if (testCookie) currentCookies.set("rd_cookie_test", testCookie);
}

describe("Diagnostic Fixtures Reproduction Suite", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_auth_secret_for_testing_purposes_123456789";
    process.env.NODE_ENV = "test";

    mongod = await MongoMemoryServer.create();
    const testUri = mongod.getUri() + "rdclasses_test_diagnostics";
    process.env.MONGODB_URI = testUri;
    process.env.MONGODB_URI_TEST = testUri;

    const guardMod = await import("../src/server/db/testGuard.js");
    assertTestDatabase = guardMod.assertTestDatabase;
    assertTestDatabase(testUri);

    await mongoose.connect(testUri);

    const userMod = await import("../src/lib/models/User.ts");
    User = userMod.User;
    const devMod = await import("../src/lib/models/Device.ts");
    Device = devMod.Device;
    const sessMod = await import("../src/lib/models/Session.ts");
    Session = sessMod.Session;
    const reqMod = await import("../src/server/db/models/DeviceRequest.js");
    DeviceRequest = reqMod.DeviceRequest;

    await Session.collection.createIndex({ userId: 1, deviceId: 1 }, { unique: true });

    const authMod = await import("../src/server/auth/authService.js");
    studentLogin = authMod.studentLogin;
    const pwMod = await import("../src/server/auth/password.js");
    hashPassword = pwMod.hashPassword;
    comparePassword = pwMod.comparePassword;

    const errMod = await import("../src/lib/publicError.js");
    formatPublicError = errMod.formatPublicError;
    GENERIC_PUBLIC_ERROR_TEXT = errMod.GENERIC_PUBLIC_ERROR_TEXT;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    currentHeaders.clear();
    currentCookies.clear();
  });

  it("Reproduction & Recording of all 7 Old Fixture Cases", async () => {
    const password = "StudentPass@2026";
    const passwordHash = await hashPassword(password);

    const UAs = {
      desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      mobile: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      inApp: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0",
    };

    const hints = {
      desktop: JSON.stringify({ sw: 1920, sh: 1080, dpr: 1, tp: 0 }),
      mobile: JSON.stringify({ sw: 390, sh: 844, dpr: 3, tp: 5, md: "Pixel 8" }),
      ipad: JSON.stringify({ sw: 810, sh: 1080, dpr: 2, tp: 5 }),
    };

    const runLogin = async (loginId, ua, options = {}) => {
      setContext({
        userAgent: ua,
        ip: "103.21.244.2",
        deviceCookie: options.deviceCookie,
        hintsCookie: options.hintsCookie,
        testCookie: options.testCookie !== undefined ? options.testCookie : "1",
      });

      let result;
      let rawError = null;
      try {
        result = await studentLogin({ loginId, password });
      } catch (err) {
        rawError = err;
        const masked = formatPublicError(err, { loginId });
        return { success: false, threw: true, rawError, masked, error: masked.userMessage, ref: masked.refCode };
      }

      if (!result.success) {
        if (result.pendingApproval) {
          return { success: false, pendingApproval: true, message: result.message, reason: result.reason };
        }
        const masked = formatPublicError(result.error, { loginId });
        return {
          success: false,
          masked: !masked.isKnown,
          error: masked.userMessage,
          rawError: result.error,
          reason: result.reason,
          ref: masked.refCode,
        };
      }

      return { success: true, redirectTo: result.redirectTo };
    };

    const failures = [];

    // --- FIXTURE 1: Device without slot, tokenHashes, browsersSeen, profile, or osFamily ---
    const student1 = await User.create({
      name: "Old Student 1",
      loginId: "RD-2026-F01",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 1,
    });

    // Insert directly into MongoDB collection bypass Mongoose schema validation to match old production doc
    const dev1Raw = {
      studentId: student1._id,
      deviceId: "dev_old_f01",
      deviceKey: "dev_old_f01",
      deviceType: "desktop",
      os: "Windows 10",
      browser: "Chrome",
      status: "approved",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    await Device.collection.insertOne(dev1Raw);

    // Test F1 without cookies
    let res = await runLogin("RD-2026-F01", UAs.desktop, { hintsCookie: hints.desktop });
    if (!res.success && res.masked) {
      failures.push({ fixture: "F1 (device without slot/tokenHashes/profile/osFamily)", case: "desktop without device cookie", res });
    }
    console.log("F1 Desktop (no dev cookie):", res);

    // --- FIXTURE 2: Student with undefined allowedDevicesLimit ---
    const student2Raw = {
      name: "Old Student 2",
      loginId: "RD-2026-F02",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 0,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
    await User.collection.insertOne(student2Raw);
    res = await runLogin("RD-2026-F02", UAs.desktop, { hintsCookie: hints.desktop });
    console.log("F2 Student with undefined allowedDevicesLimit:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F2 (student undefined allowedDevicesLimit)", case: "first login", res });
    }

    // --- FIXTURE 3: Two approved devices in one slot (legacy extra device) ---
    const student3 = await User.create({
      name: "Old Student 3",
      loginId: "RD-2026-F03",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 2,
    });
    const rawDevToken3A = crypto.randomBytes(32).toString("base64url");
    const rawDevHash3A = crypto.createHash("sha256").update(rawDevToken3A).digest("hex");
    const rawDevToken3B = crypto.randomBytes(32).toString("base64url");
    const rawDevHash3B = crypto.createHash("sha256").update(rawDevToken3B).digest("hex");

    await Device.collection.insertMany([
      {
        studentId: student3._id,
        deviceId: "dev_f03_laptop1",
        slot: "computer",
        deviceType: "desktop",
        osFamily: "Windows",
        tokenHashes: [rawDevHash3A],
        browserTokenHashes: [rawDevHash3A],
        status: "approved",
      },
      {
        studentId: student3._id,
        deviceId: "dev_f03_laptop2",
        slot: "computer",
        deviceType: "desktop",
        osFamily: "Windows",
        tokenHashes: [rawDevHash3B],
        browserTokenHashes: [rawDevHash3B],
        status: "approved",
      },
    ]);

    // Test logging in with device 3A
    res = await runLogin("RD-2026-F03", UAs.desktop, { deviceCookie: rawDevToken3A, hintsCookie: hints.desktop });
    console.log("F3 Login with laptop 1:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F3 (two approved devices in slot)", case: "laptop 1 login", res });
    }

    // Test logging in with device 3B
    res = await runLogin("RD-2026-F03", UAs.desktop, { deviceCookie: rawDevToken3B, hintsCookie: hints.desktop });
    console.log("F3 Login with laptop 2:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F3 (two approved devices in slot)", case: "laptop 2 login", res });
    }

    // --- FIXTURE 4: Session without deviceId ---
    const student4 = await User.create({
      name: "Old Student 4",
      loginId: "RD-2026-F04",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 1,
    });
    const rawDevToken4 = crypto.randomBytes(32).toString("base64url");
    const rawDevHash4 = crypto.createHash("sha256").update(rawDevToken4).digest("hex");
    await Device.create({
      studentId: student4._id,
      deviceId: "dev_f04",
      slot: "computer",
      deviceType: "desktop",
      osFamily: "Windows",
      tokenHashes: [rawDevHash4],
      browserTokenHashes: [rawDevHash4],
      status: "approved",
    });
    // Old session with no deviceId
    await Session.collection.insertOne({
      userId: student4._id,
      tokenHash: "old_hash_f04",
      expiresAt: new Date(Date.now() + 86400000),
      role: "student",
      revoked: false,
    });

    res = await runLogin("RD-2026-F04", UAs.desktop, { deviceCookie: rawDevToken4, hintsCookie: hints.desktop });
    console.log("F4 Login with session without deviceId:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F4 (session without deviceId)", case: "login", res });
    }

    // --- FIXTURE 5: Revoked or expired session for same student & device ---
    const student5 = await User.create({
      name: "Old Student 5",
      loginId: "RD-2026-F05",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 1,
    });
    const rawDevToken5 = crypto.randomBytes(32).toString("base64url");
    const rawDevHash5 = crypto.createHash("sha256").update(rawDevToken5).digest("hex");
    await Device.create({
      studentId: student5._id,
      deviceId: "dev_f05",
      slot: "computer",
      deviceType: "desktop",
      osFamily: "Windows",
      tokenHashes: [rawDevHash5],
      browserTokenHashes: [rawDevHash5],
      status: "approved",
    });
    await Session.create({
      userId: student5._id,
      deviceId: "dev_f05",
      tokenHash: "revoked_hash_f05",
      expiresAt: new Date(Date.now() - 10000), // expired
      revoked: true,
      revokedReason: "manual_revocation",
    });

    res = await runLogin("RD-2026-F05", UAs.desktop, { deviceCookie: rawDevToken5, hintsCookie: hints.desktop });
    console.log("F5 Login with expired/revoked session:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F5 (expired/revoked session)", case: "login", res });
    }

    // --- FIXTURE 6: Stale pending request ---
    const student6 = await User.create({
      name: "Old Student 6",
      loginId: "RD-2026-F06",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 1,
    });
    const rawDevToken6 = crypto.randomBytes(32).toString("base64url");
    const rawDevHash6 = crypto.createHash("sha256").update(rawDevToken6).digest("hex");
    await Device.create({
      studentId: student6._id,
      deviceId: "dev_f06_registered",
      slot: "computer",
      deviceType: "desktop",
      osFamily: "Windows",
      tokenHashes: [rawDevHash6],
      browserTokenHashes: [rawDevHash6],
      status: "approved",
    });

    // Stale pending request for same student with old format
    await DeviceRequest.collection.insertOne({
      studentId: student6._id,
      status: "pending",
      dedupeKey: `req_${student6._id}_stale_hash`,
      deviceId: "req_stale_123",
      deviceType: "mobile",
      label: "Old Stale Phone",
      attemptCount: 1,
      createdAt: new Date("2026-01-01"),
    });

    // Login from mobile (new second device -> should create pending request)
    res = await runLogin("RD-2026-F06", UAs.mobile, { hintsCookie: hints.mobile });
    console.log("F6 Login with stale pending request:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F6 (stale pending request)", case: "mobile login", res });
    }

    // --- FIXTURE 7: Device created by the very first device version ---
    // (had deviceKey, no slot, deviceType "desktop", no osFamily, no browserTokenHashes, no tokenHashes, no profile)
    const student7 = await User.create({
      name: "Old Student 7",
      loginId: "RD-2026-F07",
      passwordHash,
      role: "student",
      status: "active",
      deviceCount: 1,
    });
    await Device.collection.insertOne({
      userId: student7._id,
      deviceKey: "dev_v1_legacy_key",
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
      status: "approved",
      createdAt: new Date("2025-10-01"),
    });

    // Login from desktop
    res = await runLogin("RD-2026-F07", UAs.desktop, { hintsCookie: hints.desktop });
    console.log("F7 V1 Legacy Device Login:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "F7 (v1 legacy device)", case: "desktop login", res });
    }

    // --- User Agent & Cookie Matrix Tests ---
    // In-app browser test
    res = await runLogin("RD-2026-F01", UAs.inApp);
    console.log("In-app browser test:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "In-app browser", case: "Instagram UA", res });
    }

    // Missing test cookie test
    res = await runLogin("RD-2026-F01", UAs.desktop, { testCookie: null });
    console.log("Missing test cookie test:", res);
    if (!res.success && res.masked) {
      failures.push({ fixture: "Missing test cookie", case: "cookies disabled", res });
    }

    console.log("\n=== SUMMARY OF MASKED FAILURES ===");
    console.log(JSON.stringify(failures, null, 2));
  });
});

