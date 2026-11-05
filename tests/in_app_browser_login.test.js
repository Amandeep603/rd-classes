import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
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
    json: (data, init) => ({ data, status: init?.status || 200 }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

let mongod = null;
let assertTestDatabase;
let User, Device, DeviceRequest, Session;
let studentLogin, hashPassword;

function setMockContext({ userAgent, ip = "103.21.244.1", hints, deviceCookie, pendingCookie, referer } = {}) {
  currentHeaders.clear();
  currentCookies.clear();

  if (userAgent) currentHeaders.set("user-agent", userAgent);
  if (ip) currentHeaders.set("x-forwarded-for", ip);
  if (referer) currentHeaders.set("referer", referer);

  currentCookies.set("rd_cookie_test", "1");

  if (hints) {
    currentCookies.set("rd_hints", JSON.stringify(hints));
  }
  if (deviceCookie) {
    currentCookies.set("rd_device", deviceCookie);
  }
  if (pendingCookie) {
    currentCookies.set("rd_pending", pendingCookie);
  }
}

describe("In-App Browsers, Google Entry & Soft-Match Release Verification Suite", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_auth_secret_for_testing_purposes_123456789";
    process.env.NODE_ENV = "test";

    mongod = await MongoMemoryServer.create();
    const testUri = mongod.getUri() + "rdclasses_test_inapp";
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
    const reqMod = await import("../src/server/db/models/DeviceRequest.js");
    DeviceRequest = reqMod.DeviceRequest;
    const sessMod = await import("../src/lib/models/Session.ts");
    Session = sessMod.Session;

    const authMod = await import("../src/server/auth/authService.js");
    studentLogin = authMod.studentLogin;
    const pwMod = await import("../src/server/auth/password.js");
    hashPassword = pwMod.hashPassword;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    currentHeaders.clear();
    currentCookies.clear();
    await User.deleteMany({});
    await Device.deleteMany({});
    await DeviceRequest.deleteMany({});
    await Session.deleteMany({});
  });

  // 1. Google Referrer Entry across all browsers
  describe("1. Google Referrer Entry Across Diverse User Agents", () => {
    const browsers = [
      {
        name: "Desktop Chrome",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        hints: { sw: 1920, sh: 1080, dpr: 1 },
      },
      {
        name: "Desktop Safari",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
        hints: { sw: 1440, sh: 900, dpr: 2 },
      },
      {
        name: "Desktop Edge",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        hints: { sw: 1920, sh: 1080, dpr: 1.25 },
      },
      {
        name: "Desktop Firefox",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        hints: { sw: 1920, sh: 1080, dpr: 1 },
      },
      {
        name: "Google App on iOS (GSA)",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/310.0.620000000 Mobile/15E148 Safari/605.1",
        hints: { sw: 390, sh: 844, dpr: 3 },
      },
      {
        name: "Google App on Android",
        ua: "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.64 Mobile Safari/537.36 GSA/15.8.35.28.arm64",
        hints: { sw: 412, sh: 915, dpr: 2.625 },
      },
      {
        name: "Chrome Custom Tab",
        ua: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
        hints: { sw: 384, sh: 854, dpr: 3 },
      },
      {
        name: "Android WebView",
        ua: "Mozilla/5.0 (Linux; U; Android 13; en-us; SM-S908U Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36",
        hints: { sw: 384, sh: 854, dpr: 3 },
      },
      {
        name: "Instagram In-App",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 287.0.0.25.77",
        hints: { sw: 390, sh: 844, dpr: 3 },
      },
      {
        name: "Facebook In-App",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/425.0.0.28.112]",
        hints: { sw: 390, sh: 844, dpr: 3 },
      },
      {
        name: "WhatsApp In-App",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.4.73",
        hints: { sw: 390, sh: 844, dpr: 3 },
      },
    ];

    for (const b of browsers) {
      it(`allows login from ${b.name} coming from Google search without block or masked error`, async () => {
        const studentId = `RD-G-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const pwHash = await hashPassword("TestPass@2026");

        await User.create({
          loginId: studentId,
          passwordHash: pwHash,
          name: "Google Student",
          role: "student",
          deviceCount: 0,
          allowedDevicesLimit: 1,
        });

        setMockContext({
          userAgent: b.ua,
          hints: b.hints,
          referer: "https://www.google.com/",
        });

        const res = await studentLogin({ loginId: studentId, password: "TestPass@2026" });
        expect(res.success).toBe(true);
        expect(res.redirectTo).toBe("/student");

        // Verify session was created and device registered
        const sess = await Session.findOne({ role: "student" });
        expect(sess).toBeDefined();

        const dev = await Device.findOne({ studentId: sess.userId });
        expect(dev).toBeDefined();
        expect(dev.status).toBe("approved");
      });
    }
  });

  // 2. In-App Provisional Registration & Normal Browser Confirmation
  describe("2. Provisional Registration & Confirmation Lifecycle", () => {
    it("registers an in-app browser as provisional: true when student has 0 devices", async () => {
      const pwHash = await hashPassword("TestPass@2026");
      const user = await User.create({
        loginId: "RD-PROV-1",
        passwordHash: pwHash,
        name: "Provisional Student",
        role: "student",
        deviceCount: 0,
      });

      // User arrives from WhatsApp in-app browser on iPhone
      const waUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.4.73";
      setMockContext({
        userAgent: waUA,
        hints: { sw: 390, sh: 844, dpr: 3 },
      });

      const res = await studentLogin({ loginId: "RD-PROV-1", password: "TestPass@2026" });
      expect(res.success).toBe(true);

      const dev = await Device.findOne({ studentId: user._id });
      expect(dev).toBeDefined();
      expect(dev.provisional).toBe(true);
      expect(dev.inAppBrowser).toBe("WhatsApp");
      expect(dev.status).toBe("approved");
    });

    it("confirms provisional device (provisional: false) when student logs in from normal Safari on same iPhone", async () => {
      const pwHash = await hashPassword("TestPass@2026");
      const user = await User.create({
        loginId: "RD-CONF-1",
        passwordHash: pwHash,
        name: "Confirm Student",
        role: "student",
        deviceCount: 0,
      });

      // 1. Initial login via WhatsApp (provisional)
      const waUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.4.73";
      setMockContext({
        userAgent: waUA,
        hints: { sw: 390, sh: 844, dpr: 3 },
      });
      await studentLogin({ loginId: "RD-CONF-1", password: "TestPass@2026" });

      const provDev = await Device.findOne({ studentId: user._id });
      expect(provDev.provisional).toBe(true);

      // 2. Student now opens Mobile Safari on that same iPhone (no cookie in Safari jar)
      const safariUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1";
      setMockContext({
        userAgent: safariUA,
        hints: { sw: 390, sh: 844, dpr: 3 }, // Same screen specs
      });

      const res = await studentLogin({ loginId: "RD-CONF-1", password: "TestPass@2026" });
      expect(res.success).toBe(true);
      expect(res.redirectTo).toBe("/student");

      // Verify provisional device is now confirmed
      const confirmedDev = await Device.findOne({ studentId: user._id });
      expect(confirmedDev.provisional).toBe(false);

      // Verify no pending requests were created
      const reqCount = await DeviceRequest.countDocuments({ studentId: user._id });
      expect(reqCount).toBe(0);
    });
  });

  // 3. In-App Soft Match against Approved Device
  describe("3. In-App Soft Match Against Approved Devices", () => {
    it("soft matches in-app browser when OS family and screen dimensions match within 3%", async () => {
      const pwHash = await hashPassword("TestPass@2026");
      const user = await User.create({
        loginId: "RD-SOFT-1",
        passwordHash: pwHash,
        name: "Soft Student",
        role: "student",
        deviceCount: 1,
      });

      // Pre-existing approved iPhone (e.g. registered earlier in Safari)
      const dev = await Device.create({
        studentId: user._id,
        deviceId: "dev_iphone_1",
        slot: "handheld",
        deviceType: "mobile",
        osFamily: "iOS",
        profile: {
          screenMajor: 2532, // 844 * 3
          screenMinor: 1170, // 390 * 3
          model: "iphone",
        },
        tokenHashes: ["some_safari_token_hash"],
        status: "approved",
      });

      // Student clicks link in Instagram (different cookie jar, no rd_device cookie)
      const igUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 287.0.0.25.77";
      setMockContext({
        userAgent: igUA,
        hints: { sw: 390, sh: 844, dpr: 3, md: "iphone" },
      });

      const res = await studentLogin({ loginId: "RD-SOFT-1", password: "TestPass@2026" });
      expect(res.success).toBe(true);
      expect(res.redirectTo).toBe("/student");

      // Device learned the in-app browser
      const updatedDev = await Device.findById(dev._id);
      expect(updatedDev.browsersSeen).toContain("Instagram");

      // No pending request created
      const reqCount = await DeviceRequest.countDocuments({ studentId: user._id });
      expect(reqCount).toBe(0);
    });

    it("requires pending approval when in-app browser has different OS or conflicting phone model", async () => {
      const pwHash = await hashPassword("TestPass@2026");
      const user = await User.create({
        loginId: "RD-DIFF-1",
        passwordHash: pwHash,
        name: "Different Phone Student",
        role: "student",
        deviceCount: 1,
      });

      // Approved device is an iPhone
      await Device.create({
        studentId: user._id,
        deviceId: "dev_iphone_main",
        slot: "handheld",
        deviceType: "mobile",
        osFamily: "iOS",
        profile: {
          screenMajor: 2532,
          screenMinor: 1170,
          model: "iphone",
        },
        tokenHashes: ["token_hash_123"],
        status: "approved",
      });

      // In-app attempt from an Android phone (different OS)
      const androidInAppUA =
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36 [FBAN/EMA;FBLC/en_US;FBAV/390.0.0.9.116;]";
      setMockContext({
        userAgent: androidInAppUA,
        hints: { sw: 412, sh: 915, dpr: 2.625, md: "pixel 8" },
      });

      const res = await studentLogin({ loginId: "RD-DIFF-1", password: "TestPass@2026" });
      expect(res.success).toBe(false);
      expect(res.pendingApproval).toBe(true);
      expect(res.status).toBe("pending");

      // Verify DeviceRequest was created and labeled with in-app browser
      const req = await DeviceRequest.findOne({ studentId: user._id });
      expect(req).toBeDefined();
      expect(req.inAppBrowser).toBe("Facebook");
      expect(req.status).toBe("pending");
    });

    it("requires pending approval when hints are missing in an in-app browser", async () => {
      const pwHash = await hashPassword("TestPass@2026");
      const user = await User.create({
        loginId: "RD-NOHINTS-1",
        passwordHash: pwHash,
        name: "No Hints Student",
        role: "student",
        deviceCount: 1,
      });

      await Device.create({
        studentId: user._id,
        deviceId: "dev_iphone_main2",
        slot: "handheld",
        deviceType: "mobile",
        osFamily: "iOS",
        profile: {
          screenMajor: 2532,
          screenMinor: 1170,
        },
        tokenHashes: ["token_hash_123"],
        status: "approved",
      });

      const waUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.4.73";
      // Missing hints
      setMockContext({
        userAgent: waUA,
        hints: null,
      });

      const res = await studentLogin({ loginId: "RD-NOHINTS-1", password: "TestPass@2026" });
      expect(res.success).toBe(false);
      expect(res.pendingApproval).toBe(true);
    });
  });
});

