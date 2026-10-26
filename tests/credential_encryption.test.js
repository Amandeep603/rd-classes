import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Cookie and header mock for session
const cookieJar = new Map();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name) => {
      const val = cookieJar.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name, value) => {
      cookieJar.set(name, value);
    },
    delete: (name) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => ({
    get: () => null,
  }),
}));

vi.mock("next/server", () => ({
  connection: async () => {},
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

let mongod = null;

describe("Phase D2: Credential Encryption & Admin Reveal Model Test Suite", () => {
  let User, AuditLog, Session;
  let encryptPassword, decryptPassword, isEncryptionKeyConfigured;
  let hashPassword, comparePassword;
  let revealStudentPasswordAction, sendStudentCredentialsAction;
  let studentLogin, adminLogin;
  let mockAdmin, mockStudent;

  const validKeyBase64 = crypto.randomBytes(32).toString("base64");
  const originalEnvKey = process.env.CREDENTIAL_ENC_KEY;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.NODE_ENV = "test";
    process.env.CREDENTIAL_ENC_KEY = validKeyBase64;

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "rdclasses_d2_test" });

    const userMod = await import("../src/server/db/models/User.js");
    User = userMod.User;
    const auditMod = await import("../src/server/db/models/AuditLog.js");
    AuditLog = auditMod.AuditLog;
    const sessionMod = await import("../src/server/db/models/Session.js");
    Session = sessionMod.Session;

    const encMod = await import("../src/server/auth/credentialEncryption.js");
    encryptPassword = encMod.encryptPassword;
    decryptPassword = encMod.decryptPassword;
    isEncryptionKeyConfigured = encMod.isEncryptionKeyConfigured;

    const pwdMod = await import("../src/server/auth/password.js");
    hashPassword = pwdMod.hashPassword;
    comparePassword = pwdMod.comparePassword;

    const authActions = await import("../src/server/actions/admin.students.actions.js");
    revealStudentPasswordAction = authActions.revealStudentPasswordAction;
    sendStudentCredentialsAction = authActions.sendStudentCredentialsAction;

    const authService = await import("../src/server/auth/authService.js");
    studentLogin = authService.studentLogin;
    adminLogin = authService.adminLogin;
  });

  afterAll(async () => {
    process.env.CREDENTIAL_ENC_KEY = originalEnvKey;
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    process.env.CREDENTIAL_ENC_KEY = validKeyBase64;
    cookieJar.clear();
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await Session.deleteMany({});

    // Create Admin User
    const adminHash = await hashPassword("AdminSecret123!");
    mockAdmin = await User.create({
      role: "admin",
      loginId: "admin_d2",
      name: "Admin Ronak",
      passwordHash: adminHash,
      status: "active",
    });

    // Create Student User with encrypted copy
    const rawStudentPassword = "StudentPass2026!";
    const studentHash = await hashPassword(rawStudentPassword);
    const studentEnc = encryptPassword(rawStudentPassword);

    mockStudent = await User.create({
      role: "student",
      loginId: "rd9999",
      name: "Student Aman",
      passwordHash: studentHash,
      passwordEnc: studentEnc,
      status: "active",
    });
  });

  it("1. AES-256-GCM encrypt/decrypt round trip succeeds and handles key versioning", () => {
    const secret = "SuperSecretPassword#2026";
    const encrypted = encryptPassword(secret, 1);
    expect(encrypted).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.keyVersion).toBe(1);

    const decrypted = decryptPassword(encrypted);
    expect(decrypted).toBe(secret);

    // Key versioning: key version 2 uses CREDENTIAL_ENC_KEY_V2
    const keyV2 = crypto.randomBytes(32).toString("base64");
    process.env.CREDENTIAL_ENC_KEY_V2 = keyV2;

    const encV2 = encryptPassword("Version2Secret", 2);
    expect(encV2.keyVersion).toBe(2);
    expect(decryptPassword(encV2)).toBe("Version2Secret");
    delete process.env.CREDENTIAL_ENC_KEY_V2;
  });

  it("2. Missing encryption key hides the feature and fails gracefully", () => {
    delete process.env.CREDENTIAL_ENC_KEY;
    expect(isEncryptionKeyConfigured()).toBe(false);

    const enc = encryptPassword("AnyPassword");
    expect(enc).toBeNull();

    expect(() =>
      decryptPassword({
        iv: "invalid",
        tag: "invalid",
        ciphertext: "invalid",
        keyVersion: 1,
      })
    ).toThrow();
  });

  it("3. Reveal requires admin re-authentication and fails with incorrect admin password", async () => {
    // Set admin session cookie
    const token = "admin_session_token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await Session.create({
      userId: mockAdmin._id,
      tokenHash,
      deviceId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 3600000),
    });
    cookieJar.set("rd_session", token);

    // Attempt reveal with wrong password
    const wrongRes = await revealStudentPasswordAction({
      studentId: mockStudent._id.toString(),
      adminPassword: "WrongPassword999!",
    });
    expect(wrongRes.success).toBe(false);
    expect(wrongRes.error).toBe("Incorrect admin password.");

    // Attempt reveal with correct password
    const correctRes = await revealStudentPasswordAction({
      studentId: mockStudent._id.toString(),
      adminPassword: "AdminSecret123!",
    });
    expect(correctRes.success).toBe(true);
    expect(correctRes.password).toBe("StudentPass2026!");
  });

  it("4. Reveal writes an AuditLog entry without storing the plaintext password", async () => {
    const token = "admin_session_token_audit";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await Session.create({
      userId: mockAdmin._id,
      tokenHash,
      deviceId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 3600000),
    });
    cookieJar.set("rd_session", token);

    await revealStudentPasswordAction({
      studentId: mockStudent._id.toString(),
      adminPassword: "AdminSecret123!",
    });

    const logs = await AuditLog.find({ action: "student.password_revealed" }).lean();
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[logs.length - 1];
    expect(lastLog.actorId.toString()).toBe(mockAdmin._id.toString());
    expect(lastLog.targetId).toBe(mockStudent._id.toString());
    expect(JSON.stringify(lastLog)).not.toContain("StudentPass2026!");
  });

  it("5. Students cannot call reveal (requireAdmin throws / rejects)", async () => {
    // Set student session cookie
    const token = "student_session_token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await Session.create({
      userId: mockStudent._id,
      tokenHash,
      deviceId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 3600000),
    });
    cookieJar.set("rd_session", token);

    await expect(
      revealStudentPasswordAction({
        studentId: mockStudent._id.toString(),
        adminPassword: "AnyPassword",
      })
    ).rejects.toThrow();
  });

  it("6. Login verifies ONLY bcrypt hash and is completely unaffected by passwordEnc", async () => {
    // Even if passwordEnc is null, login succeeds via bcrypt compare
    mockStudent.passwordEnc = null;
    await mockStudent.save();

    const deviceId = new mongoose.Types.ObjectId().toString();
    const loginRes = await studentLogin({
      loginId: "rd9999",
      password: "StudentPass2026!",
      deviceId,
      deviceLabel: "Chrome on macOS",
    });

    expect(loginRes.success).toBe(true);
    expect(loginRes.redirectTo).toBe("/student");
  });

  it("7. Rate limiter caps reveal to at most 5 per minute", async () => {
    const token = "admin_session_token_rate";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await Session.create({
      userId: mockAdmin._id,
      tokenHash,
      deviceId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 3600000),
    });
    cookieJar.set("rd_session", token);

    for (let i = 0; i < 5; i++) {
      const res = await revealStudentPasswordAction({
        studentId: mockStudent._id.toString(),
        adminPassword: "AdminSecret123!",
      });
      expect(res.success).toBe(true);
    }

    // 6th attempt within the same minute should be rejected
    const sixthRes = await revealStudentPasswordAction({
      studentId: mockStudent._id.toString(),
      adminPassword: "AdminSecret123!",
    });
    expect(sixthRes.success).toBe(false);
    expect(sixthRes.error).toContain("Rate limit exceeded");
  });
});
