import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Mock Next.js headers, cache, server
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

describe("Phase C4: Notes Linked to Courses & Bulk Lectures", () => {
  let Note, Course, Enrollment, Lecture, User;
  let noteCreateSchema;
  let checkNoteAccess, attachNoteToCourse, detachNoteFromCourse, reorderCourseNotes;
  let bulkAddLecturesToCourseAction;

  let courseA;
  let courseB;
  let studentUser;

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

    Note = (await import("../src/server/db/models/Note.js")).Note;
    Course = (await import("../src/server/db/models/Course.js")).Course;
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;
    Lecture = (await import("../src/server/db/models/Lecture.js")).Lecture;
    User = (await import("../src/server/db/models/User.js")).User;

    const schemas = await import("../src/server/validation/schemas.js");
    noteCreateSchema = schemas.noteCreateSchema;

    const noteService = await import("../src/server/services/noteService.js");
    checkNoteAccess = noteService.checkNoteAccess;
    attachNoteToCourse = noteService.attachNoteToCourse;
    detachNoteFromCourse = noteService.detachNoteFromCourse;
    reorderCourseNotes = noteService.reorderCourseNotes;

    const lectureActions = await import("../src/server/actions/admin.lectures.actions.js");
    bulkAddLecturesToCourseAction = lectureActions.bulkAddLecturesToCourseAction;
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
    await Note.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Lecture.deleteMany({});
    await User.deleteMany({});

    courseA = await Course.create({
      title: "Class 12 Partnership Accounts",
      slug: `partnership-acc-${Date.now()}`,
      published: true,
      price: 4999,
    });

    courseB = await Course.create({
      title: "Class 12 Company Accounts",
      slug: `company-acc-${Date.now()}`,
      published: true,
      price: 5999,
    });

    studentUser = await User.create({
      name: "Rohit Sharma",
      loginId: `rohit_${Date.now()}`,
      passwordHash: "dummyhash123456",
      role: "student",
      studentCode: "RD-2026-901",
    });
  });

  describe("Note validation schema", () => {
    it("accepts a valid file-based note", () => {
      const validFileNote = {
        title: "Partnership Basics PDF",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/test.pdf",
        fileKey: "notes/test.pdf",
        contentType: "application/pdf",
        published: true,
      };
      const res = noteCreateSchema.safeParse(validFileNote);
      expect(res.success).toBe(true);
    });

    it("accepts a valid link-based note with https URL", () => {
      const validLinkNote = {
        title: "Google Drive Question Bank",
        kind: "practice",
        source: "link",
        externalUrl: "https://drive.google.com/file/d/12345/view",
        published: true,
      };
      const res = noteCreateSchema.safeParse(validLinkNote);
      expect(res.success).toBe(true);
    });

    it("rejects a link note without externalUrl or invalid URL", () => {
      const missingUrl = {
        title: "Bad Link Note",
        kind: "practice",
        source: "link",
        published: true,
      };
      const res1 = noteCreateSchema.safeParse(missingUrl);
      expect(res1.success).toBe(false);

      const invalidUrl = {
        title: "Bad Link Note",
        kind: "practice",
        source: "link",
        externalUrl: "not-a-url",
        published: true,
      };
      const res2 = noteCreateSchema.safeParse(invalidUrl);
      expect(res2.success).toBe(false);
    });

    it("rejects a file note without fileUrl", () => {
      const missingFile = {
        title: "Missing File PDF",
        kind: "notes",
        source: "file",
        published: true,
      };
      const res = noteCreateSchema.safeParse(missingFile);
      expect(res.success).toBe(false);
    });
  });

  describe("checkNoteAccess access control rules", () => {
    it("allows admin access to any note including unpublished", async () => {
      const unpublishedNote = await Note.create({
        title: "Draft Note",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/draft.pdf",
        fileKey: "notes/draft.pdf",
        published: false,
        courseIds: [courseA._id],
      });

      const adminUser = { _id: mockAdminId, role: "admin" };
      const access = await checkNoteAccess(unpublishedNote._id, adminUser);
      expect(access.allowed).toBe(true);
      expect(access.note._id.toString()).toBe(unpublishedNote._id.toString());
    });

    it("allows enrolled student with active unexpired enrollment", async () => {
      const publishedNote = await Note.create({
        title: "Partnership Chapter 1 Handout",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/p1.pdf",
        fileKey: "notes/p1.pdf",
        published: true,
        courseIds: [courseA._id],
      });

      // Active enrollment in Course A
      await Enrollment.create({
        userId: studentUser._id,
        courseId: courseA._id,
        status: "active",
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
      });

      const access = await checkNoteAccess(publishedNote._id, studentUser);
      expect(access.allowed).toBe(true);
    });

    it("denies unenrolled student with not_enrolled", async () => {
      const publishedNote = await Note.create({
        title: "Company Accounts Formula Sheet",
        kind: "formula",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/formula.pdf",
        fileKey: "notes/formula.pdf",
        published: true,
        courseIds: [courseB._id],
      });

      // Student has NO enrollment in Course B
      const access = await checkNoteAccess(publishedNote._id, studentUser);
      expect(access.allowed).toBe(false);
      expect(access.reason).toBe("not_enrolled");
    });

    it("denies student with expired enrollment", async () => {
      const publishedNote = await Note.create({
        title: "Past Year Papers",
        kind: "paper",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/paper.pdf",
        fileKey: "notes/paper.pdf",
        published: true,
        courseIds: [courseA._id],
      });

      // Expired enrollment yesterday
      await Enrollment.create({
        userId: studentUser._id,
        courseId: courseA._id,
        status: "active",
        expiresAt: new Date(Date.now() - 86400000),
      });

      const access = await checkNoteAccess(publishedNote._id, studentUser);
      expect(access.allowed).toBe(false);
      expect(access.reason).toBe("not_enrolled");
    });

    it("denies student for unpublished note with not_found", async () => {
      const unpublishedNote = await Note.create({
        title: "Hidden Teacher Answer Key",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/key.pdf",
        fileKey: "notes/key.pdf",
        published: false,
        courseIds: [courseA._id],
      });

      await Enrollment.create({
        userId: studentUser._id,
        courseId: courseA._id,
        status: "active",
      });

      const access = await checkNoteAccess(unpublishedNote._id, studentUser);
      expect(access.allowed).toBe(false);
      expect(access.reason).toBe("not_found");
    });
  });

  describe("Course Note attachment & reordering", () => {
    it("attaches and detaches note from a course", async () => {
      const note = await Note.create({
        title: "Revaluation Account Examples",
        kind: "practice",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/reval.pdf",
        fileKey: "notes/reval.pdf",
        published: true,
        courseIds: [courseA._id],
      });

      // Attach to Course B
      const updated = await attachNoteToCourse(note._id, courseB._id);
      const courseIdsStr = updated.courseIds.map((id) => id.toString());
      expect(courseIdsStr).toContain(courseA._id.toString());
      expect(courseIdsStr).toContain(courseB._id.toString());

      // Detach from Course A
      const detached = await detachNoteFromCourse(note._id, courseA._id);
      const detachedIdsStr = detached.courseIds.map((id) => id.toString());
      expect(detachedIdsStr).not.toContain(courseA._id.toString());
      expect(detachedIdsStr).toContain(courseB._id.toString());
    });

    it("reorders notes sequentially", async () => {
      const note1 = await Note.create({
        title: "Part 1",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.com/1.pdf",
        courseIds: [courseA._id],
        order: 1,
      });
      const note2 = await Note.create({
        title: "Part 2",
        kind: "notes",
        source: "file",
        fileUrl: "https://blob.com/2.pdf",
        courseIds: [courseA._id],
        order: 2,
      });

      await reorderCourseNotes(courseA._id, [note2._id, note1._id]);

      const n1 = await Note.findById(note1._id);
      const n2 = await Note.findById(note2._id);
      expect(n2.order).toBe(0);
      expect(n1.order).toBe(1);
    });
  });

  describe("Bulk Add Lectures action", () => {
    it("parses multiple Vimeo URLs, sets sequential order, skips duplicates and invalid lines", async () => {
      // Existing lecture with order 1
      await Lecture.create({
        courseId: courseA._id,
        title: "Introduction",
        vimeoId: "111111111",
        order: 1,
        published: true,
      });

      const rawInput = `
        https://vimeo.com/222222222
        https://player.vimeo.com/video/333333333/abcdef123
        https://vimeo.com/111111111
        not-a-vimeo-link
        444444444
      `;

      const result = await bulkAddLecturesToCourseAction({
        courseId: courseA._id.toString(),
        rawUrls: rawInput,
        section: "Bulk Section Test",
      });

      expect(result.success).toBe(true);
      expect(result.addedCount).toBe(3); // 222222222, 333333333, 444444444
      expect(result.skippedCount).toBe(2); // 111111111 (duplicate) and not-a-vimeo-link (invalid)

      const newLec1 = await Lecture.findOne({ courseId: courseA._id, vimeoId: "222222222" });
      const newLec2 = await Lecture.findOne({ courseId: courseA._id, vimeoId: "333333333" });
      const newLec3 = await Lecture.findOne({ courseId: courseA._id, vimeoId: "444444444" });

      expect(newLec1).toBeDefined();
      expect(newLec1.order).toBe(2); // starts after existing max 1
      expect(newLec2).toBeDefined();
      expect(newLec2.order).toBe(3);
      expect(newLec2.vimeoHash).toBe("abcdef123");
      expect(newLec3).toBeDefined();
      expect(newLec3.order).toBe(4);
    });
  });
});
