import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Mock next/headers, next/cache, next/server
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
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
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  unstable_cache: (fn) => fn,
}));

let mongod = null;

describe("Phase C2: Student Email System & Verification Test Suite", () => {
  let EmailLog, User;
  let renderCredentialsTemplate, renderDeviceApprovedTemplate;
  let sendWithConsole, sendEmail, checkDailyQuota, isEmailConfigured, getStartOfTodayIST;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NODE_ENV = "test";
    process.env.EMAIL_DRIVER = "console";
    process.env.EMAIL_DAILY_LIMIT = "400";

    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 120000,
      },
    });
    process.env.MONGODB_URI = mongod.getUri();

    const connectDB = (await import("../src/server/db/connect.js")).default;
    await connectDB();

    EmailLog = (await import("../src/server/db/models/EmailLog.js")).EmailLog;
    User = (await import("../src/server/db/models/User.js")).User;

    const credMod = await import("../src/server/email/templates/credentials.js");
    renderCredentialsTemplate = credMod.renderCredentialsTemplate;

    const devMod = await import("../src/server/email/templates/deviceApproved.js");
    renderDeviceApprovedTemplate = devMod.renderDeviceApprovedTemplate;

    const consoleMod = await import("../src/server/email/drivers/consoleDriver.js");
    sendWithConsole = consoleMod.sendWithConsole;

    const emailServiceMod = await import("../src/server/email/emailService.js");
    sendEmail = emailServiceMod.sendEmail;

    const emailConfigMod = await import("../src/server/email/emailConfig.js");
    checkDailyQuota = emailConfigMod.checkDailyQuota;
    isEmailConfigured = emailConfigMod.isEmailConfigured;
    getStartOfTodayIST = emailConfigMod.getStartOfTodayIST;
  }, 60000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await EmailLog.deleteMany({});
    await User.deleteMany({});
    process.env.NODE_ENV = "test";
    process.env.EMAIL_DRIVER = "console";
    process.env.EMAIL_DAILY_LIMIT = "400";
  });

  it("1. Credentials template rendering contains required security and login details", () => {
    const rawSecretPassword = "SuperSecretPlainTextPassword123!";
    const result = renderCredentialsTemplate({
      studentName: "Aman Deep",
      loginId: "rd1001",
      password: rawSecretPassword,
      loginUrl: "https://rd-classes.in/student/login",
      courses: [{ title: "Class 12 Accountancy (Full Year)", validUntil: new Date("2027-03-31") }],
      whatsappPhone: "918368545620",
    });

    expect(result.subject).toBe("Your RD Classes login details");
    expect(result.text).toContain("rd1001");
    expect(result.text).toContain(rawSecretPassword);
    expect(result.text).toContain("Class 12 Accountancy (Full Year)");
    expect(result.text).toContain("one approved device");
    expect(result.text).toContain("Do not share these details with anyone.");

    expect(result.html).toContain("rd1001");
    expect(result.html).toContain(rawSecretPassword);
    expect(result.html).toContain("#FFC21A");
    expect(result.html).toContain("#0B2545");
  });

  it("2. Plaintext password is NEVER stored in EmailLog or database", async () => {
    const secretPassword = "ConfidentialPassword987!";
    const template = renderCredentialsTemplate({
      studentName: "Test Student",
      loginId: "rd1002",
      password: secretPassword,
      loginUrl: "https://rd-classes.in/student/login",
    });

    const sendRes = await sendEmail({
      to: "student@example.com",
      subject: template.subject,
      html: template.html,
      text: template.text,
      kind: "credentials",
    });

    expect(sendRes.success).toBe(true);

    // Verify EmailLog document in DB
    const logDoc = await EmailLog.findById(sendRes.logId).lean();
    expect(logDoc).toBeDefined();
    expect(logDoc.status).toBe("sent");
    expect(logDoc.toEmail).toBe("student@example.com");

    // Scan every field of EmailLog to confirm password was NOT saved
    const serializedLog = JSON.stringify(logDoc);
    expect(serializedLog.includes(secretPassword)).toBe(false);
  });

  it("3. Console driver refuses to execute in production mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await expect(
      sendWithConsole({
        to: "prod@example.com",
        subject: "Test",
        html: "<p>test</p>",
        text: "test",
      })
    ).rejects.toThrow(/refused in production mode/i);

    process.env.NODE_ENV = originalEnv;
  });

  it("4. Daily limit enforces cap based on today's Asia/Kolkata sent count", async () => {
    process.env.EMAIL_DAILY_LIMIT = "2";

    // Insert 2 sent logs for today
    const today = new Date();
    await EmailLog.create([
      { kind: "test", toEmail: "a@ex.com", status: "sent", sentAt: today },
      { kind: "test", toEmail: "b@ex.com", status: "sent", sentAt: today },
    ]);

    const quota = await checkDailyQuota();
    expect(quota.canSend).toBe(false);
    expect(quota.remaining).toBe(0);

    // Sending another email should throw daily limit error
    await expect(
      sendEmail({
        to: "c@ex.com",
        subject: "Test Limit",
        html: "<p>test</p>",
        text: "test",
        kind: "test",
      })
    ).rejects.toThrow(/daily email limit reached/i);
  });

  it("5. Failed email sends record status: failed with sanitized error", async () => {
    // Configure SMTP to an unreachable port to trigger delivery failure
    process.env.EMAIL_DRIVER = "smtp";
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "65530";
    process.env.EMAIL_FROM_ADDRESS = "no-reply@rd-classes.in";

    const res = await sendEmail({
      to: "fail@example.com",
      subject: "Test Fail",
      html: "<p>test</p>",
      text: "test",
      kind: "test",
    });

    expect(res.success).toBe(false);

    const logDoc = await EmailLog.findById(res.logId).lean();
    expect(logDoc.status).toBe("failed");
    expect(logDoc.error).toBeDefined();
  });

  it("6. Rejects when email is not configured in production without credentials", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.EMAIL_DRIVER = "console"; // Console cannot be used in production

    expect(isEmailConfigured()).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });
});
