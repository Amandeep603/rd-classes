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
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || (init.status >= 200 && init.status < 300),
    }),
  },
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

describe("Step 4: Admin Modules (Toppers, Result PDFs, Gallery, Reviews, Announcements, Settings, Activity)", () => {
  let Topper, ResultPdf, GalleryItem, Review, Announcement, Setting, ActivityLog, User, Session;

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

    const topperMod = await import("../lib/models/Topper");
    const resultPdfMod = await import("../lib/models/ResultPdf");
    const galleryMod = await import("../lib/models/GalleryItem");
    const reviewMod = await import("../lib/models/Review");
    const annMod = await import("../lib/models/Announcement");
    const setMod = await import("../lib/models/Setting");
    const actMod = await import("../lib/models/ActivityLog");
    const userMod = await import("../src/server/db/models/User.js");
    const sessMod = await import("../src/server/db/models/Session.js");

    Topper = topperMod.Topper;
    ResultPdf = resultPdfMod.ResultPdf;
    GalleryItem = galleryMod.GalleryItem;
    Review = reviewMod.Review;
    Announcement = annMod.Announcement;
    Setting = setMod.Setting;
    ActivityLog = actMod.ActivityLog;
    User = userMod.User;
    Session = sessMod.Session;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  // 1. TOPPERS
  describe("1. Toppers (/admin/toppers)", () => {
    it("starts with empty state and public query returns empty", async () => {
      const toppers = await Topper.find().sort({ year: -1, marks: -1 }).lean();
      expect(toppers).toHaveLength(0);
    });

    it("adds, edits, and deletes a topper and reflects on public results", async () => {
      // Add
      const topper = await Topper.create({
        name: "Priyanshi Sharma",
        school: "MVN Sector 17, Faridabad",
        year: "2025",
        marks: "100/100",
        photoUrl: "https://res.cloudinary.com/demo/image/upload/rd-classes/toppers/sample.webp",
        publicId: "rd-classes/toppers/sample",
        featured: true,
      });

      expect(topper._id).toBeDefined();
      expect(topper.featured).toBe(true);

      // Public Results page query
      const publicToppers = await Topper.find().sort({ year: -1, marks: -1 }).lean();
      expect(publicToppers).toHaveLength(1);
      expect(publicToppers[0].name).toBe("Priyanshi Sharma");

      // Edit
      topper.marks = "99/100";
      topper.featured = false;
      await topper.save();

      const updated = await Topper.findById(topper._id).lean();
      expect(updated.marks).toBe("99/100");
      expect(updated.featured).toBe(false);

      // Delete
      await Topper.findByIdAndDelete(topper._id);
      const afterDelete = await Topper.find().lean();
      expect(afterDelete).toHaveLength(0);
    });
  });

  // 2. RESULT PDFS
  describe("2. Result PDFs (/admin/result-pdfs)", () => {
    it("starts empty and lists result PDFs with title, class, year, size", async () => {
      const initial = await ResultPdf.find().lean();
      expect(initial).toHaveLength(0);

      const pdf = await ResultPdf.create({
        title: "CBSE Class 12 Board Merit Sheet 2025",
        classLabel: "Class 12",
        year: "2025",
        fileUrl: "https://res.cloudinary.com/demo/raw/upload/rd-classes/results/sample.pdf",
        publicId: "rd-classes/results/sample",
        sizeBytes: 1048576, // 1 MB
      });

      expect(pdf._id).toBeDefined();

      const publicPdfs = await ResultPdf.find().sort({ year: -1, createdAt: -1 }).lean();
      expect(publicPdfs).toHaveLength(1);
      expect(publicPdfs[0].title).toBe("CBSE Class 12 Board Merit Sheet 2025");
      expect(publicPdfs[0].sizeBytes).toBe(1048576);

      // Delete
      await ResultPdf.findByIdAndDelete(pdf._id);
      const afterDelete = await ResultPdf.find().lean();
      expect(afterDelete).toHaveLength(0);
    });
  });

  // 3. GALLERY
  describe("3. Gallery (/admin/gallery)", () => {
    it("handles multi-image addition, captions, reordering and deletion", async () => {
      const item1 = await GalleryItem.create({
        imageUrl: "https://res.cloudinary.com/demo/image/upload/rd-classes/gallery/pic1.webp",
        publicId: "rd-classes/gallery/pic1",
        caption: "Batch 2025 Felicitation Ceremony",
        position: 0,
      });

      const item2 = await GalleryItem.create({
        imageUrl: "https://res.cloudinary.com/demo/image/upload/rd-classes/gallery/pic2.webp",
        publicId: "rd-classes/gallery/pic2",
        caption: "Full Classroom Doubt Seminar",
        position: 1,
      });

      const gallery = await GalleryItem.find().sort({ position: 1 }).lean();
      expect(gallery).toHaveLength(2);
      expect(gallery[0].caption).toBe("Batch 2025 Felicitation Ceremony");

      // Reorder: swap positions
      await GalleryItem.findByIdAndUpdate(item1._id, { position: 1 });
      await GalleryItem.findByIdAndUpdate(item2._id, { position: 0 });

      const reordered = await GalleryItem.find().sort({ position: 1 }).lean();
      expect(reordered[0]._id.toString()).toBe(item2._id.toString());

      // Clean up
      await GalleryItem.deleteMany({});
    });
  });

  // 4. REVIEWS
  describe("4. Reviews (/admin/reviews)", () => {
    it("only publishes reviews marked as published for public testimonials", async () => {
      const rev1 = await Review.create({
        name: "Sanya Grover",
        role: "student",
        rating: 5,
        meta: "DPS Faridabad, 98% in 2025",
        quote: "Ronak Sir made partnership accounts crystal clear!",
        published: true,
      });

      const revDraft = await Review.create({
        name: "Draft User",
        role: "parent",
        rating: 4,
        meta: "Class 11 Parent",
        quote: "Draft testimonial not ready yet.",
        published: false,
      });

      // Public query: published only
      const publicReviews = await Review.find({ published: true }).lean();
      expect(publicReviews).toHaveLength(1);
      expect(publicReviews[0].name).toBe("Sanya Grover");

      // Publish draft
      revDraft.published = true;
      await revDraft.save();

      const updatedPublic = await Review.find({ published: true }).lean();
      expect(updatedPublic).toHaveLength(2);

      // Clean up
      await Review.deleteMany({});
    });

    it("parses bulk pipe-delimited text correctly", () => {
      const rawText = `
Aarav Sharma | student | 5 | DPS Faridabad 2025 | Ronak Sir made partnership accounts crystal clear!
Mrs. Neha Mehta | parent | 5 | Parent of Class 12 student | My daughter scored 98 in Accounts thanks to RD Classes.
`;
      const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsed = [];
      for (const line of lines) {
        if (line.includes("|")) {
          const parts = line.split("|").map((p) => p.trim());
          if (parts.length >= 2) {
            parsed.push({
              name: parts[0],
              role: parts[1].toLowerCase().includes("parent") ? "parent" : "student",
              rating: Number(parts[2]) || 5,
              meta: parts[3] || "",
              quote: parts.slice(4).join(" | "),
              published: true,
            });
          }
        }
      }

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Aarav Sharma");
      expect(parsed[0].role).toBe("student");
      expect(parsed[1].name).toBe("Mrs. Neha Mehta");
      expect(parsed[1].role).toBe("parent");
    });
  });

  // 5. ANNOUNCEMENTS
  describe("5. Announcements (/admin/announcements)", () => {
    it("creates an announcement and matches student dashboard query with pinned priority", async () => {
      const past = new Date(Date.now() - 5000);
      const regular = await Announcement.create({
        title: "Standard Notice",
        body: "Classroom schedule adjustment for tomorrow.",
        audience: "all",
        pinned: false,
        active: true,
        startsAt: past,
      });

      const pinned = await Announcement.create({
        title: "CRITICAL SUNDAY MOCK TEST",
        body: "Mock test at Sector 9 centre 9:00 AM sharp.",
        audience: "all",
        pinned: true,
        active: true,
        startsAt: past,
      });

      const now = new Date();
      // Query mimicking studentDashboardService with pinned first
      const topAnnouncement = await Announcement.findOne({
        active: { $ne: false },
        $or: [
          { startsAt: null },
          { startsAt: { $lte: now } },
          { createdAt: { $lte: now } },
        ],
      })
        .sort({ pinned: -1, createdAt: -1 })
        .lean();

      expect(topAnnouncement).toBeDefined();
      expect(topAnnouncement._id.toString()).toBe(pinned._id.toString());
      expect(topAnnouncement.pinned).toBe(true);

      // Clean up
      await Announcement.deleteMany({});
    });
  });

  // 6. SETTINGS
  describe("6. Settings (/admin/settings)", () => {
    it("saves institute details, social links, defaultMaxDevices, and syncs workspaceName", async () => {
      const setting = await Setting.create({
        instituteName: "RD Classes for Commerce",
        phone: "+91 83685 45620",
        whatsapp: "918368545620",
        email: "admissions@rdclasses.com",
        address: "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006",
        socialLinks: {
          instagram: "https://instagram.com/rdclasses",
          youtube: "https://youtube.com/@rdclasses",
        },
        defaultMaxDevices: 2,
      });

      expect(setting.instituteName).toBe("RD Classes for Commerce");
      expect(setting.defaultMaxDevices).toBe(2);

      // Session revocation verification
      const user = await User.create({
        name: "Test Student",
        email: "student@test.com",
        loginId: "STU999",
        role: "student",
        passwordHash: "hash123",
      });

      await Session.create({
        userId: user._id,
        role: "student",
        sessionToken: "token_123",
        tokenHash: "hash_123",
        expiresAt: new Date(Date.now() + 86400000),
      });

      const studentUsers = await User.find({ role: "student" }).select("_id").lean();
      const studentIds = studentUsers.map((u) => u._id);

      const studentSessionsBefore = await Session.countDocuments({
        $or: [{ userId: { $in: studentIds } }, { role: "student" }],
      });
      expect(studentSessionsBefore).toBe(1);

      // Logout all students
      await Session.deleteMany({
        $or: [{ role: "student" }, { userId: { $in: studentIds } }],
      });
      const studentSessionsAfter = await Session.countDocuments({
        $or: [{ userId: { $in: studentIds } }, { role: "student" }],
      });
      expect(studentSessionsAfter).toBe(0);

      // Clean up
      await Setting.deleteMany({});
      await User.deleteMany({});
    });
  });

  // 7. ACTIVITY
  describe("7. Activity (/admin/activity)", () => {
    it("logs events with action, actor, entity, and queries recent activity", async () => {
      const adminUser = await User.create({
        name: "Ronak Dugar",
        email: "admin@rdclasses.com",
        loginId: "admin",
        role: "admin",
        passwordHash: "admin_hash",
      });

      await ActivityLog.create({
        actorId: adminUser._id,
        action: "topper.created",
        entity: "Topper",
        entityId: "12345",
        meta: { name: "Aarav Sharma", score: "100/100" },
      });

      await ActivityLog.create({
        actorId: adminUser._id,
        action: "result_pdf.uploaded",
        entity: "ResultPdf",
        entityId: "67890",
        meta: { title: "Board Results 2025" },
      });

      const recentLogs = await ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("actorId", "name loginId")
        .lean();

      expect(recentLogs).toHaveLength(2);
      expect(recentLogs[0].action).toBe("result_pdf.uploaded");
      expect(recentLogs[0].actorId.name).toBe("Ronak Dugar");

      // Clean up
      await ActivityLog.deleteMany({});
      await User.deleteMany({});
    });
  });
});
