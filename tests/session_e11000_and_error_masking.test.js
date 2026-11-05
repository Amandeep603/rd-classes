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
    json: (data, init) => ({ data, status: init?.status || 200, json: async () => data }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

let mongod = null;
let assertTestDatabase;
let User, Device, Session, Lecture, LectureProgress;
let studentLogin, hashPassword, comparePassword, getCurrentStudent;
let createOrReplaceSession;
let formatPublicError, GENERIC_PUBLIC_ERROR_TEXT;

function setMockContext({ userAgent, ip, deviceCookie, pendingCookie, testCookie = "1" } = {}) {
  currentHeaders.clear();
  currentCookies.clear();

  if (userAgent) currentHeaders.set("user-agent", userAgent);
  if (ip) currentHeaders.set("x-forwarded-for", ip);
  if (deviceCookie) currentCookies.set("rd_device", deviceCookie);
  if (pendingCookie) currentCookies.set("rd_pending", pendingCookie);
  if (testCookie) currentCookies.set("rd_cookie_test", testCookie);
}

describe("Session E11000 Prevention & Global Error Masking Suite", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_auth_secret_for_testing_purposes_123456789";
    process.env.NODE_ENV = "test";

    // Setup MongoMemoryServer with guarded test db name
    mongod = await MongoMemoryServer.create();
    const testUri = mongod.getUri() + "rdclasses_test_e11000";
    process.env.MONGODB_URI = testUri;
    process.env.MONGODB_URI_TEST = testUri;

    const guardMod = await import("../src/server/db/testGuard.js");
    assertTestDatabase = guardMod.assertTestDatabase;
    // Guard MUST pass for test database
    assertTestDatabase(testUri);

    await mongoose.connect(testUri);

    const userMod = await import("../src/lib/models/User.ts");
    User = userMod.User;
    const devMod = await import("../src/lib/models/Device.ts");
    Device = devMod.Device;
    const sessMod = await import("../src/lib/models/Session.ts");
    Session = sessMod.Session;
    const lecMod = await import("../src/lib/models/Lecture.ts");
    Lecture = lecMod.Lecture;
    const progMod = await import("../src/lib/models/LectureProgress.ts");
    LectureProgress = progMod.LectureProgress;

    // Ensure unique compound index { userId: 1, deviceId: 1 } exists in test DB
    await Session.collection.createIndex({ userId: 1, deviceId: 1 }, { unique: true });

    const authMod = await import("../src/server/auth/authService.js");
    studentLogin = authMod.studentLogin;
    const pwMod = await import("../src/server/auth/password.js");
    hashPassword = pwMod.hashPassword;
    comparePassword = pwMod.comparePassword;

    const sessSvc = await import("../src/server/auth/session.js");
    getCurrentStudent = sessSvc.getCurrentStudent;
    createOrReplaceSession = sessSvc.createOrReplaceSession;

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
    vi.restoreAllMocks();
  });

  // TEST 1: Security guard refuses non-test database
  it("1. assertTestDatabase refuses databases without 'test'", () => {
    expect(() => assertTestDatabase("mongodb://localhost:27017/rdclasses_production")).toThrow(
      /Dangerous execution prevented/
    );
    expect(() => assertTestDatabase("mongodb://localhost:27017/production")).toThrow();
  });

  // TEST 2: Student logs in, closes tab without logout, logs in again x10 -> exactly 1 session, 0 E11000
  it("2. Login, tab close without logout, login again x10 -> exactly one session row, no E11000", async () => {
    const passwordHash = await hashPassword("StudentPass@2026");
    const student = await User.create({
      name: "Returning Student",
      loginId: "RD-2026-901",
      role: "student",
      status: "active",
      passwordHash,
    });

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0";
    const ip = "192.168.1.100";
    setMockContext({ userAgent: ua, ip });

    // Initial Login: creates first approved device
    const res1 = await studentLogin({ loginId: "RD-2026-901", password: "StudentPass@2026" });
    expect(res1.success).toBe(true);
    const initialDeviceCookie = currentCookies.get("rd_device");
    expect(initialDeviceCookie).toBeDefined();

    const deviceDoc = await Device.findOne({ studentId: student._id });
    expect(deviceDoc).toBeDefined();
    const activeDeviceId = deviceDoc.deviceId;

    // Verify session count is 1
    let sessionCount = await Session.countDocuments({ userId: student._id, deviceId: activeDeviceId });
    expect(sessionCount).toBe(1);

    // Now simulate closing the tab without logging out, and logging in again 10 times consecutively
    for (let i = 1; i <= 10; i++) {
      // Keep device cookie (browser remains the same), but clear session cookie (tab closed)
      const currentDevToken = currentCookies.get("rd_device");
      currentCookies.delete("rd_student_session");
      setMockContext({ userAgent: ua, ip, deviceCookie: currentDevToken });

      const loginResult = await studentLogin({ loginId: "RD-2026-901", password: "StudentPass@2026" });
      expect(loginResult.success).toBe(true);

      // Check session count: MUST remain exactly 1, never duplicate
      sessionCount = await Session.countDocuments({ userId: student._id, deviceId: activeDeviceId });
      expect(sessionCount).toBe(1);

      // Verify the session in DB is active and has a valid token
      const currentSession = await Session.findOne({ userId: student._id, deviceId: activeDeviceId });
      expect(currentSession.revoked).toBe(false);
      expect(new Date(currentSession.expiresAt).getTime()).toBeGreaterThan(Date.now());
    }
  });

  // TEST 3: 20 Parallel logins of the same student & device -> all succeed with exactly 1 document
  it("3. 20 parallel logins of the same student and device -> all succeed with one document", async () => {
    const passwordHash = await hashPassword("ConcurrentPass@2026");
    const student = await User.create({
      name: "Concurrent Student",
      loginId: "RD-2026-902",
      role: "student",
      status: "active",
      passwordHash,
    });

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0";
    const ip = "192.168.1.101";
    setMockContext({ userAgent: ua, ip });

    // Initial enrollment to establish device
    const initRes = await studentLogin({ loginId: "RD-2026-902", password: "ConcurrentPass@2026" });
    expect(initRes.success).toBe(true);

    const dev = await Device.findOne({ studentId: student._id });
    const deviceId = dev.deviceId;

    // Launch 20 simultaneous calls to createOrReplaceSession for this user and device
    const promises = Array.from({ length: 20 }, (_, idx) => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      return createOrReplaceSession({
        userId: student._id,
        deviceId,
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
        role: "student",
        ip: "192.168.1.101",
        userAgent: ua,
      });
    });

    const results = await Promise.all(promises);
    expect(results.length).toBe(20);
    for (const doc of results) {
      expect(doc).toBeDefined();
      expect(doc.userId.toString()).toBe(student._id.toString());
      expect(doc.deviceId).toBe(deviceId);
      expect(doc.revoked).toBe(false);
    }

    // Verify exactly ONE document exists in MongoDB
    const count = await Session.countDocuments({ userId: student._id, deviceId });
    expect(count).toBe(1);
  });

  // TEST 4: Existing sessions created before the change stay valid; password hashes byte-identical
  it("4. Existing sessions remain valid and password hashes are byte-identical", async () => {
    const passwordPlain = "PreExistingSecret@2026";
    const passwordHash = await hashPassword(passwordPlain);

    // Verify bcrypt comparison is byte-identical and git diff on password.js is clean
    expect(await comparePassword(passwordPlain, passwordHash)).toBe(true);
    expect(await comparePassword("WrongPass", passwordHash)).toBe(false);

    const pwDiff = execSync("git diff HEAD src/server/auth/password.js").toString();
    expect(pwDiff.trim()).toBe("");

    const student = await User.create({
      name: "Legacy Session Student",
      loginId: "RD-2026-903",
      role: "student",
      status: "active",
      passwordHash,
    });

    const dev = await Device.create({
      studentId: student._id,
      deviceId: "dev_legacy_test",
      deviceKey: "dev_legacy_test",
      status: "approved",
    });

    // Create a pre-existing session token in the legacy format
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await Session.create({
      userId: student._id,
      deviceId: dev.deviceId,
      tokenHash,
      role: "student",
      expiresAt: new Date(Date.now() + 86400000),
      revoked: false,
      lastSeenAt: new Date(),
    });

    // Test that getCurrentStudent authenticates this pre-existing session without issues
    currentCookies.set("rd_student_session", rawToken);
    const sessionStudent = await getCurrentStudent();
    expect(sessionStudent).toBeDefined();
    expect(sessionStudent.user.loginId).toBe("RD-2026-903");
  });

  // TEST 5: Error Masking: Force E11000, CastError, ValidationError, Timeout, TypeError
  it("5. Never show raw errors: forces E11000, CastError, ValidationError, Timeout, TypeError", async () => {
    const forbiddenPatterns = [
      "E11000",
      "dup key",
      "ObjectId",
      "collection",
      "index",
      "mongo",
      "rdclasses",
      "sessions",
      "stack",
      "node_modules",
    ];

    const testErrors = [
      new Error("E11000 duplicate key error collection: rdclasses.sessions index: userId_1_deviceId_1 dup key: { userId: ObjectId('664a1'), deviceId: 'dev_123' }"),
      new (class CastError extends Error { constructor() { super('Cast to ObjectId failed for value "invalid_id" (type string) at path "_id" for model "User"'); this.name = "CastError"; } })(),
      new (class ValidationError extends Error { constructor() { super("Lecture validation failed: title: Path 'title' is required (collection: rdclasses.lectures)"); this.name = "ValidationError"; } })(),
      new (class MongoTimeoutError extends Error { constructor() { super("MongoServerSelectionError: Server selection timed out after 30000 ms"); this.name = "MongoServerSelectionError"; } })(),
      new TypeError("Cannot read properties of undefined (reading 'split') in node_modules/mongoose/lib/index.js"),
    ];

    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    for (const forcedErr of testErrors) {
      const formatted = formatPublicError(forcedErr, { loginId: "RD-2026-999" });

      // Assert userMessage contains generic text
      expect(formatted.userMessage).toContain(GENERIC_PUBLIC_ERROR_TEXT);
      // Assert reference code exists (e.g. ERR-XXXXX)
      expect(formatted.refCode).toMatch(/^ERR-[0-9A-Z]{5}$/);
      // Assert userMessage contains reference code
      expect(formatted.userMessage).toContain(formatted.refCode);

      // Assert userMessage NEVER contains any of the forbidden technical words
      for (const word of forbiddenPatterns) {
        expect(formatted.userMessage.toLowerCase()).not.toContain(word.toLowerCase());
      }

      // Assert the server log captured the reference code and loginId
      expect(logSpy).toHaveBeenCalled();
      const lastLog = logSpy.mock.calls[logSpy.mock.calls.length - 1][0];
      expect(lastLog).toContain(formatted.refCode);
      expect(lastLog).toContain("loginId=RD-2026-999");
    }

    logSpy.mockRestore();
  });

  // TEST 6: Known user-facing messages stay intact without reference code
  it("6. Known user-facing messages pass through intact without masking", () => {
    const knownMessages = [
      "Invalid login ID or password",
      "Account is locked for 15 minutes",
      "Too many failed attempts. Please wait 15 minutes before trying again.",
      "This device is pending approval.",
      "Device request was declined by admin.",
      "Lecture not found",
    ];

    for (const msg of knownMessages) {
      const formatted = formatPublicError(new Error(msg));
      expect(formatted.isKnown).toBe(true);
      expect(formatted.userMessage).toBe(msg);
      expect(formatted.refCode).toBeNull();
    }
  });

  // TEST 7: Route handler error wrapper tests across login, student API, admin API, import preview
  it("7. Route handlers & server actions wrap all errors without leaking internals", async () => {
    const { loginStudentAction } = await import("../src/server/actions/auth.actions.js");
    const { POST: progressPost } = await import("../src/app/api/student/lectures/[id]/progress/route.js");
    const { GET: devicesGet } = await import("../src/app/api/admin/devices/route.js");
    const { POST: previewPost } = await import("../src/app/api/admin/students/import/preview/route.js");

    const forbiddenPatterns = [
      "E11000",
      "dup key",
      "ObjectId",
      "collection",
      "index",
      "mongo",
      "rdclasses",
      "sessions",
      "stack",
      "node_modules",
    ];

    // a) Force E11000 in loginStudentAction
    const s901 = await User.findOne({ loginId: "RD-2026-901" });
    const devToken = "token_matching_device_test_901";
    const devTokenHash = crypto.createHash("sha256").update(devToken).digest("hex");
    await Device.updateOne({ studentId: s901._id }, { $set: { browserTokenHashes: [devTokenHash] } });
    currentCookies.set("rd_device", devToken);

    vi.spyOn(Session, "findOneAndUpdate").mockRejectedValue(
      new Error("E11000 duplicate key error collection: rdclasses.sessions index: userId_1_deviceId_1 dup key: { userId: ObjectId('664a1') }")
    );
    const formData = new FormData();
    formData.set("loginId", "RD-2026-901");
    formData.set("password", "StudentPass@2026");
    const actionResult = await loginStudentAction(null, formData);
    expect(actionResult.success).toBe(false);
    expect(actionResult.error).toContain(GENERIC_PUBLIC_ERROR_TEXT);
    for (const word of forbiddenPatterns) {
      expect(actionResult.error.toLowerCase()).not.toContain(word.toLowerCase());
    }
    vi.restoreAllMocks();

    // b) Force CastError in student progress API
    const progressReq = new Request("http://localhost/api/student/lectures/123/progress", {
      method: "POST",
      body: JSON.stringify({ watchedSeconds: 50 }),
    });
    // Mock requireStudentApi
    const sessMod = await import("../src/server/auth/session.js");
    vi.spyOn(sessMod, "requireStudentApi").mockResolvedValueOnce({
      authenticated: true,
      user: { _id: "664a1234567890abcdef1234" },
    });
    vi.spyOn(Lecture, "findById").mockImplementationOnce(() => {
      const err = new Error('Cast to ObjectId failed for value "123" at path "_id" for model "Lecture"');
      err.name = "CastError";
      throw err;
    });
    const progRes = await progressPost(progressReq, { params: Promise.resolve({ id: "123" }) });
    const progData = await progRes.json();
    expect(progData.error).toContain(GENERIC_PUBLIC_ERROR_TEXT);
    for (const word of forbiddenPatterns) {
      expect(progData.error.toLowerCase()).not.toContain(word.toLowerCase());
    }

    // c) Force MongoTimeoutError in admin devices API
    vi.spyOn(sessMod, "requireAdminApi").mockResolvedValueOnce({
      authenticated: true,
      user: { _id: "admin123", name: "Admin" },
    });
    vi.spyOn(Device, "find").mockImplementationOnce(() => {
      const err = new Error("MongoServerSelectionError: connection timed out after 30000ms");
      err.name = "MongoServerSelectionError";
      throw err;
    });
    const devReq = new Request("http://localhost/api/admin/devices");
    const devRes = await devicesGet(devReq);
    const devData = await devRes.json();
    expect(devData.error).toContain(GENERIC_PUBLIC_ERROR_TEXT);
    for (const word of forbiddenPatterns) {
      expect(devData.error.toLowerCase()).not.toContain(word.toLowerCase());
    }

    // d) Force TypeError in import preview API
    vi.spyOn(sessMod, "requireAdminApi").mockResolvedValueOnce({
      authenticated: true,
      user: { _id: "admin123", name: "Admin" },
    });
    const importSvc = await import("../src/server/services/studentAdminService.js");
    vi.spyOn(importSvc, "parseAndValidateImport").mockImplementationOnce(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'split') in node_modules/xlsx/index.js");
    });
    const previewFormData = new FormData();
    const fakeFile = new Blob(["fake data"], { type: "text/csv" });
    previewFormData.set("file", fakeFile);
    const previewReq = new Request("http://localhost/api/admin/students/import/preview", {
      method: "POST",
      body: previewFormData,
    });
    const previewRes = await previewPost(previewReq);
    const previewData = await previewRes.json();
    expect(previewData.error).toContain(GENERIC_PUBLIC_ERROR_TEXT);
    for (const word of forbiddenPatterns) {
      expect(previewData.error.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
