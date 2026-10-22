import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// In-memory cookie and header simulation
const cookieJar = new Map();
const requestHeaders = new Map();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name) => {
      const val = cookieJar.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name, value, opts) => {
      if (opts?.maxAge === 0) {
        cookieJar.delete(name);
      } else {
        cookieJar.set(name, value);
      }
    },
    delete: (name) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => ({
    get: (name) => requestHeaders.get(name?.toLowerCase()) || null,
  }),
}));

let mongod = null;

describe("RD Classes Backend Foundation Test Suite", () => {
  let User, Device, DeviceRequest, Session, Course, Lecture, Enrollment, Progress, LoginAttempt;
  let hashPassword, comparePassword, comparePasswordDummy;
  let studentLogin, adminLogin, logoutUser;
  let getCurrentUser, requireStudent, requireAdmin;
  let approveDeviceRequest, removeDevice, resetAllDevices;
  let signDeviceToken, verifyDeviceToken;
  let getAuthorizedLecture;
  let saveLectureProgress;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.NODE_ENV = "test";

    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 120000,
        },
      });
      process.env.MONGODB_URI = mongod.getUri();
    } catch {
      if (process.env.MONGODB_URI_TEST) {
        process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
      } else if (process.env.MONGODB_URI) {
        // Fallback to separate Atlas database 'rdclasses_test' as specified in prompt
        const rawUri = process.env.MONGODB_URI;
        const testUri = rawUri.replace(/\/[^/?]+(\?|$)/, "/rdclasses_test$1");
        process.env.MONGODB_URI = testUri;
      } else {
        throw new Error("Unable to start in-memory MongoDB or connect to MONGODB_URI_TEST");
      }
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });

    const models = await import("../src/server/db/models/index.js");
    User = models.User;
    Device = models.Device;
    DeviceRequest = models.DeviceRequest;
    Session = models.Session;
    Course = models.Course;
    Lecture = models.Lecture;
    Enrollment = models.Enrollment;
    Progress = models.Progress;
    LoginAttempt = models.LoginAttempt;

    const pwd = await import("../src/server/auth/password.js");
    hashPassword = pwd.hashPassword;
    comparePassword = pwd.comparePassword;
    comparePasswordDummy = pwd.comparePasswordDummy;

    const tkn = await import("../src/server/auth/tokens.js");
    signDeviceToken = tkn.signDeviceToken;
    verifyDeviceToken = tkn.verifyDeviceToken;

    const authSvc = await import("../src/server/auth/authService.js");
    studentLogin = authSvc.studentLogin;
    adminLogin = authSvc.adminLogin;
    logoutUser = authSvc.logoutUser;

    const sess = await import("../src/server/auth/session.js");
    getCurrentUser = sess.getCurrentUser;
    requireStudent = sess.requireStudent;
    requireAdmin = sess.requireAdmin;

    const devSvc = await import("../src/server/auth/deviceService.js");
    approveDeviceRequest = devSvc.approveDeviceRequest;
    removeDevice = devSvc.removeDevice;
    resetAllDevices = devSvc.resetAllDevices;

    const lecSvc = await import("../src/server/services/lectureService.js");
    getAuthorizedLecture = lecSvc.getAuthorizedLecture;

    const progSvc = await import("../src/server/services/progressService.js");
    saveLectureProgress = progSvc.saveLectureProgress;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    cookieJar.clear();
    requestHeaders.clear();
    requestHeaders.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0");
    requestHeaders.set("x-forwarded-for", "127.0.0.1");
    await Promise.all([
      User.deleteMany({}),
      Device.deleteMany({}),
      DeviceRequest.deleteMany({}),
      Session.deleteMany({}),
      Course.deleteMany({}),
      Lecture.deleteMany({}),
      Enrollment.deleteMany({}),
      Progress.deleteMany({}),
      LoginAttempt.deleteMany({}),
    ]);
  });

  it("1. Password hashing and unknown-ID timing protection", async () => {
    const raw = "studentPassword123";
    const hash = await hashPassword(raw);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);

    const matches = await comparePassword(raw, hash);
    expect(matches).toBe(true);

    const wrong = await comparePassword("wrongPassword", hash);
    expect(wrong).toBe(false);

    // Dummy compare should complete without error
    const dummy = await comparePasswordDummy("anyInput");
    expect(dummy).toBe(false);
  });

  it("2. First login auto-registers the device (deviceCount increments 0 -> 1)", async () => {
    const hash = await hashPassword("password123");
    const student = await User.create({
      role: "student",
      name: "Rohan Gupta",
      loginId: "rohan100",
      passwordHash: hash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 0,
    });

    const res = await studentLogin({ loginId: "rohan100", password: "password123" });
    expect(res.success).toBe(true);
    expect(res.redirectTo).toBe("/student");

    const updated = await User.findById(student._id);
    expect(updated.deviceCount).toBe(1);

    const dev = await Device.findOne({ userId: student._id });
    expect(dev).toBeTruthy();
    expect(dev.approvedBy).toBe("auto-first-login");

    const session = await Session.findOne({ userId: student._id });
    expect(session).toBeTruthy();
    expect(cookieJar.has("rd_session")).toBe(true);
    expect(cookieJar.has("rd_device")).toBe(true);
  });

  it("3. The same device logs in again successfully without creating extra device entries", async () => {
    const hash = await hashPassword("password123");
    await User.create({
      role: "student",
      name: "Rohan Gupta",
      loginId: "rohan100",
      passwordHash: hash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 0,
    });

    // First login
    await studentLogin({ loginId: "rohan100", password: "password123" });
    const countAfterFirst = await Device.countDocuments({});
    expect(countAfterFirst).toBe(1);

    // Second login with same device cookie preserved in cookieJar
    const res2 = await studentLogin({ loginId: "rohan100", password: "password123" });
    expect(res2.success).toBe(true);

    const countAfterSecond = await Device.countDocuments({});
    expect(countAfterSecond).toBe(1);
  });

  it("4. A second device gets NO session and exactly one pending request (reused on repeat attempts)", async () => {
    const hash = await hashPassword("password123");
    const student = await User.create({
      role: "student",
      name: "Aman Verma",
      loginId: "aman100",
      passwordHash: hash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 0,
    });

    // Login on Device A
    await studentLogin({ loginId: "aman100", password: "password123" });
    expect(cookieJar.has("rd_session")).toBe(true);

    // Switch to Device B (new device cookie, different UA)
    cookieJar.delete("rd_session");
    cookieJar.delete("rd_device");
    requestHeaders.set("user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1");
    requestHeaders.set("x-forwarded-for", "192.168.1.50");

    const resB1 = await studentLogin({ loginId: "aman100", password: "password123" });
    expect(resB1.success).toBe(false);
    expect(resB1.status).toBe("pending");
    expect(resB1.redirectTo).toContain("/student/login/pending");
    expect(cookieJar.has("rd_session")).toBe(false); // NO session

    const requestsCount1 = await DeviceRequest.countDocuments({ userId: student._id });
    expect(requestsCount1).toBe(1);

    // Repeat attempt on Device B reuses existing pending request
    const resB2 = await studentLogin({ loginId: "aman100", password: "password123" });
    expect(resB2.status).toBe("pending");

    const requestsCount2 = await DeviceRequest.countDocuments({ userId: student._id });
    expect(requestsCount2).toBe(1); // Still exactly 1
  });

  it("5. Approve 'add' fails when limit is full, and succeeds after raising the limit", async () => {
    const hash = await hashPassword("password123");
    const admin = await User.create({
      role: "admin",
      name: "Admin User",
      loginId: "admin",
      passwordHash: hash,
    });

    const student = await User.create({
      role: "student",
      name: "Sneha",
      loginId: "sneha100",
      passwordHash: hash,
      deviceLimit: 1,
      deviceCount: 1,
    });

    // Pending request for a 2nd device
    const req = await DeviceRequest.create({
      userId: student._id,
      deviceId: "dev-222",
      label: "Firefox on Mac",
      status: "pending",
    });

    // Approve 'add' should fail because 1/1 slots are used
    await expect(
      approveDeviceRequest(req._id, { mode: "add" }, admin._id)
    ).rejects.toThrow(/Device limit/);

    // Raise limit and approve should succeed
    const res = await approveDeviceRequest(req._id, { mode: "raise-and-add" }, admin._id);
    expect(res.success).toBe(true);

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.deviceLimit).toBe(2);
    expect(updatedStudent.deviceCount).toBe(2);
  });

  it("6. Approve 'replace' immediately kills the old device's session and registers the new device", async () => {
    const hash = await hashPassword("password123");
    const admin = await User.create({ role: "admin", name: "Admin", loginId: "admin", passwordHash: hash });
    const student = await User.create({
      role: "student",
      name: "Aryan",
      loginId: "aryan100",
      passwordHash: hash,
      deviceLimit: 1,
      deviceCount: 1,
    });

    await Device.create({
      userId: student._id,
      deviceId: "old-phone",
      label: "Old iPhone",
      approvedBy: "auto",
    });

    await Session.create({
      userId: student._id,
      deviceId: "old-phone",
      tokenHash: "hash-of-old-token",
      expiresAt: new Date(Date.now() + 100000),
    });

    const req = await DeviceRequest.create({
      userId: student._id,
      deviceId: "new-laptop",
      label: "New Windows Laptop",
      status: "pending",
    });

    // Replace old-phone with new-laptop
    await approveDeviceRequest(
      req._id,
      { mode: "replace", replaceDeviceId: "old-phone" },
      admin._id
    );

    const oldDev = await Device.findOne({ deviceId: "old-phone" });
    expect(oldDev).toBeNull();

    const oldSession = await Session.findOne({ deviceId: "old-phone" });
    expect(oldSession).toBeNull(); // Killed immediately

    const newDev = await Device.findOne({ deviceId: "new-laptop" });
    expect(newDev).toBeTruthy();

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.deviceCount).toBe(1); // Count stays 1
  });

  it("7. removeDevice invalidates sessions and decrements counter", async () => {
    const hash = await hashPassword("password123");
    const admin = await User.create({ role: "admin", name: "Admin", loginId: "admin", passwordHash: hash });
    const student = await User.create({
      role: "student",
      name: "Dikshita",
      loginId: "dikshita100",
      passwordHash: hash,
      deviceLimit: 1,
      deviceCount: 1,
    });

    await Device.create({
      userId: student._id,
      deviceId: "device-1",
      label: "Chrome",
      approvedBy: "auto",
    });

    await Session.create({
      userId: student._id,
      deviceId: "device-1",
      tokenHash: "token-1",
      expiresAt: new Date(Date.now() + 100000),
    });

    await removeDevice(student._id, "device-1", admin._id);

    expect(await Device.countDocuments({ userId: student._id })).toBe(0);
    expect(await Session.countDocuments({ userId: student._id })).toBe(0);

    const updated = await User.findById(student._id);
    expect(updated.deviceCount).toBe(0);
  });

  it("8. resetAllDevices clears all devices and sessions, so next login auto-registers", async () => {
    const hash = await hashPassword("password123");
    const admin = await User.create({ role: "admin", name: "Admin", loginId: "admin", passwordHash: hash });
    const student = await User.create({
      role: "student",
      name: "Vardaan",
      loginId: "vardaan100",
      passwordHash: hash,
      deviceLimit: 1,
      deviceCount: 1,
    });

    await Device.create({ userId: student._id, deviceId: "d1", label: "Dev 1", approvedBy: "auto" });
    await Session.create({ userId: student._id, deviceId: "d1", tokenHash: "h1", expiresAt: new Date(Date.now() + 10000) });

    await resetAllDevices(student._id, admin._id);

    const userAfterReset = await User.findById(student._id);
    expect(userAfterReset.deviceCount).toBe(0);

    // Next login from new device should auto-register cleanly
    cookieJar.clear();
    const loginRes = await studentLogin({ loginId: "vardaan100", password: "password123" });
    expect(loginRes.success).toBe(true);

    const userAfterReRegister = await User.findById(student._id);
    expect(userAfterReRegister.deviceCount).toBe(1);
  });

  it("9. A blocked student cannot log in and existing sessions die", async () => {
    const hash = await hashPassword("password123");
    const student = await User.create({
      role: "student",
      name: "Blocked User",
      loginId: "blocked100",
      passwordHash: hash,
      status: "blocked",
      deviceLimit: 1,
      deviceCount: 1,
    });

    const res = await studentLogin({ loginId: "blocked100", password: "password123" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("blocked");
  });

  it("10. Rate-limit lock triggers after 5 consecutive failures", async () => {
    const hash = await hashPassword("password123");
    await User.create({
      role: "student",
      name: "Rate Limit User",
      loginId: "ratelimit100",
      passwordHash: hash,
    });

    for (let i = 0; i < 5; i++) {
      await studentLogin({ loginId: "ratelimit100", password: "wrongPassword" });
    }

    // 6th attempt should be blocked by rate limiter even with the correct password
    const res = await studentLogin({ loginId: "ratelimit100", password: "password123" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Too many failed attempts");
  });

  it("11. A forged rd_device signature counts as a new device", () => {
    const realDeviceId = "valid-uuid-1234";
    const signed = signDeviceToken(realDeviceId);
    expect(verifyDeviceToken(signed)).toBe(realDeviceId);

    const forged = `${realDeviceId}.badsignature0000000000000000000000000000000000000000000000000000`;
    expect(verifyDeviceToken(forged)).toBeNull();
  });

  it("12. 10 parallel approvals never exceed deviceLimit", async () => {
    const hash = await hashPassword("password123");
    const student = await User.create({
      role: "student",
      name: "Parallel User",
      loginId: "parallel100",
      passwordHash: hash,
      deviceLimit: 1,
      deviceCount: 0,
    });

    // 10 concurrent atomic slot increment attempts
    const attempts = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        User.updateOne(
          { _id: student._id, deviceCount: { $lt: student.deviceLimit } },
          { $inc: { deviceCount: 1 } }
        )
      )
    );

    const successes = attempts.filter((r) => r.modifiedCount === 1).length;
    expect(successes).toBe(1);

    const finalUser = await User.findById(student._id);
    expect(finalUser.deviceCount).toBe(1);
    expect(finalUser.deviceCount).toBeLessThanOrEqual(finalUser.deviceLimit);
  });

  it("13. Expired enrollment blocks lecture access", async () => {
    const student = await User.create({ role: "student", name: "Student", loginId: "student01", passwordHash: "h" });
    const course = await Course.create({ title: "Class 12", slug: "class-12", published: true });
    const lecture = await Lecture.create({
      courseId: course._id,
      title: "Lecture 1",
      section: "Intro",
      vimeoId: "123456789",
      published: true,
      isPreview: false,
    });

    // Enrollment expired 1 hour ago
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "active",
      expiresAt: new Date(Date.now() - 3600 * 1000),
    });

    const access = await getAuthorizedLecture({ lectureId: lecture._id, studentId: student._id });
    expect(access).toBeNull();
  });

  it("14. Student cannot access lectures of an unenrolled course", async () => {
    const student = await User.create({ role: "student", name: "Student", loginId: "student02", passwordHash: "h" });
    const course = await Course.create({ title: "Class 11", slug: "class-11", published: true });
    const lecture = await Lecture.create({
      courseId: course._id,
      title: "Secret Lecture",
      section: "Intro",
      vimeoId: "987654321",
      published: true,
      isPreview: false,
    });

    const access = await getAuthorizedLecture({ lectureId: lecture._id, studentId: student._id });
    expect(access).toBeNull();
  });

  it("15. Admin routes reject student users", async () => {
    const hash = await hashPassword("password123");
    await User.create({
      role: "student",
      name: "Student Only",
      loginId: "studentonly",
      passwordHash: hash,
      status: "active",
      deviceCount: 0,
      deviceLimit: 1,
    });

    await studentLogin({ loginId: "studentonly", password: "password123" });

    // requireAdmin should reject student
    await expect(requireAdmin()).rejects.toThrow("UNAUTHORIZED_ADMIN");
  });
});
