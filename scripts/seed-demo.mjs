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

if (process.env.NODE_ENV === "production") {
  console.error("ERROR: seed:demo is strictly forbidden when NODE_ENV is production.");
  process.exit(1);
}

import { deriveIsolatedTestUri } from "./lib/testDbIsolation.mjs";

const { testUri, testDbName, appDbName } = deriveIsolatedTestUri();

async function seedDemo() {
  console.log(`Connecting to Isolated Test Database: "${testDbName}"...`);
  await mongoose.connect(testUri);

  const dbName = mongoose.connection.name;
  console.log(`Connected database: ${dbName}`);

  if (dbName.toLowerCase() === appDbName.toLowerCase()) {
    console.error(`ERROR: seed:demo refused: database name "${dbName}" is the primary application database.`);
    await mongoose.disconnect();
    process.exit(1);
  }

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

  console.log("Seeding demo data with demo: true...");

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
      demo: true,
    });
  } else {
    admin.name = "Ronak Sir";
    admin.passwordHash = adminPasswordHash;
    admin.demo = true;
    await admin.save();
  }

  // 3. Demo Students
  const defaultPwdHash = await bcrypt.hash("password123", 10);

  const tanvi = await User.findOneAndUpdate(
    { loginId: "tanvi.agarwal" },
    {
      role: "student",
      loginId: "tanvi.agarwal",
      name: "Tanvi Agarwal",
      className: "12",
      school: "DPS R.K. Puram",
      phone: "9810012345",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
      demo: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  // Approved device for Tanvi
  await Device.deleteMany({ userId: tanvi._id });
  await Device.create({
    userId: tanvi._id,
    deviceId: "tanvi_laptop_chrome",
    label: "Windows 11 (Chrome)",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ip: "127.0.0.1",
    approvedBy: "auto",
    lastUsedAt: new Date(),
    demo: true,
  });

  const vardaan = await User.findOneAndUpdate(
    { loginId: "vardaan.agarwal" },
    {
      role: "student",
      loginId: "vardaan.agarwal",
      name: "Vardaan Agarwal",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
      demo: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  const kunal = await User.findOneAndUpdate(
    { loginId: "kunal.sethi" },
    {
      role: "student",
      loginId: "kunal.sethi",
      name: "Kunal Sethi",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
      demo: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  const aditi = await User.findOneAndUpdate(
    { loginId: "aditi.prakash" },
    {
      role: "student",
      loginId: "aditi.prakash",
      name: "Aditi Prakash",
      className: "12",
      passwordHash: defaultPwdHash,
      status: "active",
      deviceLimit: 1,
      deviceCount: 1,
      demo: true,
    },
    { upsert: true, returnDocument: "after" }
  );

  // 4. Seed Course
  let course = await Course.findOne({ slug: "class-12-accountancy" });
  if (!course) {
    course = await Course.create({
      title: "Class 12 Comprehensive Accountancy (Full Syllabus)",
      slug: "class-12-accountancy",
      description:
        "Full CBSE board curriculum covering Partnership, Company Accounts, and Financial Analysis.",
      published: true,
      order: 1,
      demo: true,
    });
  } else {
    course.demo = true;
    await course.save();
  }

  // 5. Seed Lectures
  await Lecture.deleteMany({ courseId: course._id, demo: true });
  const lecturesData = [
    {
      title: "Admission of a Partner: Hidden Goodwill & Capital Adjustments",
      section: "Book 1: Partnership",
      order: 1,
      vimeoId: "76979871",
      durationSec: 2520,
      description: "Step by step calculation of hidden goodwill and re-capitalization.",
      published: true,
      isPreview: false,
      demo: true,
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
      amount: 18000,
      mode: "WhatsApp UPI",
      remark: "Comprehensive tuition bundle",
    },
    demo: true,
  });

  // 7. Progress for Tanvi
  await Progress.deleteMany({ userId: tanvi._id });
  await Progress.create({
    userId: tanvi._id,
    courseId: course._id,
    lectureId: createdLectures[0]._id,
    positionSec: 1680,
    durationSec: 2520,
    percent: 66,
    completed: false,
    bookmarked: true,
    demo: true,
  });

  // 8. Announcement
  await Announcement.deleteMany({ title: "Sunday Mock Test #15 Schedule" });
  await Announcement.create({
    title: "Sunday Mock Test #15 Schedule",
    body: "Reporting time 9:00 AM sharp at Sector 9 Centre.",
    audience: { all: true, courseIds: [] },
    startsAt: new Date(Date.now() - 3600000),
    active: true,
    dismissible: true,
    demo: true,
  });

  // 9. Tests
  const upcomingTest = await Test.create({
    title: "Sunday Mock Test #15 (Pre-Board Series)",
    kind: "Sunday Mock",
    startsAt: new Date(Date.now() + 86400000 * 2),
    durationMin: 180,
    syllabus: "Accounting for Share Capital",
    venue: "RD Classes, Sector 9 Centre",
    className: "12",
    courseId: course._id,
    published: true,
    demo: true,
  });

  // 10. Device Requests
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
      requestedAt: new Date(Date.now() - 7200000),
      demo: true,
    },
    {
      userId: kunal._id,
      deviceId: "dev_kunal_tab",
      label: "Samsung Galaxy Tab (Android Chrome)",
      studentNote: "New tablet purchased for digital formula charts.",
      status: "pending",
      requestedAt: new Date(Date.now() - 86400000),
      demo: true,
    },
  ]);

  console.log("Demo seed successfully created with demo: true!");
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
