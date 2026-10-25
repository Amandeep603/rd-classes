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

// Mock requireAdmin in session.js
const mockAdminId = new mongoose.Types.ObjectId();
vi.mock("../src/server/auth/session.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requireAdmin: vi.fn(async () => ({
      user: {
        _id: mockAdminId,
        role: "admin",
        name: "Admin Sir",
        loginId: "admin",
      },
    })),
    getCurrentUser: vi.fn(async () => ({
      user: {
        _id: mockAdminId,
        role: "admin",
        name: "Admin Sir",
        loginId: "admin",
      },
    })),
  };
});

let mongod = null;

describe("Phase C3: Bulk Email and CSV Import Test Suite", () => {
  let User, Course, Enrollment, EmailLog, Session;
  let importStudentsFromCSV, getStudentsList;
  let sendBulkImportCredentialsChunkAction, bulkResetAndEmailCredentialsChunkAction;
  let testCourse;

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

    User = (await import("../src/server/db/models/User.js")).User;
    Course = (await import("../src/server/db/models/Course.js")).Course;
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;
    EmailLog = (await import("../src/server/db/models/EmailLog.js")).EmailLog;
    Session = (await import("../src/server/db/models/Session.js")).Session;

    const studentService = await import("../src/server/services/studentService.js");
    importStudentsFromCSV = studentService.importStudentsFromCSV;
    getStudentsList = studentService.getStudentsList;

    const studentActions = await import("../src/server/actions/admin.students.actions.js");
    sendBulkImportCredentialsChunkAction = studentActions.sendBulkImportCredentialsChunkAction;
    bulkResetAndEmailCredentialsChunkAction = studentActions.bulkResetAndEmailCredentialsChunkAction;

    // Create Test Course
    testCourse = await Course.create({
      title: "Class 12 Physics Complete",
      slug: "physics-12-complete",
      published: true,
      price: 4999,
    });
  });

  afterAll(async () => {
    if (mongoose.connection?.readyState) {
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ role: "student" });
    await Enrollment.deleteMany({});
    await EmailLog.deleteMany({});
    await Session.deleteMany({});
  });

  it("1. importStudentsFromCSV parses rows, validates input, assigns courses, and returns plaintext passwords ONCE without persisting them", async () => {
    const rows = [
      {
        name: "Aman Verma",
        email: "aman@example.com",
        phone: "9876543210",
        class: "12",
        courses: "physics-12-complete",
      },
      {
        name: "Priya Singh",
        email: "priya@example.com",
        phone: "9876543211",
        class: "11",
      },
      {
        name: "Invalid Row Missing Name",
        email: "bad-email",
      },
      {
        name: "Bad Date Student",
        email: "valid@example.com",
        validUntil: "2020-01-01", // in past
      },
    ];

    const result = await importStudentsFromCSV({ rows, adminId: mockAdminId });

    expect(result.success).toBe(true);
    expect(result.created).toHaveLength(2);
    expect(result.skipped).toHaveLength(2);

    // Verify first student
    const created1 = result.created[0];
    expect(created1.name).toBe("Aman Verma");
    expect(created1.email).toBe("aman@example.com");
    expect(created1.loginId).toMatch(/^rd/);
    expect(created1.rawPassword).toBeDefined();
    expect(created1.rawPassword.length).toBeGreaterThanOrEqual(10);
    expect(created1.courses).toContain("Class 12 Physics Complete");

    // Verify database persistence: passwordHash exists, rawPassword DOES NOT
    const dbUser1 = await User.findById(created1.studentId).lean();
    expect(dbUser1).toBeDefined();
    expect(dbUser1.passwordHash).toBeDefined();
    expect(dbUser1.rawPassword).toBeUndefined();
    expect(dbUser1.password).toBeUndefined();

    // Verify enrollment
    const enrollments = await Enrollment.find({ userId: created1.studentId });
    expect(enrollments).toHaveLength(1);
    expect(enrollments[0].courseId.toString()).toBe(testCourse._id.toString());
  });

  it("2. sendBulkImportCredentialsChunkAction sends credentials email via console driver and logs EmailLog with batchId", async () => {
    // Import 2 students
    const importRes = await importStudentsFromCSV({
      rows: [
        { name: "Student One", email: "student1@example.com" },
        { name: "Student Two No Email" }, // no email
      ],
      adminId: mockAdminId,
    });

    const items = importRes.created.map((c) => ({
      studentId: c.studentId,
      name: c.name,
      email: c.email,
      loginId: c.loginId,
      password: c.rawPassword,
    }));

    const batchId = "test_batch_123";
    const chunkRes = await sendBulkImportCredentialsChunkAction({
      items,
      batchId,
    });

    expect(chunkRes.success).toBe(true);
    expect(chunkRes.results).toHaveLength(2);

    const sentResult = chunkRes.results.find((r) => r.email === "student1@example.com");
    const skippedResult = chunkRes.results.find((r) => !r.email);

    expect(sentResult.status).toBe("sent");
    expect(skippedResult.status).toBe("skipped");

    // Verify EmailLog created with batchId
    const log = await EmailLog.findOne({ studentId: sentResult.studentId }).lean();
    expect(log).toBeDefined();
    expect(log.status).toBe("sent");
    expect(log.batchId).toBe(batchId);
    expect(log.toEmail).toBe("student1@example.com");
  });

  it("3. bulkResetAndEmailCredentialsChunkAction resets passwords, revokes sessions, and emails new credentials", async () => {
    // Create student
    const importRes = await importStudentsFromCSV({
      rows: [{ name: "Reset Test", email: "resetme@example.com" }],
      adminId: mockAdminId,
    });
    const student = importRes.created[0];
    const originalPassword = student.rawPassword;

    // Create session to verify revocation
    await Session.create({
      userId: student.studentId,
      tokenHash: "dummy_session_token_hash",
      deviceId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 86400000),
    });

    const batchId = "reset_batch_456";
    const resetRes = await bulkResetAndEmailCredentialsChunkAction({
      studentIds: [student.studentId],
      revokeSessions: true,
      batchId,
    });

    expect(resetRes.success).toBe(true);
    expect(resetRes.results).toHaveLength(1);
    expect(resetRes.results[0].status).toBe("sent");
    expect(resetRes.results[0].newPassword).toBeDefined();
    expect(resetRes.results[0].newPassword).not.toBe(originalPassword);

    // Verify session revoked
    const sessions = await Session.find({ userId: student.studentId });
    expect(sessions).toHaveLength(0);

    // Verify EmailLog created
    const log = await EmailLog.findOne({ studentId: student.studentId, batchId }).lean();
    expect(log).toBeDefined();
    expect(log.status).toBe("sent");
  });

  it("4. getStudentsList accurately enriches students with emailStatus and filters by email status", async () => {
    // Create 3 students:
    // S1: Has email, credentials sent
    // S2: Has email, not emailed
    // S3: No email
    const importRes = await importStudentsFromCSV({
      rows: [
        { name: "Student Sent", email: "sent@example.com" },
        { name: "Student Not Emailed", email: "notemailed@example.com" },
        { name: "Student No Email" },
      ],
      adminId: mockAdminId,
    });

    const s1 = importRes.created.find((c) => c.email === "sent@example.com");

    // Send email for s1
    await EmailLog.create({
      kind: "credentials",
      toEmail: "sent@example.com",
      studentId: s1.studentId,
      status: "sent",
      sentAt: new Date(),
    });

    // 1. Check all list enrichment
    const listAll = await getStudentsList();
    expect(listAll.students).toHaveLength(3);

    const s1Enriched = listAll.students.find((s) => s.email === "sent@example.com");
    const s2Enriched = listAll.students.find((s) => s.email === "notemailed@example.com");
    const s3Enriched = listAll.students.find((s) => !s.email);

    expect(s1Enriched.emailStatus).toBe("sent");
    expect(s2Enriched.emailStatus).toBe("not-emailed");
    expect(s3Enriched.emailStatus).toBe("no-email");

    // 2. Filter emailed
    const listEmailed = await getStudentsList({ emailFilter: "emailed" });
    expect(listEmailed.students).toHaveLength(1);
    expect(listEmailed.students[0].name).toBe("Student Sent");

    // 3. Filter not-emailed
    const listNotEmailed = await getStudentsList({ emailFilter: "not-emailed" });
    expect(listNotEmailed.students).toHaveLength(1);
    expect(listNotEmailed.students[0].name).toBe("Student Not Emailed");

    // 4. Filter no-email
    const listNoEmail = await getStudentsList({ emailFilter: "no-email" });
    expect(listNoEmail.students).toHaveLength(1);
    expect(listNoEmail.students[0].name).toBe("Student No Email");
  });
});
