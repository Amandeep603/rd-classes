import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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

describe("Phase D5: Admin Dashboard Zero-Data & Real Counters", () => {
  let User, DeviceRequest, Course, Lecture, Note;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NODE_ENV = "test";

    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 120000,
      },
    });

    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;

    const { default: connectDB } = await import("../src/server/db/connect.js");
    await connectDB();

    const userMod = await import("../src/server/db/models/User.js");
    const devReqMod = await import("../src/server/db/models/DeviceRequest.js");
    const courseMod = await import("../src/server/db/models/Course.js");
    const lectureMod = await import("../src/server/db/models/Lecture.js");
    const noteMod = await import("../src/server/db/models/Note.js");

    User = userMod.User;
    DeviceRequest = devReqMod.DeviceRequest;
    Course = courseMod.Course;
    Lecture = lectureMod.Lecture;
    Note = noteMod.Note;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  it("handles empty counts correctly without NaN or undefined", async () => {
    const [
      studentsCount,
      pendingRequestsCount,
      coursesCount,
      lecturesCount,
      notesCount,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      DeviceRequest.countDocuments({ status: "pending" }),
      Course.countDocuments({ published: true }),
      Lecture.countDocuments({ published: true }),
      Note.countDocuments({ published: true }),
    ]);

    expect(studentsCount).toBe(0);
    expect(pendingRequestsCount).toBe(0);
    expect(coursesCount).toBe(0);
    expect(lecturesCount).toBe(0);
    expect(notesCount).toBe(0);
  });

  it("evaluates setup checklist completion status accurately", () => {
    const calculateSetupStatus = (counts) => {
      const steps = [
        { id: "course", completed: (counts.coursesCount || 0) > 0 },
        { id: "lecture", completed: (counts.lecturesCount || 0) > 0 },
        { id: "student", completed: (counts.studentsCount || 0) > 0 },
        { id: "note", completed: (counts.notesCount || 0) > 0 },
      ];
      const completedCount = steps.filter((s) => s.completed).length;
      return {
        completedCount,
        allComplete: completedCount === steps.length,
        percent: Math.round((completedCount / steps.length) * 100),
      };
    };

    // When everything is zero
    const zeroState = calculateSetupStatus({
      coursesCount: 0,
      lecturesCount: 0,
      studentsCount: 0,
      notesCount: 0,
    });
    expect(zeroState.completedCount).toBe(0);
    expect(zeroState.allComplete).toBe(false);
    expect(zeroState.percent).toBe(0);

    // When partially completed
    const partialState = calculateSetupStatus({
      coursesCount: 2,
      lecturesCount: 10,
      studentsCount: 0,
      notesCount: 0,
    });
    expect(partialState.completedCount).toBe(2);
    expect(partialState.allComplete).toBe(false);
    expect(partialState.percent).toBe(50);

    // When all steps are completed
    const completedState = calculateSetupStatus({
      coursesCount: 2,
      lecturesCount: 15,
      studentsCount: 50,
      notesCount: 4,
    });
    expect(completedState.completedCount).toBe(4);
    expect(completedState.allComplete).toBe(true);
    expect(completedState.percent).toBe(100);
  });
});
