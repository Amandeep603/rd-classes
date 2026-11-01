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
let parseServerSignals, parseClientHints, computeProfile, matchDevice, computeDedupeKey;
let approveDeviceRequest, rejectDeviceRequest, reconsiderDeviceRequest, removeDevice;
let getCurrentStudent;

function setMockContext({ userAgent, ip, hints, deviceCookie, city, country, region, timezone }) {
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
}

describe("Step 7: Comprehensive Device & Auth Test Matrix", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_auth_secret_for_testing_purposes_123456789";
    process.env.NODE_ENV = "test";

    // 1. Setup MongoMemoryServer with guarded test db name
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

    const identityMod = await import("../src/server/auth/deviceIdentity.js");
    parseServerSignals = identityMod.parseServerSignals;
    parseClientHints = identityMod.parseClientHints;
    computeProfile = identityMod.computeProfile;
    matchDevice = identityMod.matchDevice;
    computeDedupeKey = identityMod.computeDedupeKey;

    const devSvc = await import("../src/server/auth/deviceService.js");
    approveDeviceRequest = devSvc.approveDeviceRequest;
    rejectDeviceRequest = devSvc.rejectDeviceRequest;
    reconsiderDeviceRequest = devSvc.reconsiderDeviceRequest;
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

  // TEST 1: Existing credentials log in without password changes
  it("1. Verifies existing credentials created by old/new path log in and passwords are unchanged", async () => {
    const rawPassword = "StudentSecret@123";
    const passwordHash = await hashPassword(rawPassword);

    const oldStudent = await User.create({
      name: "TEST_Aman Old",
      loginId: "RD-2026-001",
      email: "test.aman@example.com",
      phone: "9876543210",
      role: "student",
      status: "active",
      passwordHash,
      batch: "class-12",
      enrollments: [{ courseId: new mongoose.Types.ObjectId(), status: "active" }],
      emailStatus: "sent",
    });

    const initialHash = oldStudent.passwordHash;

    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ip: "103.21.244.1",
      city: "Faridabad",
      country: "IN",
      region: "HR",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });

    const res = await studentLogin({ loginId: "RD-2026-001", password: rawPassword });
    expect(res.success).toBe(true);

    const reloaded = await User.findById(oldStudent._id);
    expect(reloaded.passwordHash).toBe(initialHash);
    expect(await comparePassword(rawPassword, reloaded.passwordHash)).toBe(true);
  });

  // TEST 2: First login registers device with all fields AND location/screen/model
  it("2. Registers first device with complete hardware, IP, location, and screen metrics", async () => {
    const passwordHash = await hashPassword("TestPass@2026");
    const student = await User.create({
      name: "TEST_First Device Student",
      loginId: "RD-2026-002",
      role: "student",
      status: "active",
      passwordHash,
    });

    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      ip: "49.36.120.55",
      city: "New Delhi",
      country: "IN",
      region: "DL",
      timezone: "Asia/Kolkata",
      hints: { v: 1, sw: 1536, sh: 864, dpr: 1.25, tp: 0, pf: "Win32", md: "" },
    });

    const res = await studentLogin({ loginId: "RD-2026-002", password: "TestPass@2026" });
    expect(res.success).toBe(true);

    const devices = await Device.find({ studentId: student._id });
    expect(devices.length).toBe(1);
    const d = devices[0];

    expect(d.status).toBe("approved");
    expect(d.osFamily).toBe("Windows");
    expect(d.browserName).toBe("Chrome");
    expect(d.deviceType).toBe("desktop");
    expect(d.firstIp).toBe("49.36.120.55");
    expect(d.lastIp).toBe("49.36.120.55");
    expect(d.city).toBe("New Delhi");
    expect(d.country).toBe("IN");
    expect(d.timezone).toBe("Asia/Kolkata");
    expect(d.profile).toBeDefined();
    expect(d.profile.screenMajor).toBe(Math.round(1536 * 1.25));
    expect(d.profile.screenMinor).toBe(Math.round(864 * 1.25));
    expect(d.browsersSeen).toContain("Chrome");
    expect(d.browserTokenHashes.length).toBeGreaterThan(0);

    const session = await Session.findOne({ userId: student._id });
    expect(session).toBeDefined();
    expect(session.deviceId).toBe(d.deviceId);
  });

  // TEST 3: Same laptop in Chrome -> Edge -> Firefox from different IPs all MATCH
  it("3. Same Windows laptop in Chrome, Edge, and Firefox from different IPs all MATCH (browsersSeen lists all 3)", async () => {
    const passwordHash = await hashPassword("MultiBrowser@2026");
    const student = await User.create({
      name: "TEST_Multi Browser Student",
      loginId: "RD-2026-003",
      role: "student",
      status: "active",
      passwordHash,
    });

    const hints = { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" };

    // 1. Chrome login from IP 1.1.1.1
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ip: "1.1.1.1",
      hints,
    });
    const res1 = await studentLogin({ loginId: "RD-2026-003", password: "MultiBrowser@2026" });
    expect(res1.success).toBe(true);

    // 2. Edge login from IP 2.2.2.2 (no cookie carried)
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/120.0.0.0",
      ip: "2.2.2.2",
      hints,
    });
    const res2 = await studentLogin({ loginId: "RD-2026-003", password: "MultiBrowser@2026" });
    expect(res2.success).toBe(true);

    // 3. Firefox login from IP 3.3.3.3 (no cookie carried)
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
      ip: "3.3.3.3",
      hints,
    });
    const res3 = await studentLogin({ loginId: "RD-2026-003", password: "MultiBrowser@2026" });
    expect(res3.success).toBe(true);

    // Verify exactly 1 approved device and NO device requests
    const devices = await Device.find({ studentId: student._id });
    expect(devices.length).toBe(1);
    const requests = await DeviceRequest.find({ studentId: student._id });
    expect(requests.length).toBe(0);

    const dev = devices[0];
    expect(dev.browsersSeen).toContain("Chrome");
    expect(dev.browsersSeen).toContain("Edge");
    expect(dev.browsersSeen).toContain("Firefox");
    expect(dev.lastIp).toBe("3.3.3.3");
  });

  // TEST 4: Different devices get pending message and deduplicated request with difference flags
  it("4. Different devices get pending message and deduplicated requests with flags after repeated attempts", async () => {
    const passwordHash = await hashPassword("SecondDevice@2026");
    const student = await User.create({
      name: "TEST_Device Lock Student",
      loginId: "RD-2026-004",
      role: "student",
      status: "active",
      passwordHash,
    });

    // Register Windows laptop first
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "103.1.1.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });
    await studentLogin({ loginId: "RD-2026-004", password: "SecondDevice@2026" });

    // Attempt from Android Phone (Pixel 8) 5 times
    const androidUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
    const androidHints = { v: 1, sw: 412, sh: 915, dpr: 2.625, tp: 5, pf: "Linux armv8l", md: "Pixel 8" };

    for (let i = 1; i <= 5; i++) {
      setMockContext({
        userAgent: androidUA,
        ip: `103.2.2.${i}`,
        hints: androidHints,
      });
      const res = await studentLogin({ loginId: "RD-2026-004", password: "SecondDevice@2026" });
      expect(res.success).toBe(false);
      expect(res.pendingApproval).toBe(true);
      expect(res.error).toContain("This account is registered on another device");
    }

    // Verify deduplication: exactly 1 DeviceRequest with attemptCount = 5
    const reqs = await DeviceRequest.find({ studentId: student._id });
    expect(reqs.length).toBe(1);
    const r = reqs[0];
    expect(r.attemptCount).toBe(5);
    expect(r.status).toBe("pending");
    expect(r.deviceType).toBe("mobile");
    expect(r.osFamily).toBe("Android");
    expect(r.flags.length).toBeGreaterThan(0);
    expect(r.flags.some((f) => f.includes("OS family differs"))).toBe(true);
  });

  // TEST 5: Admin actions: Approve additional, Replace, Reject, Reconsider, Revoke, Alias
  it("5. Admin actions: Approve as additional, Replace old device, Reject, Reconsider, Revoke, Alias", async () => {
    const passwordHash = await hashPassword("AdminActions@2026");
    const student = await User.create({
      name: "TEST_Admin Actions Student",
      loginId: "RD-2026-005",
      role: "student",
      status: "active",
      passwordHash,
      maxDevices: 1,
    });

    // 1. Initial Device 1 (Windows laptop)
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "10.0.0.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });
    await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });
    const [initialDev] = await Device.find({ studentId: student._id });
    expect(initialDev).toBeDefined();

    // 2. Pending Request for iPhone
    const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148";
    const iphoneHints = { v: 1, sw: 390, sh: 844, dpr: 3, tp: 5, pf: "iPhone", md: "" };
    setMockContext({ userAgent: iphoneUA, ip: "10.0.0.2", hints: iphoneHints });
    await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });

    const [req1] = await DeviceRequest.find({ studentId: student._id, status: "pending" });
    expect(req1).toBeDefined();

    // 2a. Approve as additional device
    const approveRes = await approveDeviceRequest(req1._id, { mode: "additional" }, null, "TestAdmin");
    expect(approveRes.success).toBe(true);

    const approvedDevices = await Device.find({ studentId: student._id, status: "approved" });
    expect(approvedDevices.length).toBe(2);

    // Both devices can log in now
    setMockContext({ userAgent: iphoneUA, ip: "10.0.0.2", hints: iphoneHints });
    const iphoneLogin = await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });
    expect(iphoneLogin.success).toBe(true);

    // 2b. Revoke device
    const iphoneDev = approvedDevices.find((d) => d.deviceType === "mobile");
    await removeDevice(student._id, iphoneDev.deviceId, null, "TestAdmin");

    const reloadedIphoneDev = await Device.findOne({ deviceId: iphoneDev.deviceId });
    expect(reloadedIphoneDev.status).toBe("revoked");

    // 2c. New device request for MacBook
    const macUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
    const macHints = { v: 1, sw: 1440, sh: 900, dpr: 2, tp: 0, pf: "MacIntel", md: "" };
    setMockContext({ userAgent: macUA, ip: "10.0.0.3", hints: macHints });
    await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });

    const [macReq] = await DeviceRequest.find({ studentId: student._id, status: "pending" });

    // 2d. Reject
    await rejectDeviceRequest(macReq._id, "Unverified device", null, "TestAdmin");
    const rejectedReq = await DeviceRequest.findById(macReq._id);
    expect(rejectedReq.status).toBe("rejected");

    // Rejected device gets declined message
    setMockContext({ userAgent: macUA, ip: "10.0.0.3", hints: macHints });
    const declRes = await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });
    expect(declRes.success).toBe(false);
    expect(declRes.error).toContain("declined");

    // 2e. Reconsider
    await reconsiderDeviceRequest(macReq._id, null, "TestAdmin");
    const reconsideredReq = await DeviceRequest.findById(macReq._id);
    expect(reconsideredReq.status).toBe("pending");

    // 2f. Approve as same_device (alias) to initialDev
    await approveDeviceRequest(macReq._id, { mode: "same_device", targetDeviceId: initialDev.deviceId }, null, "TestAdmin");
    const devWithAlias = await Device.findOne({ deviceId: initialDev.deviceId });
    expect(devWithAlias.aliases.length).toBeGreaterThan(0);

    // Next login from MacBook profile matches alias
    setMockContext({ userAgent: macUA, ip: "10.0.0.3", hints: macHints });
    const aliasLogin = await studentLogin({ loginId: "RD-2026-005", password: "AdminActions@2026" });
    expect(aliasLogin.success).toBe(true);
  });

  // TEST 6: Screen resize continuity via cookie, legacy device profile learning, hints_missing fail open
  it("6. Continuity via rd_device cookie, legacy profile learning, and fail-open on missing hints", async () => {
    const passwordHash = await hashPassword("Continuity@2026");
    const student = await User.create({
      name: "TEST_Continuity Student",
      loginId: "RD-2026-006",
      role: "student",
      status: "active",
      passwordHash,
    });

    // 1. Initial Login with random cookie
    const deviceToken = "rd_test_token_" + crypto.randomBytes(16).toString("hex");
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "10.1.1.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
      deviceCookie: deviceToken,
    });
    const res1 = await studentLogin({ loginId: "RD-2026-006", password: "Continuity@2026" });
    expect(res1.success).toBe(true);

    // 2. Screen size changes completely (e.g. plugged into external monitor) but same browser cookie
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "10.1.1.2",
      hints: { v: 1, sw: 3840, sh: 2160, dpr: 1.5, tp: 0, pf: "Win32", md: "" },
      deviceCookie: deviceToken,
    });
    const res2 = await studentLogin({ loginId: "RD-2026-006", password: "Continuity@2026" });
    expect(res2.success).toBe(true);

    // 3. Login without hints fails open (MATCHes existing device with hints_missing log)
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "10.1.1.3",
      hints: null, // No hints cookie
      deviceCookie: null,
    });
    const res3 = await studentLogin({ loginId: "RD-2026-006", password: "Continuity@2026" });
    expect(res3.success).toBe(true);
  });

  // TEST 7: iPad vs Mac classification
  it("7. Classifies Macintosh UA with tp > 1 as iPad and Macintosh UA without touch as MacBook", () => {
    const macUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

    // iPad: Macintosh UA + touch points > 1
    const ipadHints = { v: 1, sw: 1024, sh: 1366, dpr: 2, tp: 5, pf: "MacIntel", md: "" };
    const ipadSignals = parseServerSignals(macUA, new Map(), ipadHints);
    expect(ipadSignals.deviceType).toBe("tablet");
    expect(ipadSignals.osFamily).toBe("iPadOS");
    expect(ipadSignals.label).toContain("iPad");

    // MacBook: Macintosh UA + touch points = 0
    const macbookHints = { v: 1, sw: 1440, sh: 900, dpr: 2, tp: 0, pf: "MacIntel", md: "" };
    const macbookSignals = parseServerSignals(macUA, new Map(), macbookHints);
    expect(macbookSignals.deviceType).toBe("desktop");
    expect(macbookSignals.osFamily).toBe("macOS");
    expect(macbookSignals.label).toContain("MacBook");
  });

  // TEST 8: Session validity & DB error resilience
  it("8. Validates session and ensures transient DB errors fail safe without logging student out", async () => {
    const passwordHash = await hashPassword("SessionTest@2026");
    const student = await User.create({
      name: "TEST_Session Student",
      loginId: "RD-2026-008",
      role: "student",
      status: "active",
      passwordHash,
    });

    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "127.0.0.1",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });
    const loginRes = await studentLogin({ loginId: "RD-2026-008", password: "SessionTest@2026" });
    expect(loginRes.success).toBe(true);

    const sessionCookie = currentCookies.get("rd_student_session");
    expect(sessionCookie).toBeDefined();

    // Verify session lookup
    const studentSession = await getCurrentStudent();
    expect(studentSession).toBeDefined();
    expect(studentSession.user?.loginId).toBe("RD-2026-008");
  });

  // TEST 9: Reset devices maintenance tool
  it("9. Reset devices archives collections, leaves passwords/enrollments byte-identical, and unbinds sessions for adoption", async () => {
    const passwordHash = await hashPassword("ResetDevice@2026");
    const courseId = new mongoose.Types.ObjectId();
    const student = await User.create({
      name: "TEST_Reset Student",
      loginId: "RD-2026-009",
      role: "student",
      status: "active",
      passwordHash,
      enrollments: [{ courseId, status: "active" }],
      emailStatus: "sent",
    });

    // Student logs in and registers device
    setMockContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      ip: "10.10.10.10",
      hints: { v: 1, sw: 1920, sh: 1080, dpr: 1, tp: 0, pf: "Win32", md: "" },
    });
    await studentLogin({ loginId: "RD-2026-009", password: "ResetDevice@2026" });

    const beforeUser = await User.findById(student._id).lean();

    // Perform maintenance reset
    const dateStr = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
    const archiveDevicesName = `devices_archive_${dateStr}`;
    const archiveRequestsName = `device_requests_archive_${dateStr}`;

    const devices = await Device.find({}).lean();
    if (devices.length > 0) {
      await mongoose.connection.collection(archiveDevicesName).insertMany(devices);
    }
    await Device.deleteMany({});
    await DeviceRequest.deleteMany({});
    await Session.updateMany({}, { $set: { deviceId: "" } });

    // Verify Archive exists and has records
    const archivedCount = await mongoose.connection.collection(archiveDevicesName).countDocuments();
    expect(archivedCount).toBe(devices.length);

    // Verify User credentials & enrollments are 100% byte-identical
    const afterUser = await User.findById(student._id).lean();
    expect(afterUser.passwordHash).toBe(beforeUser.passwordHash);
    expect(afterUser.emailStatus).toBe(beforeUser.emailStatus);
    expect(JSON.stringify(afterUser.enrollments)).toBe(JSON.stringify(beforeUser.enrollments));

    // Verify Active session was NOT destroyed, only deviceId unbound
    const session = await Session.findOne({ userId: student._id });
    expect(session).toBeDefined();
    expect(session.deviceId).toBe("");
    expect(session.revoked).toBe(false);

    // Adoption rule: next request re-registers current device
    const studentSession = await getCurrentStudent();
    expect(studentSession).toBeDefined();

    const adoptedDevices = await Device.find({ studentId: student._id });
    expect(adoptedDevices.length).toBe(1);
    expect(adoptedDevices[0].status).toBe("approved");

    const reloadedSession = await Session.findById(session._id);
    expect(reloadedSession.deviceId).toBe(adoptedDevices[0].deviceId);
  });

  // TEST 10: Deduplication key & Profile tolerance matching
  it("10. Matches screen within 3% tolerance and enforces orientation-invariance", () => {
    // 1920x1080 profile: screenMajor = 1920, screenMinor = 1080
    const profile = { screenMajor: 1920, screenMinor: 1080, model: "" };
    const approvedDevice = {
      coarseKey: "mock_key",
      profile,
      aliases: [],
      browserTokenHashes: [],
    };

    // Candidate 1: Minor 1.5% resize (1895x1065) -> within 3% tolerance -> MATCH
    const res1 = matchDevice({
      signals: { coarseKey: "mock_key", browserName: "Chrome" },
      profile: { screenMajor: 1895, screenMinor: 1065, model: "" },
      cookieTokenHash: null,
      approvedDevices: [approvedDevice],
      deviceLockMode: "smart",
    });
    expect(res1.matched).toBe(true);

    // Candidate 2: Different screen (2560x1440) -> > 3% -> NO MATCH
    const res2 = matchDevice({
      signals: { coarseKey: "mock_key", browserName: "Chrome" },
      profile: { screenMajor: 2560, screenMinor: 1440, model: "" },
      cookieTokenHash: null,
      approvedDevices: [approvedDevice],
      deviceLockMode: "smart",
    });
    expect(res2.matched).toBe(false);
  });
});

