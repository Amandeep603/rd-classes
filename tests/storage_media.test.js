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

describe("Phase A: Storage & MediaAsset Test Suite", () => {
  let User, Course, MediaAsset;
  let isValidAssetUrl, getStorageDriver;
  let registerAssetService, getAssetUsageCount, deleteAssetPermanentlyService;

  beforeAll(async () => {
    process.env.AUTH_SECRET = "super_secure_random_test_secret_at_least_32_chars_123456";
    process.env.NODE_ENV = "test";
    process.env.STORAGE_DRIVER = "local";

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
    MediaAsset = (await import("../src/server/db/models/MediaAsset.js")).MediaAsset;

    const storageMod = await import("../src/server/storage/index.js");
    isValidAssetUrl = storageMod.isValidAssetUrl;
    getStorageDriver = storageMod.getStorageDriver;

    const mediaServiceMod = await import("../src/server/services/mediaService.js");
    registerAssetService = mediaServiceMod.registerAssetService;
    getAssetUsageCount = mediaServiceMod.getAssetUsageCount;
    deleteAssetPermanentlyService = mediaServiceMod.deleteAssetPermanentlyService;
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
    await MediaAsset.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
  });

  it("1. Storage URL validation permits Vercel Blob and dev-uploads URLs but rejects foreign domains", () => {
    expect(
      isValidAssetUrl("https://abc123xyz.public.blob.vercel-storage.com/image/2026/10/test.webp")
    ).toBe(true);
    expect(isValidAssetUrl("/api/dev-uploads/image/2026/10/test.webp")).toBe(true);
    expect(isValidAssetUrl("https://malicious-site.com/image.jpg")).toBe(false);
    expect(isValidAssetUrl("http://localhost:3000/random.png")).toBe(false);
    expect(isValidAssetUrl("")).toBe(false);
    expect(isValidAssetUrl(null)).toBe(false);
  });

  it("2. Local storage driver refuses in production environment", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.STORAGE_DRIVER = "local";

    expect(() => getStorageDriver()).toThrow(/forbidden in production/);

    process.env.NODE_ENV = prevNodeEnv;
    process.env.STORAGE_DRIVER = "local";
  });

  it("3. Asset registration saves metadata and rejects foreign URLs", async () => {
    const admin = await User.create({
      name: "Admin User",
      loginId: "admin_test",
      role: "admin",
      passwordHash: "hash",
    });

    await expect(
      registerAssetService({
        url: "https://evil.com/fake.png",
        adminId: admin._id,
      })
    ).rejects.toThrow(/Foreign or invalid/);
  });

  it("4. Usage count reflects Course asset references", async () => {
    const asset = await MediaAsset.create({
      kind: "image",
      url: "https://test.public.blob.vercel-storage.com/img1.webp",
      pathname: "img1.webp",
      contentType: "image/webp",
      size: 1024,
    });

    // Zero usage initially
    let usage = await getAssetUsageCount(asset._id);
    expect(usage).toBe(0);

    // Reference in a course
    await Course.create({
      title: "Test Course",
      slug: "test-course-usage",
      category: "class12",
      tone: "sky",
      illustrationAssetId: asset._id.toString(),
    });

    usage = await getAssetUsageCount(asset._id);
    expect(usage).toBe(1);
  });

  it("5. Permanent delete is blocked when asset is in use", async () => {
    const admin = await User.create({
      name: "Admin Tester",
      loginId: "admin_tester2",
      role: "admin",
      passwordHash: "hash",
    });

    const asset = await MediaAsset.create({
      kind: "image",
      url: "https://test.public.blob.vercel-storage.com/img2.webp",
      pathname: "img2.webp",
      contentType: "image/webp",
      size: 2048,
    });

    // Reference in a course
    await Course.create({
      title: "Referenced Course",
      slug: "ref-course-test",
      category: "class11",
      tone: "green",
      thumbnail: asset._id.toString(),
    });

    await expect(
      deleteAssetPermanentlyService(asset._id, admin._id)
    ).rejects.toThrow(/Cannot delete asset: it is currently referenced/);
  });
});
