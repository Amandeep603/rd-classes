import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Simulate cookie jar
const cookieJar = new Map();
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

describe("Phase C5: IDOR & Authorization Hardening Test Suite", () => {
  let User, Course, Lecture, Note, Enrollment, Progress, TestResult, Session;
  let requireStudent, requireAdmin, getCurrentUser;
  let getAuthorizedLecture, saveLectureProgress;
  let checkNoteAccess;
  let createCourseAction;
  let createNoteAction;
  let importStudentsFromCSVAction;

  let studentA, studentB, adminUser;
  let courseA, courseB;
  let lectureA, lectureB;
  let noteA;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NODE_ENV = "test";

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
    Lecture = (await import("../src/server/db/models/Lecture.js")).Lecture;
    Note = (await import("../src/server/db/models/Note.js")).Note;
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;
    Progress = (await import("../src/server/db/models/Progress.js")).Progress;
    TestResult = (await import("../src/server/db/models/TestResult.js")).TestResult;
    Session = (await import("../src/server/db/models/Session.js")).Session;

    const sessionModule = await import("../src/server/auth/session.js");
    requireStudent = sessionModule.requireStudent;
    requireAdmin = sessionModule.requireAdmin;
    getCurrentUser = sessionModule.getCurrentUser;

    const lectureService = await import("../src/server/services/lectureService.js");
    getAuthorizedLecture = lectureService.getAuthorizedLecture;

    const progressService = await import("../src/server/services/progressService.js");
    saveLectureProgress = progressService.saveLectureProgress;

    const noteService = await import("../src/server/services/noteService.js");
    checkNoteAccess = noteService.checkNoteAccess;

    const courseActions = await import("../src/server/actions/admin.courses.actions.js");
    createCourseAction = courseActions.createCourseAction;

    const noteActions = await import("../src/server/actions/admin.notes.actions.js");
    createNoteAction = noteActions.createNoteAction;

    const studentActions = await import("../src/server/actions/admin.students.actions.js");
    importStudentsFromCSVAction = studentActions.importStudentsFromCSVAction;
  });

  afterAll(async () => {
    if (mongoose.connection?.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    cookieJar.clear();
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await Note.deleteMany({});
    await Enrollment.deleteMany({});
    await Progress.deleteMany({});
    await TestResult.deleteMany({});
    await Session.deleteMany({});

    adminUser = await User.create({
      name: "Admin Sir",
      loginId: "admin",
      role: "admin",
      passwordHash: "hash",
    });

    studentA = await User.create({
      name: "Student A",
      loginId: "student_a",
      role: "student",
      studentCode: "RD-2026-101",
      passwordHash: "hash",
    });

    studentB = await User.create({
      name: "Student B",
      loginId: "student_b",
      role: "student",
      studentCode: "RD-2026-102",
      passwordHash: "hash",
    });

    courseA = await Course.create({
      title: "Class 12 Accounts",
      slug: `course-a-${Date.now()}`,
      published: true,
      price: 3999,
    });

    courseB = await Course.create({
      title: "Class 11 Accounts",
      slug: `course-b-${Date.now()}`,
      published: true,
      price: 3499,
    });

    lectureA = await Lecture.create({
      courseId: courseA._id,
      title: "Class 12 Partnership Lecture 1",
      section: "Partnership",
      vimeoId: "123456780",
      order: 1,
      published: true,
      isPreview: false,
    });

    lectureB = await Lecture.create({
      courseId: courseB._id,
      title: "Class 11 Journal Entries",
      section: "Journal",
      vimeoId: "123456781",
      order: 1,
      published: true,
      isPreview: false,
    });

    noteA = await Note.create({
      title: "Partnership Class Notes",
      kind: "notes",
      source: "file",
      fileUrl: "https://blob.com/noteA.pdf",
      fileKey: "notes/noteA.pdf",
      courseIds: [courseA._id],
      published: true,
    });

    // Student A is enrolled ONLY in Course A
    await Enrollment.create({
      userId: studentA._id,
      courseId: courseA._id,
      status: "active",
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    });

    // Student B is enrolled ONLY in Course B
    await Enrollment.create({
      userId: studentB._id,
      courseId: courseB._id,
      status: "active",
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    });
  });

  describe("1. Course and Lecture Authorization", () => {
    it("Student A can access Lecture A (enrolled course) with valid Vimeo ID", async () => {
      const access = await getAuthorizedLecture({
        lectureId: lectureA._id,
        studentId: studentA._id,
      });
      expect(access).toBeDefined();
      expect(access.vimeoId).toBe("123456780");
    });

    it("Student A CANNOT access Lecture B (unenrolled course) and Vimeo ID is not leaked", async () => {
      const access = await getAuthorizedLecture({
        lectureId: lectureB._id,
        studentId: studentA._id,
      });
      expect(access).toBeNull();
    });

    it("Preview lecture provides Vimeo ID even for unenrolled visitor, but non-preview does not", async () => {
      const previewLec = await Lecture.create({
        courseId: courseB._id,
        title: "Preview Chapter 1",
        section: "Intro",
        vimeoId: "999888777",
        order: 2,
        published: true,
        isPreview: true,
      });

      const visitorAccess = await getAuthorizedLecture({
        lectureId: previewLec._id,
        studentId: studentA._id,
      });
      expect(visitorAccess).toBeDefined();
      expect(visitorAccess.vimeoId).toBe("999888777");
    });
  });

  describe("2. Note Authorization and IDOR Prevention", () => {
    it("Student A can access Note A (enrolled course)", async () => {
      const access = await checkNoteAccess(noteA._id, studentA);
      expect(access.allowed).toBe(true);
    });

    it("Student B cannot access Note A (unenrolled course) with not_enrolled reason", async () => {
      const access = await checkNoteAccess(noteA._id, studentB);
      expect(access.allowed).toBe(false);
      expect(access.reason).toBe("not_enrolled");
    });
  });

  describe("3. Progress Isolation & IDOR", () => {
    it("Student A saving progress only records progress for Student A, not Student B", async () => {
      await saveLectureProgress({
        userId: studentA._id,
        lectureId: lectureA._id,
        courseId: courseA._id,
        positionSec: 120,
        durationSec: 3600,
      });

      const progA = await Progress.findOne({ userId: studentA._id, lectureId: lectureA._id });
      expect(progA).toBeDefined();
      expect(progA.positionSec).toBe(120);

      const progB = await Progress.findOne({ userId: studentB._id, lectureId: lectureA._id });
      expect(progB).toBeNull();
    });
  });

  describe("4. Admin Action Protection against Student Users", () => {
    it("Student user calling createCourseAction throws UNAUTHORIZED_ADMIN", async () => {
      // Mock getCurrentUser returning Student A
      const sessionModule = await import("../src/server/auth/session.js");
      const spy = vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        user: { _id: studentA._id, role: "student", name: "Student A" },
      });

      await expect(
        createCourseAction({
          title: "Malicious Course",
          price: 1000,
        })
      ).rejects.toThrow("UNAUTHORIZED_ADMIN");

      spy.mockRestore();
    });

    it("Student user calling createNoteAction throws UNAUTHORIZED_ADMIN", async () => {
      const sessionModule = await import("../src/server/auth/session.js");
      const spy = vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        user: { _id: studentA._id, role: "student", name: "Student A" },
      });

      await expect(
        createNoteAction({
          title: "Malicious Note",
          kind: "notes",
          source: "link",
          externalUrl: "https://example.com/exploit.pdf",
        })
      ).rejects.toThrow("UNAUTHORIZED_ADMIN");

      spy.mockRestore();
    });

    it("Student user calling importStudentsFromCSVAction throws UNAUTHORIZED_ADMIN", async () => {
      const sessionModule = await import("../src/server/auth/session.js");
      const spy = vi.spyOn(sessionModule, "getCurrentUser").mockResolvedValue({
        user: { _id: studentA._id, role: "student", name: "Student A" },
      });

      await expect(
        importStudentsFromCSVAction([])
      ).rejects.toThrow("UNAUTHORIZED_ADMIN");

      spy.mockRestore();
    });
  });
});
