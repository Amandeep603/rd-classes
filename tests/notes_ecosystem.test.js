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

let mongod = null;

describe("Phase D4: Notes Ecosystem Suite", () => {
  let User, Course, Note, Enrollment;
  let getCachedPublicNotes, checkNoteAccess, getStudentAccessibleNotes, createNote;
  let studentA, studentB, course12, course11;

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
    Note = (await import("../src/server/db/models/Note.js")).Note;
    Enrollment = (await import("../src/server/db/models/Enrollment.js")).Enrollment;

    const noteService = await import("../src/server/services/noteService.js");
    getCachedPublicNotes = noteService.getCachedPublicNotes;
    checkNoteAccess = noteService.checkNoteAccess;
    getStudentAccessibleNotes = noteService.getStudentAccessibleNotes;
    createNote = noteService.createNote;

    studentA = await User.create({
      name: "Enrolled Student",
      email: "student-a@rdclasses.test",
      loginId: "student-a",
      passwordHash: "hash123",
      role: "student",
      status: "active",
    });

    studentB = await User.create({
      name: "Non-Enrolled Student",
      email: "student-b@rdclasses.test",
      loginId: "student-b",
      passwordHash: "hash123",
      role: "student",
      status: "active",
    });

    course12 = await Course.create({
      title: "Class 12 Accounts Comprehensive",
      slug: "class-12-accounts",
      category: "class12",
      tone: "sky",
      price: 4999,
      published: true,
      order: 0,
    });

    course11 = await Course.create({
      title: "Class 11 Accounts Fundamentals",
      slug: "class-11-accounts",
      category: "class11",
      tone: "yellow",
      price: 3999,
      published: true,
      order: 1,
    });

    // Enroll studentA in course12
    await Enrollment.create({
      userId: studentA._id,
      courseId: course12._id,
      status: "active",
      enrolledAt: new Date(),
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Note.deleteMany({});
  });

  it("1. getCachedPublicNotes retrieves published notes with populated course details", async () => {
    await Note.create({
      title: "Partnership Dissolution Summary",
      kind: "notes",
      source: "file",
      fileUrl: "/api/dev-uploads/partnership.pdf",
      fileKey: "secrets/partnership.pdf",
      contentType: "application/pdf",
      pageCount: 14,
      section: "Dissolution of Partnership",
      courseIds: [course12._id],
      published: true,
    });

    await Note.create({
      title: "Class 11 Ledger Posting Practice",
      kind: "practice",
      source: "link",
      externalUrl: "https://example.com/ledger.pdf",
      pageCount: 6,
      section: "Journal & Ledger",
      courseIds: [course11._id],
      published: true,
    });

    // Unpublished draft note
    await Note.create({
      title: "Draft Cash Flow Guide",
      kind: "notes",
      source: "file",
      courseIds: [course12._id],
      published: false,
    });

    const publicNotes = await getCachedPublicNotes();
    expect(publicNotes).toHaveLength(2);

    const partnershipNote = publicNotes.find((n) => n.title.includes("Partnership"));
    expect(partnershipNote).toBeDefined();
    expect(partnershipNote.pageCount).toBe(14);
    expect(partnershipNote.courses).toHaveLength(1);
    expect(partnershipNote.courses[0].title).toBe("Class 12 Accounts Comprehensive");
    expect(partnershipNote.courses[0].slug).toBe("class-12-accounts");

    // Safety: internal file keys and raw URLs must NOT be exposed
    expect(partnershipNote.fileKey).toBeUndefined();
    expect(partnershipNote.fileUrl).toBeUndefined();
  });

  it("2. checkNoteAccess allows enrolled student and denies non-enrolled student", async () => {
    const note = await Note.create({
      title: "Debentures Formulas",
      kind: "formula",
      source: "file",
      fileUrl: "/api/dev-uploads/debentures.pdf",
      courseIds: [course12._id],
      published: true,
    });

    // Student A is enrolled in course12
    const accessA = await checkNoteAccess(note._id, studentA);
    expect(accessA.allowed).toBe(true);
    expect(accessA.note).toBeDefined();

    // Student B is NOT enrolled in course12
    const accessB = await checkNoteAccess(note._id, studentB);
    expect(accessB.allowed).toBe(false);
    expect(accessB.reason).toBe("not_enrolled");
  });

  it("3. checkNoteAccess allows admin unconditionally", async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin-notes@rdclasses.test",
      loginId: "admin-notes",
      passwordHash: "hash123",
      role: "admin",
      status: "active",
    });

    const note = await Note.create({
      title: "Confidential Sample Paper",
      kind: "paper",
      source: "file",
      fileUrl: "/api/dev-uploads/sample.pdf",
      courseIds: [course11._id],
      published: true,
    });

    const adminAccess = await checkNoteAccess(note._id, admin);
    expect(adminAccess.allowed).toBe(true);
  });

  it("4. getStudentAccessibleNotes returns notes only for courses the student is enrolled in", async () => {
    // Note in course12 (enrolled)
    await Note.create({
      title: "Note for Course 12",
      kind: "notes",
      courseIds: [course12._id],
      published: true,
    });

    // Note in course11 (not enrolled)
    await Note.create({
      title: "Note for Course 11",
      kind: "practice",
      courseIds: [course11._id],
      published: true,
    });

    const accessibleA = await getStudentAccessibleNotes(studentA._id);
    expect(accessibleA).toHaveLength(1);
    expect(accessibleA[0].title).toBe("Note for Course 12");

    const accessibleB = await getStudentAccessibleNotes(studentB._id);
    expect(accessibleB).toHaveLength(0);
  });
});
