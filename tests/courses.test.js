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

describe("Courses Architecture, Validation & Isolation Test Suite", () => {
  let User, Course, Enrollment, Progress, Lecture;
  let courseSchema;
  let getCachedPublicCourses, getCachedFeaturedCourses, getCourseBySlug, getStudentEnrolledCourses;

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
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;
    Progress = (await import("../src/server/db/models/Progress.js")).Progress;
    Lecture = (await import("../src/server/db/models/Lecture.js")).Lecture;

    const schemaMod = await import("../src/server/validation/schemas.js");
    courseSchema = schemaMod.courseSchema;

    const courseServiceMod = await import("../src/server/services/courseService.js");
    getCachedPublicCourses = courseServiceMod.getCachedPublicCourses;
    getCachedFeaturedCourses = courseServiceMod.getCachedFeaturedCourses;
    getCourseBySlug = courseServiceMod.getCourseBySlug;
    getStudentEnrolledCourses = courseServiceMod.getStudentEnrolledCourses;
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
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await User.deleteMany({});
    await Progress.deleteMany({});
    await Lecture.deleteMany({});
  });

  it("1. Course schema validates published courses requiring mandatory fields", () => {
    // Missing description & metaText when published
    const invalidData = {
      title: "Class 12 Comprehensive",
      slug: "class-12-comp",
      published: true,
      category: "class12",
      tone: "sky",
    };
    const res = courseSchema.safeParse(invalidData);
    expect(res.success).toBe(false);

    // Valid published course
    const validData = {
      title: "Class 12 Accountancy Pro",
      slug: "class-12-pro",
      category: "class12",
      tone: "sky",
      illustration: "books-blue",
      badgeText: "Most Popular",
      badgeVariant: "yellow",
      description: "Full CBSE Class 12 preparation course covering fundamentals.",
      metaText: "100+ recorded hours",
      metaIcon: "video",
      published: true,
      featured: true,
    };
    const validRes = courseSchema.safeParse(validData);
    expect(validRes.success).toBe(true);
  });

  it("2. Public course query respects ordering (order asc, createdAt asc) and published status", async () => {
    await Course.create([
      {
        title: "Draft Course",
        slug: "draft-course",
        category: "class11",
        tone: "green",
        published: false,
        order: 0,
      },
      {
        title: "Third Course",
        slug: "third-course",
        category: "class12",
        tone: "yellow",
        published: true,
        order: 3,
      },
      {
        title: "First Course",
        slug: "first-course",
        category: "class12",
        tone: "sky",
        published: true,
        order: 1,
      },
      {
        title: "Second Course",
        slug: "second-course",
        category: "class12",
        tone: "orange",
        published: true,
        order: 2,
      },
    ]);

    const publicCourses = await getCachedPublicCourses();
    expect(publicCourses.length).toBe(3);
    expect(publicCourses.map((c) => c.slug)).toEqual([
      "first-course",
      "second-course",
      "third-course",
    ]);
  });

  it("3. Featured course query only returns courses that are both published AND featured", async () => {
    await Course.create([
      {
        title: "Featured & Published",
        slug: "featured-published",
        category: "class12",
        tone: "sky",
        published: true,
        featured: true,
        order: 1,
      },
      {
        title: "Featured but Draft",
        slug: "featured-draft",
        category: "class11",
        tone: "green",
        published: false,
        featured: true,
        order: 2,
      },
      {
        title: "Published Not Featured",
        slug: "published-not-featured",
        category: "recorded",
        tone: "purple",
        published: true,
        featured: false,
        order: 3,
      },
    ]);

    const featured = await getCachedFeaturedCourses();
    expect(featured.length).toBe(1);
    expect(featured[0].slug).toBe("featured-published");
  });

  it("4. Student course isolation ensures student only retrieves courses they are enrolled in", async () => {
    const studentA = await User.create({
      name: "Student Alpha",
      loginId: "student_alpha",
      role: "student",
      passwordHash: "hash",
    });

    const studentB = await User.create({
      name: "Student Beta",
      loginId: "student_beta",
      role: "student",
      passwordHash: "hash",
    });

    const course1 = await Course.create({
      title: "Course One",
      slug: "course-one",
      category: "class12",
      tone: "sky",
      published: true,
    });

    const course2 = await Course.create({
      title: "Course Two",
      slug: "course-two",
      category: "class11",
      tone: "green",
      published: true,
    });

    // Enroll studentA in course1
    await Enrollment.create({
      userId: studentA._id,
      courseId: course1._id,
      status: "active",
    });

    // Enroll studentB in course2
    await Enrollment.create({
      userId: studentB._id,
      courseId: course2._id,
      status: "active",
    });

    const coursesA = await getStudentEnrolledCourses(studentA._id);
    expect(coursesA.length).toBe(1);
    expect(coursesA[0].slug).toBe("course-one");

    const coursesB = await getStudentEnrolledCourses(studentB._id);
    expect(coursesB.length).toBe(1);
    expect(coursesB[0].slug).toBe("course-two");
  });

  it("5. Inactive/revoked enrollments do not grant access to student portal courses", async () => {
    const student = await User.create({
      name: "Expired Student",
      loginId: "student_exp",
      role: "student",
      passwordHash: "hash",
    });

    const course = await Course.create({
      title: "Restricted Course",
      slug: "restricted-course",
      category: "crash",
      tone: "red",
      published: true,
    });

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      status: "revoked",
    });

    const courses = await getStudentEnrolledCourses(student._id);
    expect(courses.length).toBe(0);
  });

  it("6. getCachedCourseLectures scrubs vimeoId for non-preview lectures and retains for preview", async () => {
    const course = await Course.create({
      title: "Test Course Details",
      slug: "test-course-details",
      category: "class12",
      tone: "sky",
      published: true,
      description: "Sample course description for testing",
      about: "Deep dive accountancy curriculum",
      heroIllustration: "books-subjects",
      highlights: [{ icon: "video", text: "100 HD Lectures" }],
      includes: [{ icon: "notes", text: "Revision PDF" }],
      faqs: [{ q: "Is offline access supported?", a: "Yes, on any device." }],
      facultyBullets: ["10+ years experience"],
    });

    // Create 2 lectures: 1 preview, 1 private
    await Lecture.create({
      courseId: course._id,
      title: "Preview Chapter 1",
      section: "Introduction",
      durationSec: 1200,
      order: 1,
      published: true,
      isPreview: true,
      vimeoId: "vimeo_preview_12345",
    });

    await Lecture.create({
      courseId: course._id,
      title: "Private Chapter 2",
      section: "Introduction",
      durationSec: 1800,
      order: 2,
      published: true,
      isPreview: false,
      vimeoId: "vimeo_private_secret_99999",
    });

    const { getCachedCourseLectures } = await import("../src/server/services/courseService.js");
    const lectures = await getCachedCourseLectures(course._id);

    expect(lectures.length).toBe(2);

    const previewLec = lectures.find((l) => l.title === "Preview Chapter 1");
    expect(previewLec.isPreview).toBe(true);
    expect(previewLec.vimeoId).toBe("vimeo_preview_12345");

    const privateLec = lectures.find((l) => l.title === "Private Chapter 2");
    expect(privateLec.isPreview).toBe(false);
    expect(privateLec.vimeoId).toBeUndefined();
  });
});

