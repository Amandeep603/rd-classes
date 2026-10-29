import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import CourseLecturesPage from "../src/components/portal/student/CourseLecturesPageContent.jsx";

// In-memory cookie jar mock
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
  NextResponse: {
    json: (body, init) => ({
      status: init?.status || 200,
      json: async () => body,
      body,
    }),
    redirect: (url) => ({
      status: 307,
      headers: new Map([["location", url.toString()]]),
    }),
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    const err = new Error("NEXT_NOT_FOUND");
    err.digest = "NEXT_NOT_FOUND";
    throw err;
  },
  forbidden: () => {
    const err = new Error("NEXT_FORBIDDEN");
    err.digest = "NEXT_FORBIDDEN";
    err.status = 403;
    throw err;
  },
  redirect: (url) => {
    const err = new Error(`NEXT_REDIRECT: ${url}`);
    err.digest = `NEXT_REDIRECT;replace;${url}`;
    err.location = url;
    throw err;
  },
  usePathname: () => "/student",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let mongod = null;

describe("Step 5 of 5: Student Panel & Security Test Suite", () => {
  let User, Course, Lecture, Note, Enrollment, Progress, Test, TestResult, Session, Device, Setting, Announcement;
  let getCurrentUser, getStudentAuthStatus;
  let getStudentDashboardData;
  let saveLectureProgress;
  let watchApiRoute;
  let createSession;

  let studentA, studentB;
  let courseA, courseB;
  let lectureA1, lectureA2, lectureB1, lectureDraftA;
  let noteA, noteB;
  let testA, testB;
  let deviceA, deviceB;
  let tokenA, tokenB;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_step5_test";
    process.env.NODE_ENV = "test";

    mongod = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
    process.env.MONGODB_URI = mongod.getUri();

    const connectDB = (await import("../src/server/db/connect.js")).default;
    await connectDB();

    const models = await import("../lib/models");
    User = models.User;
    Course = models.Course;
    Lecture = models.Lecture;
    Note = models.Note;
    Enrollment = models.Enrollment;
    Progress = models.Progress;
    Test = models.Test;
    Session = models.Session;
    Device = models.Device;
    Setting = models.Setting;
    Announcement = models.Announcement;
    TestResult = (await import("../src/server/db/models/TestResult.js")).TestResult;

    const sessionModule = await import("../src/server/auth/session.js");
    getCurrentUser = sessionModule.getCurrentUser;
    getStudentAuthStatus = sessionModule.getStudentAuthStatus;

    const dashboardModule = await import("../src/server/services/studentDashboardService.js");
    getStudentDashboardData = dashboardModule.getStudentDashboardData;

    const progressActionModule = await import("../src/server/actions/student.progress.actions.js");
    saveLectureProgress = progressActionModule.saveProgressAction;

    watchApiRoute = (await import("../src/app/api/student/watch/[lectureId]/route.js")).GET;

    // Helper to create sessions
    const { hashToken } = await import("../src/server/auth/tokens.js");
    createSession = async (user, deviceId) => {
      const rawToken = `token_${Date.now()}_${Math.random()}`;
      const tokenHash = hashToken(rawToken);
      await Session.create({
        userId: user._id,
        deviceId,
        tokenHash,
        role: "student",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        lastSeenAt: new Date(),
      });
      return rawToken;
    };
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
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
    await Test.deleteMany({});
    await TestResult.deleteMany({});
    await Session.deleteMany({});
    await Device.deleteMany({});
    await Setting.deleteMany({});
    await Announcement.deleteMany({});

    // 1. Create Setting with WhatsApp number
    await Setting.create({
      instituteName: "RD Classes",
      whatsappNumber: "918368545620",
      workspaceName: "RD Classes Head Office",
    });

    // 2. Create Two Students: Student A and Student B
    studentA = await User.create({
      name: "Aman Sharma",
      email: "aman@example.com",
      loginId: "RD-STU-101",
      role: "student",
      studentCode: "RD2026-A",
      className: "12",
      passwordHash: "hash123",
      status: "active",
      deviceLimit: 1,
    });

    studentB = await User.create({
      name: "Bhavna Patel",
      email: "bhavna@example.com",
      loginId: "RD-STU-102",
      role: "student",
      studentCode: "RD2026-B",
      className: "11",
      passwordHash: "hash123",
      status: "active",
      deviceLimit: 1,
    });

    // 3. Create Approved Devices
    deviceA = await Device.create({
      userId: studentA._id,
      studentId: studentA._id,
      deviceId: "dev_fingerprint_student_a",
      deviceName: "Aman Laptop (Windows)",
      status: "approved",
      lastUsedAt: new Date(),
    });

    deviceB = await Device.create({
      userId: studentB._id,
      studentId: studentB._id,
      deviceId: "dev_fingerprint_student_b",
      deviceName: "Bhavna iPad",
      status: "approved",
      lastUsedAt: new Date(),
    });

    // 4. Create Two Different Courses
    courseA = await Course.create({
      title: "Class 12 Comprehensive Accountancy",
      slug: "class-12-accounts",
      classLabel: "Class 12",
      tone: "yellow",
      published: true,
      price: 4999,
    });

    courseB = await Course.create({
      title: "Class 11 Foundation Accountancy",
      slug: "class-11-accounts",
      classLabel: "Class 11",
      tone: "sky",
      published: true,
      price: 3999,
    });

    // 5. Enroll Student A ONLY in Course A, Student B ONLY in Course B
    await Enrollment.create({
      userId: studentA._id,
      courseId: courseA._id,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    await Enrollment.create({
      userId: studentB._id,
      courseId: courseB._id,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    // 6. Create Published & Draft Lectures
    lectureA1 = await Lecture.create({
      courseId: courseA._id,
      book: "Part A: Accounting for Partnership Firms",
      chapter: "Chapter 1: Fundamentals of Partnership",
      title: "Partnership Deeds & Profit and Loss Appropriation",
      durationSec: 3600,
      vimeoId: "111222333",
      order: 1,
      published: true,
    });

    lectureA2 = await Lecture.create({
      courseId: courseA._id,
      book: "Part A: Accounting for Partnership Firms",
      chapter: "Chapter 1: Fundamentals of Partnership",
      title: "Interest on Capital & Drawings Calculation",
      durationSec: 4200,
      vimeoId: "111222444",
      order: 2,
      published: true,
    });

    lectureDraftA = await Lecture.create({
      courseId: courseA._id,
      book: "Part A: Accounting for Partnership Firms",
      chapter: "Chapter 1: Fundamentals of Partnership",
      title: "Unpublished Future Lecture",
      durationSec: 3000,
      vimeoId: "111222555",
      order: 3,
      published: false, // DRAFT
    });

    lectureB1 = await Lecture.create({
      courseId: courseB._id,
      book: "Part 1: Introduction to Accounting",
      chapter: "Chapter 1: Accounting Principles",
      title: "Dual Aspect and Matching Concept Explained",
      durationSec: 2800,
      vimeoId: "222333444",
      order: 1,
      published: true,
    });

    // 7. Create Notes
    noteA = await Note.create({
      title: "Partnership Formula Sheet 2026",
      book: "Part A: Accounting for Partnership Firms",
      courseId: courseA._id,
      courseIds: [courseA._id],
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/notes/part_a.pdf",
      sizeBytes: 1024 * 1024 * 2.5,
      published: true,
    });

    noteB = await Note.create({
      title: "Class 11 Journal Rules Summary",
      book: "Part 1: Introduction to Accounting",
      courseId: courseB._id,
      courseIds: [courseB._id],
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/notes/journal.pdf",
      sizeBytes: 1024 * 1024 * 1.8,
      published: true,
    });

    // 8. Create Scheduled Mock Tests
    testA = await Test.create({
      title: "Sunday Mock: Partnership Fundamentals",
      courseId: courseA._id,
      className: "12",
      startsAt: new Date(Date.now() + 2 * 86400000),
      durationMin: 180,
      syllabus: "Partnership Deed, P&L Appropriation, Capital Accounts",
      venue: "RD Classes, Main Hall",
      published: true,
    });

    testB = await Test.create({
      title: "Sunday Mock: Basic Accounting Terms",
      courseId: courseB._id,
      className: "11",
      startsAt: new Date(Date.now() + 3 * 86400000),
      durationMin: 120,
      syllabus: "Assets, Liabilities, Journal Entries",
      venue: "RD Classes, Room 2",
      published: true,
    });

    // Create session cookies
    tokenA = await createSession(studentA, deviceA.deviceId);
    tokenB = await createSession(studentB, deviceB.deviceId);
  });

  describe("1. Strict Data Isolation Between Two Student Accounts", () => {
    it("Student A sees ONLY Course A, its lectures, notes and upcoming test", async () => {
      const data = await getStudentDashboardData(studentA._id);

      expect(data).toBeDefined();
      expect(data.student.name).toBe("Aman Sharma");
      expect(data.student.loginId.toLowerCase()).toBe("rd-stu-101");

      // Active courses: only Course A
      expect(data.activeCourses.length).toBe(1);
      expect(data.activeCourses[0].title).toBe("Class 12 Comprehensive Accountancy");

      // Syllabus coverage: reflects Course A's published lectures (2 lectures, draft ignored)
      expect(data.syllabus.totalLectures).toBe(2);

      // Stat cards: Lectures Watched total is 2, handouts count is 1 (Note A)
      expect(data.stats.lecturesWatched.total).toBe(2);
      expect(data.stats.handouts.count).toBe(1);
      expect(data.stats.tests.count).toBe(1);

      // Recent notes: only Note A
      expect(data.recentNotes.length).toBe(1);
      expect(data.recentNotes[0].title).toBe("Partnership Formula Sheet 2026");
      expect(data.recentNotes[0].book).toBe("Part A: Accounting for Partnership Firms");

      // Upcoming test: only Test A
      expect(data.upcomingTest).toBeDefined();
      expect(data.upcomingTest.title).toBe("Sunday Mock: Partnership Fundamentals");
      expect(data.upcomingTest.venue).toBe("RD Classes, Main Hall");
    });

    it("Student B sees ONLY Course B, its lectures, notes and upcoming test", async () => {
      const data = await getStudentDashboardData(studentB._id);

      expect(data).toBeDefined();
      expect(data.student.name).toBe("Bhavna Patel");
      expect(data.student.loginId.toLowerCase()).toBe("rd-stu-102");

      // Active courses: only Course B
      expect(data.activeCourses.length).toBe(1);
      expect(data.activeCourses[0].title).toBe("Class 11 Foundation Accountancy");

      // Total lectures: 1 lecture in Course B
      expect(data.syllabus.totalLectures).toBe(1);
      expect(data.stats.handouts.count).toBe(1);

      // Recent notes: only Note B
      expect(data.recentNotes.length).toBe(1);
      expect(data.recentNotes[0].title).toBe("Class 11 Journal Rules Summary");
      expect(data.recentNotes[0].book).toBe("Part 1: Introduction to Accounting");

      // Upcoming test: only Test B
      expect(data.upcomingTest.title).toBe("Sunday Mock: Basic Accounting Terms");
      expect(data.upcomingTest.venue).toBe("RD Classes, Room 2");
    });
  });

  describe("2. Resume Across Sessions", () => {
    it("Student A watches Lecture A1 to second 345, dashboard and watch route resume at second 345", async () => {
      // Simulate playback progress saving for Student A
      cookieJar.set("rd_session", tokenA);

      await saveLectureProgress({
        lectureId: lectureA1._id.toString(),
        positionSec: 345,
        durationSec: 3600,
        forceCompleted: false,
      });

      // Verify dashboard resume card reflects this saved position and chapter path
      const dashboard = await getStudentDashboardData(studentA._id);
      expect(dashboard.resume).toBeDefined();
      expect(dashboard.resume.lectureId).toBe(lectureA1._id.toString());
      expect(dashboard.resume.positionSec).toBe(345);
      expect(dashboard.resume.percent).toBe(10); // 345 / 3600 = ~10%
      expect(dashboard.resume.chapterPath).toContain("Fundamentals of Partnership");

      // Verify Watch API route retrieves saved position
      const res = await watchApiRoute(new Request("http://localhost/api/student/watch/" + lectureA1._id), {
        params: Promise.resolve({ lectureId: lectureA1._id.toString() }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.savedPositionSec).toBe(345);
      expect(json.data.lecture._id).toBe(lectureA1._id.toString());
    });

    it("If student has not watched anything yet, firstLectureId is provided for empty state CTA", async () => {
      // Student B hasn't watched anything yet
      const dashboard = await getStudentDashboardData(studentB._id);
      expect(dashboard.resume).toBeNull();
      expect(dashboard.firstLectureId).toBe(lectureB1._id.toString());
    });
  });

  describe("3. Non-Enrolled Lecture URL Returns 403 Forbidden", () => {
    it("Student A requesting watch API for Student B's lecture (Lecture B1) returns 403", async () => {
      // Set session to Student A
      cookieJar.set("rd_session", tokenA);

      const res = await watchApiRoute(
        new Request("http://localhost/api/student/watch/" + lectureB1._id),
        { params: Promise.resolve({ lectureId: lectureB1._id.toString() }) }
      );

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Forbidden/i);
    });

    it("Student A accessing Course B page throws 403 Forbidden", async () => {
      cookieJar.set("rd_session", tokenA);

      // Accessing course B slug where student A is not enrolled
      await expect(
        CourseLecturesPage({
          params: Promise.resolve({ courseSlug: "class-11-accounts" }),
        })
      ).rejects.toThrow("NEXT_FORBIDDEN");
    });
  });

  describe("4. Device Enforcement & Immediate Revocation", () => {
    it("Active student with approved device passes session check", async () => {
      cookieJar.set("rd_session", tokenA);

      const status = await getStudentAuthStatus();
      expect(status.authenticated).toBe(true);
      expect(status.user._id).toBe(studentA._id.toString());
      expect(status.user.email).toBe("aman@example.com");
    });

    it("If admin revokes the approved device in DB, next request invalidates session and identifies device_revoked", async () => {
      cookieJar.set("rd_session", tokenA);

      // Verify active initially
      let status = await getStudentAuthStatus();
      expect(status.authenticated).toBe(true);

      // Admin revokes device approval
      await Device.updateOne(
        { _id: deviceA._id },
        { status: "revoked" }
      );

      // Next request from online student
      status = await getStudentAuthStatus();
      expect(status.authenticated).toBe(false);
      expect(status.reason).toBe("device_revoked");

      // Verify session was destroyed in DB
      const sessionInDb = await Session.findOne({ userId: studentA._id });
      expect(sessionInDb).toBeNull();

      // Verify cookie was cleared
      expect(cookieJar.get("rd_session")).toBeUndefined();
    });

    it("If admin blocks the student account, next request invalidates session with account_blocked", async () => {
      cookieJar.set("rd_session", tokenB);

      // Admin blocks user account
      await User.updateOne(
        { _id: studentB._id },
        { status: "blocked" }
      );

      const status = await getStudentAuthStatus();
      expect(status.authenticated).toBe(false);
      expect(status.reason).toBe("account_blocked");

      // Cookie cleared
      expect(cookieJar.get("rd_session")).toBeUndefined();
    });
  });
});
