import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Mock next/headers and next/server
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

let mongod = null;

describe("RD Classes Portal Redesign New Features Test Suite", () => {
  let User, Course, Lecture, Enrollment, Progress, Announcement, Test, TestResult, Settings, Counter;
  let getNextStudentCode;
  let getStudentDashboardData;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
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
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;
    Progress = (await import("../src/server/db/models/Progress.js")).Progress;
    Announcement = (await import("../src/server/db/models/Announcement.js")).Announcement;
    Test = (await import("../src/server/db/models/Test.js")).Test;
    TestResult = (await import("../src/server/db/models/TestResult.js")).TestResult;
    Settings = (await import("../src/server/db/models/Settings.js")).Settings;
    Counter = (await import("../src/server/db/models/Counter.js")).Counter;

    const studentCodeMod = await import("../src/server/services/studentCodeService.js");
    getNextStudentCode = studentCodeMod.getNextStudentCode;

    const dashMod = await import("../src/server/services/studentDashboardService.js");
    getStudentDashboardData = dashMod.getStudentDashboardData;
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  it("1. Generates unique sequential studentCodes under parallel concurrency", async () => {
    const currentYear = new Date().getFullYear();
    // Launch 15 concurrent calls to getNextStudentCode
    const results = await Promise.all(
      Array.from({ length: 15 }, () => getNextStudentCode())
    );

    expect(results).toHaveLength(15);

    // Verify format RD-YYYY-NNN
    for (const code of results) {
      expect(code).toMatch(new RegExp(`^RD-${currentYear}-\\d{3}$`));
    }

    // Verify all 15 are distinct
    const uniqueCodes = new Set(results);
    expect(uniqueCodes.size).toBe(15);

    // Verify numbers span 001 to 015
    const seqNumbers = results
      .map((c) => parseInt(c.split("-")[2], 10))
      .sort((a, b) => a - b);
    expect(seqNumbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it("2. Filters announcements accurately by audience and validity window", async () => {
    const studentA = await User.create({
      name: "Student A",
      loginId: "studenta",
      passwordHash: "hash123",
      role: "student",
    });

    const studentB = await User.create({
      name: "Student B",
      loginId: "studentb",
      passwordHash: "hash123",
      role: "student",
    });

    const courseA = await Course.create({
      title: "Accountancy 12",
      slug: "acc-12",
      published: true,
    });

    const courseB = await Course.create({
      title: "Economics 12",
      slug: "eco-12",
      published: true,
    });

    // Student A enrolled in Course A, Student B enrolled in Course B
    await Enrollment.create({
      userId: studentA._id,
      courseId: courseA._id,
      status: "active",
    });

    await Enrollment.create({
      userId: studentB._id,
      courseId: courseB._id,
      status: "active",
    });

    const now = new Date();
    const past = new Date(Date.now() - 3600000);
    const future = new Date(Date.now() + 3600000);

    // Announcement 1: Active, targeted to Course A only
    const annCourseA = await Announcement.create({
      title: "Course A Special Notice",
      body: "Special revision class for Accountancy students.",
      audience: { all: false, courseIds: [courseA._id] },
      startsAt: past,
      active: true,
    });

    // Student A should see it
    const dataA = await getStudentDashboardData(studentA._id);
    expect(dataA.announcement).not.toBeNull();
    expect(dataA.announcement.title).toBe("Course A Special Notice");

    // Student B should NOT see Course A notice
    const dataB = await getStudentDashboardData(studentB._id);
    expect(dataB.announcement).toBeNull();

    // Announcement 2: Expired announcement should not be visible
    await Announcement.create({
      title: "Old Notice",
      body: "Expired yesterday",
      audience: { all: true, courseIds: [] },
      startsAt: new Date(Date.now() - 7200000),
      endsAt: new Date(Date.now() - 3600000), // ended in the past
      active: true,
    });

    const dataBAfterExpired = await getStudentDashboardData(studentB._id);
    expect(dataBAfterExpired.announcement).toBeNull();
  });

  it("3. Calculates syllabus coverage percentage and lecture progress accurately", async () => {
    const student = await User.create({
      name: "Tanvi Agarwal",
      loginId: "tanvia",
      passwordHash: "hash123",
      role: "student",
    });

    const course = await Course.create({
      title: "Comprehensive Accountancy",
      slug: "comp-acc",
      published: true,
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "active",
    });

    // Create 10 published lectures
    const lectures = [];
    for (let i = 1; i <= 10; i++) {
      lectures.push(
        await Lecture.create({
          courseId: course._id,
          title: `Lecture ${i}`,
          section: "Chapter 1",
          order: i,
          vimeoId: `vimeo_${i}`,
          durationSec: 1800,
          published: true,
        })
      );
    }

    // Mark 7 lectures as completed (7 / 10 = 70%)
    for (let i = 0; i < 7; i++) {
      await Progress.create({
        userId: student._id,
        courseId: course._id,
        lectureId: lectures[i]._id,
        completed: true,
        percent: 100,
      });
    }

    const data = await getStudentDashboardData(student._id);
    expect(data.syllabus.totalLectures).toBe(10);
    expect(data.syllabus.completedLectures).toBe(7);
    expect(data.syllabus.percent).toBe(70);
    expect(data.stats.lecturesWatched.completed).toBe(7);
    expect(data.stats.lecturesWatched.total).toBe(10);
  });

  it("4. Calculates mock test averages correctly across multiple scorecards", async () => {
    const student = await User.create({
      name: "Kunal Sethi",
      loginId: "kunals",
      passwordHash: "hash123",
      role: "student",
    });

    const test1 = await Test.create({
      title: "Sunday Mock 1",
      startsAt: new Date(),
      published: true,
    });

    const test2 = await Test.create({
      title: "Sunday Mock 2",
      startsAt: new Date(),
      published: true,
    });

    // Test 1: 94 / 100 (94%)
    await TestResult.create({
      testId: test1._id,
      userId: student._id,
      score: 94,
      maxScore: 100,
    });

    // Test 2: 95 / 100 (95%)
    await TestResult.create({
      testId: test2._id,
      userId: student._id,
      score: 95,
      maxScore: 100,
    });

    const data = await getStudentDashboardData(student._id);
    expect(data.stats.tests.count).toBe(2);
    // (94 + 95) / 2 = 94.5%
    expect(data.stats.tests.avgScore).toBe("94.5");
  });

  it("5. Strict confidentiality: paymentNote is never returned or leaked to students", async () => {
    const student = await User.create({
      name: "Confidential Student",
      loginId: "confstudent",
      passwordHash: "hash123",
      role: "student",
    });

    const course = await Course.create({
      title: "Private Course",
      slug: "private-course",
      published: true,
    });

    // Create enrollment with admin-only payment note
    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "active",
      paymentNote: {
        amount: "15000",
        mode: "WhatsApp Cash Transfer",
        remark: "Confidential admin fees note",
      },
    });

    const data = await getStudentDashboardData(student._id);

    // Verify root object has no paymentNote
    expect(data.paymentNote).toBeUndefined();

    // Verify stringified response contains no mention of the private notes
    const jsonStr = JSON.stringify(data);
    expect(jsonStr).not.toContain("15000");
    expect(jsonStr).not.toContain("WhatsApp Cash Transfer");
    expect(jsonStr).not.toContain("Confidential admin fees note");
  });
});
