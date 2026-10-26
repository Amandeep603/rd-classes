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

describe("Phase D3: Free First Lecture & Lock Protection Suite", () => {
  let User, Course, Lecture;
  let createLecture, updateLecture, deleteLecture, reorderLectures, getAuthorizedLecture;
  let getCachedCourseLectures;
  let adminUser, testCourse;

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

    const lectureService = await import("../src/server/services/lectureService.js");
    createLecture = lectureService.createLecture;
    updateLecture = lectureService.updateLecture;
    deleteLecture = lectureService.deleteLecture;
    reorderLectures = lectureService.reorderLectures;
    getAuthorizedLecture = lectureService.getAuthorizedLecture;

    const courseService = await import("../src/server/services/courseService.js");
    getCachedCourseLectures = courseService.getCachedCourseLectures;

    adminUser = await User.create({
      name: "Admin User",
      email: "admin-d3@rdclasses.test",
      loginId: "admin-d3",
      passwordHash: "hash123",
      role: "admin",
      status: "active",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Lecture.deleteMany({});
    await Course.deleteMany({});

    testCourse = await Course.create({
      title: "Class 12 Accounts Comprehensive",
      subtitle: "Full Year Course",
      slug: "class-12-accounts",
      category: "class12",
      tone: "sky",
      price: 4999,
      published: true,
      order: 0,
    });
  });

  it("1. automatically marks the first published lecture as freePreview: true", async () => {
    const lec1 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Introduction to Partnership Accounts",
        section: "Partnership Basics",
        vimeoUrl: "https://vimeo.com/987654321",
        durationSec: 1800,
        published: true,
      },
      adminUser._id
    );

    expect(lec1.freePreview).toBe(true);
    expect(lec1.isPreview).toBe(true);

    // Second lecture added without explicit override remains locked
    const lec2 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Partnership Deed & Provisions",
        section: "Partnership Basics",
        vimeoUrl: "https://vimeo.com/987654322",
        durationSec: 2100,
        published: true,
      },
      adminUser._id
    );

    expect(lec2.freePreview).toBe(false);
    expect(lec2.isPreview).toBe(false);
  });

  it("2. re-evaluates and marks lowest order lecture free when the first lecture is deleted", async () => {
    const lec1 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lec 1 - Basics",
        vimeoUrl: "https://vimeo.com/987654321",
        published: true,
      },
      adminUser._id
    );

    const lec2 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lec 2 - Goodwill",
        vimeoUrl: "https://vimeo.com/987654322",
        published: true,
      },
      adminUser._id
    );

    expect(lec1.freePreview).toBe(true);
    expect(lec2.freePreview).toBe(false);

    // Delete first lecture
    await deleteLecture(lec1._id.toString(), adminUser._id);

    // Lec 2 should now automatically be synced to freePreview: true
    const updatedLec2 = await Lecture.findById(lec2._id);
    expect(updatedLec2.freePreview).toBe(true);
    expect(updatedLec2.isPreview).toBe(true);
  });

  it("3. re-evaluates freePreview when lectures are reordered", async () => {
    const lec1 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lecture Alpha",
        vimeoUrl: "https://vimeo.com/987654321",
        published: true,
      },
      adminUser._id
    );

    const lec2 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lecture Beta",
        vimeoUrl: "https://vimeo.com/987654322",
        published: true,
      },
      adminUser._id
    );

    // Reorder so lec2 is first (order 0) and lec1 is second (order 1)
    await reorderLectures(
      testCourse._id.toString(),
      [lec2._id.toString(), lec1._id.toString()],
      adminUser._id
    );

    const freshLec1 = await Lecture.findById(lec1._id);
    const freshLec2 = await Lecture.findById(lec2._id);

    expect(freshLec2.order).toBe(0);
    expect(freshLec1.order).toBe(1);
    // At least one lecture in the course has freePreview: true
    const hasFree = freshLec1.freePreview || freshLec2.freePreview;
    expect(hasFree).toBe(true);
  });

  it("4. supports admin override to mark additional lectures free or toggle free preview", async () => {
    const lec1 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lec 1",
        vimeoUrl: "https://vimeo.com/987654321",
        published: true,
      },
      adminUser._id
    );

    const lec2 = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Lec 2",
        vimeoUrl: "https://vimeo.com/987654322",
        published: true,
        freePreview: true, // explicit override
      },
      adminUser._id
    );

    expect(lec1.freePreview).toBe(true);
    expect(lec2.freePreview).toBe(true);

    // Admin updates lec2 to turn freePreview off
    await updateLecture(
      lec2._id.toString(),
      { freePreview: false },
      adminUser._id
    );

    const updatedLec2 = await Lecture.findById(lec2._id);
    expect(updatedLec2.freePreview).toBe(false);
  });

  it("5. visitor public query (getCachedCourseLectures) exposes vimeoId ONLY for free preview lectures", async () => {
    await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Free Introductory Lecture",
        vimeoUrl: "https://vimeo.com/111222333",
        durationSec: 1200,
        published: true,
      },
      adminUser._id
    );

    await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Locked Proprietary Lecture",
        vimeoUrl: "https://vimeo.com/444555666",
        durationSec: 2400,
        published: true,
      },
      adminUser._id
    );

    const publicLectures = await getCachedCourseLectures(testCourse._id.toString());
    expect(publicLectures).toHaveLength(2);

    const freeLec = publicLectures.find((l) => l.freePreview);
    const lockedLec = publicLectures.find((l) => !l.freePreview);

    expect(freeLec).toBeDefined();
    expect(freeLec.vimeoId).toBe("111222333");

    expect(lockedLec).toBeDefined();
    // Safety requirement: locked lecture Vimeo ID must NEVER be exposed
    expect(lockedLec.vimeoId).toBeUndefined();
  });

  it("6. getAuthorizedLecture allows access to freePreview lecture for non-enrolled students and blocks locked lectures", async () => {
    const freeLec = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Public Free Preview",
        vimeoUrl: "https://vimeo.com/777888999",
        published: true,
      },
      adminUser._id
    );

    const lockedLec = await createLecture(
      {
        courseId: testCourse._id.toString(),
        title: "Enrolled Only Material",
        vimeoUrl: "https://vimeo.com/999888777",
        published: true,
      },
      adminUser._id
    );

    const nonEnrolledStudentId = new mongoose.Types.ObjectId();

    // Free preview lecture authorized
    const authFree = await getAuthorizedLecture({
      lectureId: freeLec._id.toString(),
      studentId: nonEnrolledStudentId,
    });
    expect(authFree).not.toBeNull();
    expect(authFree.vimeoId).toBe("777888999");
    expect(authFree.playerUrl).toContain("777888999");

    // Locked lecture blocked (returns null for non-enrolled)
    const authLocked = await getAuthorizedLecture({
      lectureId: lockedLec._id.toString(),
      studentId: nonEnrolledStudentId,
    });
    expect(authLocked).toBeNull();
  });
});
