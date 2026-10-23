import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

async function seedDemo() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const {
    User,
    Course,
    Lecture,
    Enrollment,
    Progress,
    Announcement,
    Test,
    TestResult,
    Device,
    DeviceRequest,
    Settings,
  } = await import("../src/server/db/models/index.js");

  console.log("Seeding demo data matching reference visual designs...");

  // 1. Settings
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();
  settings.workspaceName = "Ronak Sir Workspace";
  settings.whatsappNumber = "+91 98100 00000";
  settings.defaultDeviceLimit = 1;
  settings.watermarkEnabled = true;
  settings.rewardTargetText = "₹5,100 Cash Reward Target";
  await settings.save();

  // 2. Admin User
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  let admin = await User.findOne({ loginId: "admin" });
  if (!admin) {
    admin = await User.create({
      role: "admin",
      loginId: "admin",
      name: "Ronak Sir",
      passwordHash: adminPasswordHash,
      status: "active",
      deviceLimit: 3,
      deviceCount: 0,
    });
  } else {
    admin.name = "Ronak Sir";
    admin.passwordHash = adminPasswordHash;
    await admin.save();
  }

  // 3. Demo Students
  const defaultPwdHash = await bcrypt.hash("password123", 10);

  // Tanvi Agarwal (Student reference)
  const tanvi = await User.findOneAndUpdate(
    { studentCode: "RD-2026-001" },
    {
      role: "student",
      loginId: "tanvi.agarwal",
      studentCode: "RD-2026-001",
      name: "Tanvi Agarwal",
      className: "12",
      school: "DPS R.K. Puram",
      phone: "9810012345",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
    },
    { upsert: true, returnDocument: "after" }
  );


  // Approved device for Tanvi
  await Device.deleteMany({ userId: tanvi._id });
  await Device.create({
    userId: tanvi._id,
    deviceId: "tanvi_laptop_chrome",
    label: "Windows 11 (Chrome)",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ip: "127.0.0.1",
    approvedBy: "auto",
    lastUsedAt: new Date(),
  });


  // Students for Pending Device Requests (Admin reference)
  const vardaan = await User.findOneAndUpdate(
    { loginId: "vardaan.agarwal" },
    {
      role: "student",
      loginId: "vardaan.agarwal",
      studentCode: "RD-2025-042",
      name: "Vardaan Agarwal",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
    },
    { upsert: true, returnDocument: "after" }
  );

  const kunal = await User.findOneAndUpdate(
    { loginId: "kunal.sethi" },
    {
      role: "student",
      loginId: "kunal.sethi",
      studentCode: "RD-2025-018",
      name: "Kunal Sethi",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
    },
    { upsert: true, returnDocument: "after" }
  );

  const aditi = await User.findOneAndUpdate(
    { loginId: "aditi.prakash" },
    {
      role: "student",
      loginId: "aditi.prakash",
      studentCode: "RD-2025-019",
      name: "Aditi Prakash",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
    },
    { upsert: true, returnDocument: "after" }
  );

  // 4. Seed Course
  let course = await Course.findOne({ slug: "class-12-accountancy" });
  if (!course) {
    course = await Course.create({
      title: "Class 12 Comprehensive Accountancy (Full Syllabus)",
      slug: "class-12-accountancy",
      description: "Full CBSE board curriculum covering Partnership, Company Accounts, and Financial Analysis.",
      published: true,
      order: 1,
    });
  }

  // 5. Seed 6 Lectures
  await Lecture.deleteMany({ courseId: course._id });
  const lecturesData = [
    {
      title: "Admission of a Partner: Hidden Goodwill & Capital Adjustments",
      section: "Book 1: Partnership",
      order: 1,
      vimeoId: "76979871",
      durationSec: 2520, // 42 mins
      description: "Step by step calculation of hidden goodwill and re-capitalization.",
      published: true,
      isPreview: false,
    },
    {
      title: "Accounting for Share Capital: Pro-rata & Forfeiture Masterclass",
      section: "Book 2: Company Accounts",
      order: 2,
      vimeoId: "76979871",
      durationSec: 3600, // 60 mins
      description: "Handling oversubscription and forfeiture entries.",
      published: true,
      isPreview: true,
    },
    {
      title: "Cash Flow Statement: Operating Activities Direct & Indirect",
      section: "Book 3: Financial Statements",
      order: 3,
      vimeoId: "76979871",
      durationSec: 3000,
      description: "Adjustments for non-cash expenses and working capital changes.",
      published: true,
      isPreview: false,
    },
    {
      title: "Issue of Debentures: Terms of Redemption & Loss on Issue",
      section: "Book 2: Company Accounts",
      order: 4,
      vimeoId: "76979871",
      durationSec: 2700,
      description: "Writing off discount on issue of debentures.",
      published: true,
      isPreview: false,
    },
    {
      title: "Dissolution of a Partnership Firm: Realisation Account & Loan Settlement",
      section: "Book 1: Partnership",
      order: 5,
      vimeoId: "76979871",
      durationSec: 3300,
      description: "Preparation of Realisation A/c and Partner Loan Accounts.",
      published: true,
      isPreview: false,
    },
    {
      title: "Retirement of a Partner: Gain Ratio and Treatment of Reserve Funds",
      section: "Book 1: Partnership",
      order: 6,
      vimeoId: "76979871",
      durationSec: 2880,
      description: "Gaining ratio determination and settlement of retiring partner's dues.",
      published: true,
      isPreview: false,
    },
  ];

  const createdLectures = await Lecture.insertMany(
    lecturesData.map((l) => ({ ...l, courseId: course._id }))
  );

  // 6. Enroll Tanvi
  await Enrollment.deleteMany({ userId: tanvi._id });
  await Enrollment.create({
    userId: tanvi._id,
    courseId: course._id,
    status: "active",
    startsAt: new Date("2025-04-01"),
    expiresAt: new Date("2026-03-31T23:59:59.000Z"),
    paymentNote: {
      amount: "18000",
      mode: "WhatsApp UPI",
      remark: "Comprehensive tuition bundle",
    },
  });

  // 7. Progress for Tanvi
  await Progress.deleteMany({ userId: tanvi._id });
  // Resume lecture (Lecture 1 at 28 mins / 42 mins = 66%)
  await Progress.create({
    userId: tanvi._id,
    courseId: course._id,
    lectureId: createdLectures[0]._id,
    positionSec: 1680, // 28 mins
    durationSec: 2520, // 42 mins
    percent: 66,
    completed: false,
    bookmarked: true,
  });

  // 8. One Announcement
  await Announcement.deleteMany({ title: "Sunday Mock Test #15 Schedule" });
  await Announcement.create({
    title: "Sunday Mock Test #15 Schedule",
    body: "Reporting time 9:00 AM sharp at Sector 9 Centre. Syllabus: Accounting for Share Capital (Pro-rata & Forfeiture). Carry original calculator & stationery.",
    audience: { all: true, courseIds: [] },
    startsAt: new Date(Date.now() - 3600000),
    active: true,
    dismissible: true,
  });

  // 9. One Upcoming Test
  await Test.deleteMany({ title: "Sunday Mock Test #15 (Pre-Board Series)" });
  const upcomingTest = await Test.create({
    title: "Sunday Mock Test #15 (Pre-Board Series)",
    kind: "Sunday Mock",
    startsAt: new Date(Date.now() + 86400000 * 2), // 2 days in future
    durationMin: 180,
    syllabus: "Accounting for Share Capital (Pro-rata & Forfeiture)",
    venue: "RD Classes, Sector 9 Centre",
    className: "12",
    courseId: course._id,
    published: true,
  });

  // 10. Two Test Results
  const pastTest1 = await Test.findOneAndUpdate(
    { title: "Sunday Mock Test #13" },
    {
      title: "Sunday Mock Test #13",
      kind: "Sunday Mock",
      startsAt: new Date(Date.now() - 86400000 * 14),
      durationMin: 180,
      published: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  const pastTest2 = await Test.findOneAndUpdate(
    { title: "Sunday Mock Test #14" },
    {
      title: "Sunday Mock Test #14",
      kind: "Sunday Mock",
      startsAt: new Date(Date.now() - 86400000 * 7),
      durationMin: 180,
      published: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  await TestResult.deleteMany({ userId: tanvi._id });
  await TestResult.create([
    { testId: pastTest1._id, userId: tanvi._id, score: 94, maxScore: 100 },
    { testId: pastTest2._id, userId: tanvi._id, score: 95, maxScore: 100 },
  ]);

  // 11. Two Device Requests for Admin
  await DeviceRequest.deleteMany({
    userId: { $in: [vardaan._id, kunal._id, aditi._id] },
  });

  await DeviceRequest.create([
    {
      userId: vardaan._id,
      deviceId: "dev_vardaan_iphone",
      label: "iPhone 15 (Mobile Safari)",
      studentNote: "Wants to revise lectures on mobile while traveling.",
      status: "pending",
      requestedAt: new Date(Date.now() - 7200000), // 2h ago
    },
    {
      userId: kunal._id,
      deviceId: "dev_kunal_tab",
      label: "Samsung Galaxy Tab (Android Chrome)",
      studentNote: "New tablet purchased for digital formula charts.",
      status: "pending",
      requestedAt: new Date(Date.now() - 86400000), // yesterday
    },
    {
      userId: aditi._id,
      deviceId: "dev_aditi_mac",
      label: "MacBook Air (macOS Chrome)",
      studentNote: "Needs access for Sunday mock test.",
      status: "pending",
      requestedAt: new Date(Date.now() - 86400000 * 5),
    },
  ]);


  console.log("Demo seed successfully created!");
  console.log("Admin credentials: loginId='admin', password='password123'");
  console.log("Student credentials: loginId='tanvi.agarwal', password='password123'");
  await mongoose.disconnect();
}

async function runWithRetry(retries = 3) {

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await seedDemo();
      return;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      try {
        await mongoose.disconnect();
      } catch {}
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

runWithRetry().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

