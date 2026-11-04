import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { execSync } from "child_process";
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
let User, Device, DeviceRequest, Session, Setting, ActivityLog;
let studentLogin, hashPassword, comparePassword;
let approveDeviceRequest, rejectDeviceRequest, removeDevice;
let getCurrentStudent;

function setMockContext({ userAgent, ip, hints, deviceCookie, pendingCookie, city, country, region, timezone } = {}) {
  currentHeaders.clear();
  currentCookies.clear();

  if (userAgent) currentHeaders.set("user-agent", userAgent);
  if (ip) currentHeaders.set("x-forwarded-for", ip);
  if (city) currentHeaders.set("x-vercel-ip-city", encodeURIComponent(city));
  if (country) currentHeaders.set("x-vercel-ip-country", country);
  if (region) currentHeaders.set("x-vercel-ip-country-region", region);
  if (timezone) currentHeaders.set("x-vercel-ip-timezone", timezone);

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

describe("Strict Token-Only Device Auth Test Matrix (16 Cases)", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_auth_secret_for_testing_purposes_123456789";
    process.env.NODE_ENV = "test";

    // Setup MongoMemoryServer with guarded test db name
    mongod = await MongoMemoryServer.create();
    const testUri = mongod.getUri() + "rdclasses_test_matrix";
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
    const setMod = await import("../src/lib/models/Setting.ts");
    Setting = setMod.Setting;
    const actMod = await import("../src/lib/models/ActivityLog.ts");
    ActivityLog = actMod.ActivityLog;

    const authMod = await import("../src/server/auth/authService.js");
    studentLogin = authMod.studentLogin;
    const pwMod = await import("../src/server/auth/password.js");
    hashPassword = pwMod.hashPassword;
    comparePassword = pwMod.comparePassword;

    const devSvc = await import("../src/server/auth/deviceService.js");
    approveDeviceRequest = devSvc.approveDeviceRequest;
    rejectDeviceRequest = devSvc.rejectDeviceRequest;
    removeDevice = devSvc.removeDevice;

    const sessSvc = await import("../src/server/auth/session.js");
    getCurrentStudent = sessSvc.getCurrentStudent;
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

  // TEST 1: First login auto-approves and sets rd_device
  it("1. First login auto-approves and sets rd_device cookie and creates session", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student One",
      loginId: "RD-2026-101",
      role: "student",
      status: "active",
      passwordHash,
    });

    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "103.21.244.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });

    const res = await studentLogin({ loginId: "RD-2026-101", password: "TestPass@2026" });
    expect(res.success).toBe(true);

    const deviceToken = currentCookies.get("rd_device");
    expect(deviceToken).toBeDefined();

    const tokenHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
    const devices = await Device.find({ studentId: student._id });
    expect(devices.length).toBe(1);
    expect(devices[0].status).toBe("approved");
    expect(devices[0].browserTokenHashes).toContain(tokenHash);

    const session = await Session.findOne({ userId: student._id });
    expect(session).toBeDefined();
    expect(session.deviceId).toBe(devices[0].deviceId);
  });

  // TEST 2: Same browser, different IP / WiFi / mobile data => login ok
  it("2. Same browser, different IP / WiFi / mobile data => login ok and rotates token with grace", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Two",
      loginId: "RD-2026-102",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Initial login on WiFi
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "103.21.244.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });
    const res1 = await studentLogin({ loginId: "RD-2026-102", password: "TestPass@2026" });
    expect(res1.success).toBe(true);
    const token1 = currentCookies.get("rd_device");

    // 2. Next login from Mobile Data IP with same browser token
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "49.36.120.99",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
      deviceCookie: token1,
    });
    const res2 = await studentLogin({ loginId: "RD-2026-102", password: "TestPass@2026" });
    expect(res2.success).toBe(true);

    const dev = await Device.findOne({ studentId: student._id });
    expect(dev.lastIp).toBe("49.36.120.99");
    const token2 = currentCookies.get("rd_device");
    expect(token2).toBeDefined();
    expect(token2).not.toBe(token1);

    const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
    expect(dev.graceTokenHashes.some((g) => g.hash === hash1)).toBe(true);
  });

  // TEST 3: SECOND LAPTOP with identical specs, same IP, correct password, no token => BLOCKED
  it("3. Second laptop with identical specs, same IP, correct password, no token => BLOCKED with exact Hindi-English message", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Three",
      loginId: "RD-2026-103",
      role: "student",
      status: "active",
      passwordHash,
    });

    const laptopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36";
    const laptopHints = { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" };
    const sharedIp = "103.21.244.50";

    // 1. Laptop 1 logs in and auto-registers
    setMockContext({ userAgent: laptopUA, ip: sharedIp, hints: laptopHints });
    const res1 = await studentLogin({ loginId: "RD-2026-103", password: "TestPass@2026" });
    expect(res1.success).toBe(true);

    // 2. Laptop 2 with IDENTICAL hardware and same IP, but no cookie
    setMockContext({ userAgent: laptopUA, ip: sharedIp, hints: laptopHints, deviceCookie: null });
    const res2 = await studentLogin({ loginId: "RD-2026-103", password: "TestPass@2026" });
    expect(res2.success).toBe(false);
    expect(res2.pendingApproval).toBe(true);
    expect(res2.message).toBe("Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.");

    // Exactly 1 pending request created
    const reqs = await DeviceRequest.find({ studentId: student._id });
    expect(reqs.length).toBe(1);
    expect(reqs[0].status).toBe("pending");

    // rd_pending cookie is set
    expect(currentCookies.get("rd_pending")).toBeDefined();

    // No second session created
    const sessions = await Session.find({ userId: student._id });
    expect(sessions.length).toBe(1);
  });

  // TEST 4: Same as 3 but identical phone model (iPhone 13) => BLOCKED
  it("4. Second identical phone model (iPhone 13) with no token => BLOCKED", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Four",
      loginId: "RD-2026-104",
      role: "student",
      status: "active",
      passwordHash,
    });

    const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const iphoneHints = { v: 1, sw: 390, sh: 844, dpr: 3, tp: 5, pf: "iPhone", md: "" };
    const sharedIp = "103.21.244.60";

    // iPhone 1 logs in
    setMockContext({ userAgent: iphoneUA, ip: sharedIp, hints: iphoneHints });
    const res1 = await studentLogin({ loginId: "RD-2026-104", password: "TestPass@2026" });
    expect(res1.success).toBe(true);

    // iPhone 2 with identical UA and screen, no token
    setMockContext({ userAgent: iphoneUA, ip: sharedIp, hints: iphoneHints, deviceCookie: null });
    const res2 = await studentLogin({ loginId: "RD-2026-104", password: "TestPass@2026" });
    expect(res2.success).toBe(false);
    expect(res2.pendingApproval).toBe(true);
    expect(res2.message).toBe("Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.");
  });

  // TEST 5: Same as 3 with missing/empty client hints => BLOCKED (no fail open)
  it("5. Second device with missing/empty client hints => BLOCKED (no fail open)", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Five",
      loginId: "RD-2026-105",
      role: "student",
      status: "active",
      passwordHash,
    });

    const laptopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36";

    // Device 1 registers
    setMockContext({ userAgent: laptopUA, ip: "103.21.244.70", hints: { v: 1, sw: 1920, sh: 1080, dpr: 1 } });
    await studentLogin({ loginId: "RD-2026-105", password: "TestPass@2026" });

    // Device 2 arrives with NO hints cookie and NO device cookie
    setMockContext({ userAgent: laptopUA, ip: "103.21.244.70", hints: null, deviceCookie: null });
    const res = await studentLogin({ loginId: "RD-2026-105", password: "TestPass@2026" });
    expect(res.success).toBe(false);
    expect(res.pendingApproval).toBe(true);
    expect(res.message).toBe("Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.");
  });

  // TEST 6: 5 repeated attempts => still one pending request, attemptCount = 5
  it("6. 5 repeated attempts from unapproved browser => still 1 pending request, attemptCount = 5", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Six",
      loginId: "RD-2026-106",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Initial Device registers
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "1.1.1.1" });
    await studentLogin({ loginId: "RD-2026-106", password: "TestPass@2026" });

    // 2. First attempt from unapproved browser
    setMockContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0", ip: "2.2.2.1" });
    const res1 = await studentLogin({ loginId: "RD-2026-106", password: "TestPass@2026" });
    const pendingCookie = currentCookies.get("rd_pending");
    expect(pendingCookie).toBeDefined();

    // 3. Repeated attempts 2..5 with the rd_pending cookie
    for (let i = 2; i <= 5; i++) {
      setMockContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0",
        ip: `2.2.2.${i}`,
        pendingCookie,
      });
      await studentLogin({ loginId: "RD-2026-106", password: "TestPass@2026" });
    }

    const reqs = await DeviceRequest.find({ studentId: student._id });
    expect(reqs.length).toBe(1);
    expect(reqs[0].attemptCount).toBe(5);
  });

  // TEST 7: Admin approves additional => pending browser (with rd_pending) logs in; different browser => BLOCKED
  it("7. Admin approves additional => pending browser with rd_pending logs in; 3rd browser still BLOCKED", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Seven",
      loginId: "RD-2026-107",
      role: "student",
      status: "active",
      passwordHash,
    });

    const laptopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0";

    // 1. Laptop 1 registers
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-107", password: "TestPass@2026" });

    // 2. Laptop 2 requests login -> blocked & pending
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.2" });
    await studentLogin({ loginId: "RD-2026-107", password: "TestPass@2026" });
    const pendingCookie = currentCookies.get("rd_pending");

    const req = await DeviceRequest.findOne({ studentId: student._id, status: "pending" });
    expect(req).toBeDefined();

    // 3. Admin approves as additional
    const approveRes = await approveDeviceRequest(req._id, { mode: "additional" }, null, "TestAdmin");
    expect(approveRes.success).toBe(true);

    // 4. Laptop 2 with rd_pending logs in -> SUCCESS
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.2", pendingCookie });
    const resApproved = await studentLogin({ loginId: "RD-2026-107", password: "TestPass@2026" });
    expect(resApproved.success).toBe(true);
    const laptop2Token = currentCookies.get("rd_device");
    expect(laptop2Token).toBeDefined();

    // 5. Laptop 3 (identical specs, same IP, but NO token and NO rd_pending) -> BLOCKED
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.2", deviceCookie: null, pendingCookie: null });
    const resBlocked = await studentLogin({ loginId: "RD-2026-107", password: "TestPass@2026" });
    expect(resBlocked.success).toBe(false);
    expect(resBlocked.pendingApproval).toBe(true);
  });

  // TEST 8: Admin approves as alias => login ok, device slot count unchanged
  it("8. Admin approves as alias => login ok, approved device slot count unchanged", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Eight",
      loginId: "RD-2026-108",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Chrome on Windows registers
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-108", password: "TestPass@2026" });
    const [dev1] = await Device.find({ studentId: student._id });

    // 2. Firefox on same laptop requests login -> blocked
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-108", password: "TestPass@2026" });
    const pendingCookie = currentCookies.get("rd_pending");
    const req = await DeviceRequest.findOne({ studentId: student._id, status: "pending" });

    // 3. Admin approves as same_device (alias) to dev1
    await approveDeviceRequest(req._id, { mode: "same_device", targetDeviceId: dev1.deviceId }, null, "TestAdmin");

    // Slot count is still 1
    const approvedDevicesBefore = await Device.find({ studentId: student._id, status: "approved" });
    expect(approvedDevicesBefore.length).toBe(1);

    // 4. Firefox logs in with rd_pending
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
      ip: "10.0.0.1",
      pendingCookie,
    });
    const ffLogin = await studentLogin({ loginId: "RD-2026-108", password: "TestPass@2026" });
    expect(ffLogin.success).toBe(true);

    // Slot count remains 1
    const approvedDevicesAfter = await Device.find({ studentId: student._id, status: "approved" });
    expect(approvedDevicesAfter.length).toBe(1);
    expect(approvedDevicesAfter[0].browsersSeen).toContain("Firefox");
  });

  // TEST 9: Reject => blocked, rejection reason shown
  it("9. Reject => blocked, rejection reason shown", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Nine",
      loginId: "RD-2026-109",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Initial device
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-109", password: "TestPass@2026" });

    // 2. Unapproved device requests login
    setMockContext({ userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) Chrome/124.0.0.0", ip: "10.0.0.2" });
    await studentLogin({ loginId: "RD-2026-109", password: "TestPass@2026" });
    const pendingCookie = currentCookies.get("rd_pending");
    const req = await DeviceRequest.findOne({ studentId: student._id, status: "pending" });

    // 3. Admin rejects
    await rejectDeviceRequest(req._id, "Declined by admin: unverified personal phone", null, "TestAdmin");

    // 4. That phone attempts login again with rd_pending
    setMockContext({
      userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) Chrome/124.0.0.0",
      ip: "10.0.0.2",
      pendingCookie,
    });
    const res = await studentLogin({ loginId: "RD-2026-109", password: "TestPass@2026" });
    expect(res.success).toBe(false);
    expect(res.isRejected).toBe(true);
    expect(res.error).toContain("Declined by admin: unverified personal phone");
  });

  // TEST 10: Approved device cookie cleared => pending (strict behavior)
  it("10. Approved device cookie cleared => pending approval (strict behavior)", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Ten",
      loginId: "RD-2026-110",
      role: "student",
      status: "active",
      passwordHash,
    });

    const laptopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0";
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.1", hints: { v: 1, sw: 1920, sh: 1080, dpr: 1 } });
    await studentLogin({ loginId: "RD-2026-110", password: "TestPass@2026" });

    // User clears browser cookies (no rd_device)
    setMockContext({ userAgent: laptopUA, ip: "10.0.0.1", hints: { v: 1, sw: 1920, sh: 1080, dpr: 1 }, deviceCookie: null });
    const res = await studentLogin({ loginId: "RD-2026-110", password: "TestPass@2026" });
    expect(res.success).toBe(false);
    expect(res.pendingApproval).toBe(true);
    expect(res.message).toBe("Ye naya device hai. Request admin ko bhej di gayi hai. Approval ke baad dobara login karein.");
  });

  // TEST 11: Token of student A used with student B's ID => BLOCKED
  it("11. Token of student A used with student B's ID => BLOCKED", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const studentA = await User.create({
      name: "Student Eleven A",
      loginId: "RD-2026-111A",
      role: "student",
      status: "active",
      passwordHash,
    });
    const studentB = await User.create({
      name: "Student Eleven B",
      loginId: "RD-2026-111B",
      role: "student",
      status: "active",
      passwordHash,
    });

    // Student A logs in and gets token
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-111A", password: "TestPass@2026" });
    const tokenA = currentCookies.get("rd_device");

    // Student B has their own approved device
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.2" });
    await studentLogin({ loginId: "RD-2026-111B", password: "TestPass@2026" });

    // Now someone uses tokenA while logging in as Student B
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.3",
      deviceCookie: tokenA,
    });
    const res = await studentLogin({ loginId: "RD-2026-111B", password: "TestPass@2026" });
    expect(res.success).toBe(false);
    expect(res.pendingApproval).toBe(true);
  });

  // TEST 12: Revoked device => cannot login, existing sessions die
  it("12. Revoked device => cannot login, existing sessions die", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Twelve",
      loginId: "RD-2026-112",
      role: "student",
      status: "active",
      passwordHash,
    });

    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    const res = await studentLogin({ loginId: "RD-2026-112", password: "TestPass@2026" });
    expect(res.success).toBe(true);
    const token = currentCookies.get("rd_device");
    const sessionCookie = currentCookies.get("rd_student_session");

    const dev = await Device.findOne({ studentId: student._id });

    // Revoke device
    await removeDevice(student._id, dev.deviceId, null, "TestAdmin");

    // Try to login with revoked device token
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.1",
      deviceCookie: token,
    });
    const loginAttempt = await studentLogin({ loginId: "RD-2026-112", password: "TestPass@2026" });
    expect(loginAttempt.success).toBe(false);
    expect(loginAttempt.pendingApproval).toBe(true);

    // Existing session verification dies
    currentCookies.set("rd_student_session", sessionCookie);
    const sessionUser = await getCurrentStudent();
    expect(sessionUser).toBeNull();
  });

  // TEST 13: Rotated old token works only within 10 minutes (grace)
  it("13. Rotated old token works only within 10 minutes (grace)", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Thirteen",
      loginId: "RD-2026-113",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Initial Login gives Token 1
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-113", password: "TestPass@2026" });
    const token1 = currentCookies.get("rd_device");

    // 2. Second login rotates to Token 2, placing Token 1 into grace hashes
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.1",
      deviceCookie: token1,
    });
    await studentLogin({ loginId: "RD-2026-113", password: "TestPass@2026" });
    const token2 = currentCookies.get("rd_device");
    expect(token2).not.toBe(token1);

    // 3. Tab with Token 1 authenticates immediately (within 10m grace) -> SUCCESS
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.1",
      deviceCookie: token1,
    });
    const graceLogin = await studentLogin({ loginId: "RD-2026-113", password: "TestPass@2026" });
    expect(graceLogin.success).toBe(true);

    // 4. Simulate grace expiry (expire all grace tokens in DB)
    await Device.updateOne(
      { studentId: student._id },
      { $set: { "graceTokenHashes.$[].expiresAt": new Date(Date.now() - 1000) } }
    );

    // Tab with Token 1 after expiry -> BLOCKED
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.1",
      deviceCookie: token1,
    });
    const expiredLogin = await studentLogin({ loginId: "RD-2026-113", password: "TestPass@2026" });
    expect(expiredLogin.success).toBe(false);
    expect(expiredLogin.pendingApproval).toBe(true);
  });

  // TEST 14: Session without valid approved device binding is rejected (no adoption)
  it("14. Session without valid approved device binding is rejected (no adoption)", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Fourteen",
      loginId: "RD-2026-114",
      role: "student",
      status: "active",
      passwordHash,
    });

    // Create session without deviceId
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const session = await Session.create({
      token: tokenHash,
      tokenHash,
      userId: student._id,
      loginId: student.loginId,
      role: "student",
      deviceId: "", // unbound session
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      lastActiveAt: new Date(),
    });

    currentCookies.set("rd_student_session", rawToken);
    const sessionUser = await getCurrentStudent();
    expect(sessionUser).toBeNull();

    const reloadedSession = await Session.findById(session._id);
    expect(reloadedSession.revoked).toBe(true);
    expect(["missing_device_binding", "device_unbound"]).toContain(reloadedSession.revokedReason);
  });

  // TEST 15: New tab in same browser => still logged in; new login does not revoke other sessions
  it("15. New tab in same browser remains logged in and new login does not revoke other sessions", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "Student Fifteen",
      loginId: "RD-2026-115",
      role: "student",
      status: "active",
      passwordHash,
    });

    // Login 1
    setMockContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0", ip: "10.0.0.1" });
    await studentLogin({ loginId: "RD-2026-115", password: "TestPass@2026" });
    const deviceToken = currentCookies.get("rd_device");

    // Login 2 from another tab with same device token
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
      ip: "10.0.0.1",
      deviceCookie: deviceToken,
    });
    await studentLogin({ loginId: "RD-2026-115", password: "TestPass@2026" });

    // Session exists, is updated to latest token, and is not revoked
    const sessions = await Session.find({ userId: student._id });
    expect(sessions.length).toBe(1);
    expect(sessions[0].revoked).toBe(false);
  });

  // TEST 16: Password hash, loginId, and password.js untouched (git diff clean)
  it("16. Password hash, loginId, User.ts, and password.js untouched (git diff clean)", async () => {
    const pwDiff = execSync("git diff HEAD src/server/auth/password.js").toString();
    expect(pwDiff.trim()).toBe("");

    const userDiff = execSync("git diff HEAD src/lib/models/User.ts").toString();
    expect(userDiff.trim()).toBe("");

    // Verify hashing and verification function correctly
    const plain = "Verification@Password2026";
    const hash = await hashPassword(plain);
    expect(await comparePassword(plain, hash)).toBe(true);
    expect(await comparePassword("WrongPassword", hash)).toBe(false);
  });
});
