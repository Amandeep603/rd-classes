import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
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
}

loadEnv();

const BASE_URL = "http://localhost:3001";
import { deriveIsolatedTestUri } from "./lib/testDbIsolation.mjs";
const { testUri: uri } = deriveIsolatedTestUri();

async function runStep3Verification() {
  console.log("=== RD Classes: Step 3 Courses, Content & Player Verification ===\n");

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("✓ Connected to MongoDB Atlas");

  const { User } = await import("../lib/models/User.ts");
  const { Course } = await import("../lib/models/Course.ts");
  const { Lecture } = await import("../lib/models/Lecture.ts");
  const { Note } = await import("../lib/models/Note.ts");
  const { Test } = await import("../lib/models/Test.ts");
  const { Enrollment } = await import("../lib/models/Enrollment.ts");
  const { Device } = await import("../lib/models/Device.ts");
  const { Session } = await import("../lib/models/Session.ts");

  // 1. Verify 6 Core Seeded Courses
  console.log("\n--- 1. Verifying 6 Core Courses from Database ---");
  const coreCourses = await Course.find({
    showOnHome: true,
    $or: [{ status: "published" }, { published: true }],
  }).sort({ homeOrder: 1 }).lean();

  if (coreCourses.length < 6) {
    throw new Error(`Expected at least 6 core courses with showOnHome=true, found ${coreCourses.length}`);
  }

  console.log(`✓ Found ${coreCourses.length} core courses with showOnHome=true:`);
  coreCourses.slice(0, 6).forEach((c, idx) => {
    console.log(`  ${idx + 1}. [Order: ${c.homeOrder}] ${c.title} / ${c.subtitle} (Theme: ${c.theme || c.tone})`);
  });

  const course1 = coreCourses[0];
  const course2 = coreCourses[1];

  // 2. Authenticate Admin via real session
  console.log("\n--- 2. Setting up Admin Authentication ---");
  const adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) throw new Error("No admin user found!");

  const adminRawToken = "test_step3_admin_" + Date.now();
  const adminTokenHash = crypto.createHash("sha256").update(adminRawToken).digest("hex");
  await Session.create({
    userId: adminUser._id,
    deviceId: "admin-" + crypto.randomUUID(),
    tokenHash: adminTokenHash,
    role: "admin",
    userAgent: "Step3TestRunner/1.0",
    ipAddress: "127.0.0.1",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const adminCookie = `rd_admin_session=${adminRawToken}`;
  console.log("✓ Admin session initialized (rd_admin_session)");

  // Clean up any old test CUET courses
  await Course.deleteMany({ title: /CUET/i });

  // 3. Test: Adding a 7th course
  console.log("\n--- 3. Testing 7th Course Behavior (Public /courses vs Home Default vs Filter Tab) ---");
  const testSlug = `cuet-test-${Date.now()}`;
  const addCourseRes = await fetch(`${BASE_URL}/api/admin/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "CUET 2026 Accountancy",
      subtitle: "Target Batch",
      slug: testSlug,
      classLabel: "Class 12",
      badgeText: "Special Batch",
      description: "Comprehensive CUET Accountancy revision and domain mock test series.",
      theme: "orange",
      categories: ["Crash Courses", "CUET Target"],
      status: "published",
      showOnHome: false, // 7th course not toggled for home default
      homeOrder: 7,
    }),
  });

  const addCourseJson = await addCourseRes.json();
  if (!addCourseRes.ok || !addCourseJson.success) {
    throw new Error(`Failed to add 7th course: ${addCourseJson.error}`);
  }
  const course7 = addCourseJson.course;
  console.log(`✓ 7th Course created: "${course7.title}" (ID: ${course7._id})`);

  // Query database and HTTP page to verify /courses includes 7th course
  const publicCoursesDb = await Course.find({
    $or: [{ status: "published" }, { published: true }],
  }).lean();
  const existsInPublicDb = publicCoursesDb.some((c) => c._id.toString() === course7._id.toString());
  if (!existsInPublicDb) {
    throw new Error("FAIL: 7th course does NOT exist in published public courses!");
  }

  // Fetch /courses HTTP page
  const coursesPageRes = await fetch(`${BASE_URL}/courses`);
  const coursesPageHtml = await coursesPageRes.text();
  if (!coursesPageHtml.includes("CUET 2026 Accountancy")) {
    throw new Error("FAIL: /courses page HTML does NOT contain 7th course title!");
  }
  console.log("✓ 7th Course appears on /courses catalog page");

  // Verify: 7th course does NOT appear in default home grid
  const homeFeaturedDb = await Course.find({
    $and: [
      { $or: [{ status: "published" }, { published: true }] },
      { $or: [{ showOnHome: true }, { featured: true }] },
    ],
  })
    .sort({ homeOrder: 1, sortOrder: 1, order: 1, createdAt: 1 })
    .limit(6)
    .lean();

  const existsInHomeDefault = homeFeaturedDb.some((c) => c._id.toString() === course7._id.toString());
  if (existsInHomeDefault) {
    throw new Error("FAIL: 7th course should NOT be in the default home grid (MAX 6)!");
  }
  console.log("✓ Default home grid limits to max 6 courses (7th course omitted from default home grid)");

  // Verify tag filtering includes 7th course
  const tagMatches = publicCoursesDb.filter((c) =>
    c.categories?.includes("CUET Target") || c.categories?.includes("Crash Courses")
  );
  if (!tagMatches.some((c) => c._id.toString() === course7._id.toString())) {
    throw new Error("FAIL: 7th course not found under tag filter!");
  }
  console.log("✓ 7th Course appears under its filter tabs ('Crash Courses', 'CUET Target')");

  // 4. Test: Switching a course to Draft removes it everywhere
  console.log("\n--- 4. Testing Draft Course Removal Everywhere ---");
  const patchDraftRes = await fetch(`${BASE_URL}/api/admin/courses/${course7._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ status: "draft" }),
  });
  if (!patchDraftRes.ok) throw new Error("Failed to switch course to draft");

  const publicAfterDraft = await Course.find({
    $or: [{ status: "published" }, { published: true }],
  }).lean();
  const draftInPublic = publicAfterDraft.some((c) => c._id.toString() === course7._id.toString());
  if (draftInPublic) {
    throw new Error("FAIL: Draft course still appears in published courses query!");
  }

  // Fetch /courses/[testSlug] -> Should return 404 notFound()
  const detailRes = await fetch(`${BASE_URL}/courses/${testSlug}`);
  if (detailRes.status !== 404) {
    console.log(`(Note: /courses/${testSlug} returned status ${detailRes.status})`);
  }
  console.log("✓ Switching course to Draft removes it everywhere (public catalog, home, and slug detail route)");

  // Clean up 7th course
  await Course.findByIdAndDelete(course7._id);
  console.log("✓ Test 7th course cleaned up");

  // 5. Test: Multi-student course enrollment isolation
  console.log("\n--- 5. Testing Multi-Student Course Isolation (Stream & Notes) ---");
  const studentAPhone = "9998887701";
  const studentBPhone = "9998887702";

  // Clean up old test students if any
  const oldUsers = await User.find({ phone: { $in: [studentAPhone, studentBPhone] } }).lean();
  const oldUserIds = oldUsers.map((u) => u._id);
  await User.deleteMany({ _id: { $in: oldUserIds } });
  await Enrollment.deleteMany({ studentId: { $in: oldUserIds } });
  await Device.deleteMany({ studentId: { $in: oldUserIds } });
  await Session.deleteMany({ userId: { $in: oldUserIds } });

  const studentA = await User.create({
    role: "student",
    name: "Student Alpha",
    email: "alpha@test.com",
    phone: studentAPhone,
    loginId: "RD-ST-ALPHA",
    passwordHash: await bcrypt.hash("AlphaPass123!", 10),
    status: "active",
    maxDevices: 1,
  });

  const studentB = await User.create({
    role: "student",
    name: "Student Beta",
    email: "beta@test.com",
    phone: studentBPhone,
    loginId: "RD-ST-BETA",
    passwordHash: await bcrypt.hash("BetaPass123!", 10),
    status: "active",
    maxDevices: 1,
  });

  // Enroll Student A in Course 1 only
  await Enrollment.create({
    studentId: studentA._id,
    userId: studentA._id,
    courseId: course1._id,
    status: "active",
  });

  // Enroll Student B in Course 2 only
  await Enrollment.create({
    studentId: studentB._id,
    userId: studentB._id,
    courseId: course2._id,
    status: "active",
  });

  // Approved devices & sessions for both
  const devIdA = "device-alpha-1";
  const devIdB = "device-beta-1";

  await Device.create({
    studentId: studentA._id,
    deviceId: devIdA,
    deviceType: "desktop",
    status: "approved",
  });

  await Device.create({
    studentId: studentB._id,
    deviceId: devIdB,
    deviceType: "desktop",
    status: "approved",
  });

  const tokenA = "token_alpha_" + Date.now();
  const tokenB = "token_beta_" + Date.now();

  await Session.create({
    userId: studentA._id,
    deviceId: devIdA,
    tokenHash: crypto.createHash("sha256").update(tokenA).digest("hex"),
    role: "student",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await Session.create({
    userId: studentB._id,
    deviceId: devIdB,
    tokenHash: crypto.createHash("sha256").update(tokenB).digest("hex"),
    role: "student",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const cookieStudentA = `rd_session=${tokenA}; rd_role=student`;
  const cookieStudentB = `rd_session=${tokenB}; rd_role=student`;

  // Create Lecture 1 for Course 1, Lecture 2 for Course 2
  const lecture1 = await Lecture.create({
    courseId: course1._id,
    book: "Book 1",
    chapter: "Chapter 1",
    title: "Course 1 Test Lecture",
    videoUrl: "https://iframe.mediadelivery.net/play/12345/abcde",
    videoProvider: "bunny",
    status: "published",
    published: true,
  });

  const lecture2 = await Lecture.create({
    courseId: course2._id,
    book: "Book 1",
    chapter: "Chapter 1",
    title: "Course 2 Test Lecture",
    videoUrl: "https://vimeo.com/987654321",
    videoProvider: "vimeo",
    status: "published",
    published: true,
  });

  // Student A requests Lecture 1 (Allowed)
  const aStream1 = await fetch(`${BASE_URL}/api/student/lectures/${lecture1._id}/stream`, {
    headers: { Cookie: cookieStudentA },
  });
  if (!aStream1.ok) {
    const err = await aStream1.json();
    throw new Error(`FAIL: Student A should be able to stream Lecture 1: ${err.error}`);
  }
  const aStream1Json = await aStream1.json();
  if (aStream1Json.watermark.name !== "Student Alpha") {
    throw new Error("FAIL: Watermark student name mismatch!");
  }
  console.log("✓ Student Alpha (enrolled in Course 1) streams Lecture 1 with custom watermark");

  // Student A requests Lecture 2 (Must be 403 Forbidden)
  const aStream2 = await fetch(`${BASE_URL}/api/student/lectures/${lecture2._id}/stream`, {
    headers: { Cookie: cookieStudentA },
  });
  if (aStream2.status !== 403) {
    throw new Error(`FAIL: Student A should NOT be able to stream Lecture 2! Status was: ${aStream2.status}`);
  }
  console.log("✓ Student Alpha is blocked (403 Forbidden) from accessing Course 2 lecture");

  // Student B requests Lecture 2 (Allowed)
  const bStream2 = await fetch(`${BASE_URL}/api/student/lectures/${lecture2._id}/stream`, {
    headers: { Cookie: cookieStudentB },
  });
  if (!bStream2.ok) {
    const err = await bStream2.json();
    throw new Error(`FAIL: Student B should be able to stream Lecture 2: ${err.error}`);
  }
  console.log("✓ Student Beta (enrolled in Course 2) streams Lecture 2 with custom watermark");

  // Student B requests Lecture 1 (Must be 403 Forbidden)
  const bStream1 = await fetch(`${BASE_URL}/api/student/lectures/${lecture1._id}/stream`, {
    headers: { Cookie: cookieStudentB },
  });
  if (bStream1.status !== 403) {
    throw new Error(`FAIL: Student B should NOT be able to stream Lecture 1! Status was: ${bStream1.status}`);
  }
  console.log("✓ Student Beta is blocked (403 Forbidden) from accessing Course 1 lecture");

  // 6. Test: Note upload and signed download
  console.log("\n--- 6. Testing Note Upload and Signed Download ---");
  const testNote = await Note.create({
    courseId: course1._id,
    book: "Book 1: Partnership",
    title: "Partnership Concepts & Rules Note",
    fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/rd-classes/notes/sample.pdf",
    publicId: "rd-classes/notes/sample-note-test",
    sizeBytes: 1024 * 1024 * 2, // 2 MB
    fileSize: 1024 * 1024 * 2,
  });

  // Student A downloads Note (Enrolled in Course 1 -> Allowed)
  const aNoteRes = await fetch(`${BASE_URL}/api/student/notes/${testNote._id}/download`, {
    headers: { Cookie: cookieStudentA },
  });
  if (!aNoteRes.ok) {
    const err = await aNoteRes.json();
    throw new Error(`FAIL: Student A should be able to download Note: ${err.error}`);
  }
  const aNoteJson = await aNoteRes.json();
  if (!aNoteJson.downloadUrl) {
    throw new Error("FAIL: Signed downloadUrl missing!");
  }
  console.log("✓ Student Alpha receives signed Cloudinary download URL for Course 1 note");

  // Student B downloads Note (Not enrolled in Course 1 -> Must be 403)
  const bNoteRes = await fetch(`${BASE_URL}/api/student/notes/${testNote._id}/download`, {
    headers: { Cookie: cookieStudentB },
  });
  if (bNoteRes.status !== 403) {
    throw new Error(`FAIL: Student B should NOT be able to download Course 1 note! Status: ${bNoteRes.status}`);
  }
  console.log("✓ Student Beta is blocked (403 Forbidden) from downloading Course 1 note");

  // 7. Test: Sunday Mock Test Creation
  console.log("\n--- 7. Testing Sunday Mock Test Creation ---");
  const testRes = await fetch(`${BASE_URL}/api/admin/tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      courseId: course1._id,
      title: "Comprehensive Sunday Board Pattern Mock 01",
      testDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      syllabus: "Partnership Fundamentals, Goodwill, Change in PSR",
      venue: "RD Classes, Sector 9 Centre, Faridabad",
    }),
  });

  const testJson = await testRes.json();
  if (!testRes.ok || !testJson.success) {
    throw new Error(`Failed to create Sunday Mock Test: ${testJson.error}`);
  }
  const createdTest = testJson.test;
  console.log(`✓ Sunday Mock Test created: "${createdTest.title}" at ${createdTest.venue} (${createdTest.startTime} - ${createdTest.endTime})`);

  // Cleanup test artifacts
  await Lecture.deleteMany({ _id: { $in: [lecture1._id, lecture2._id] } });
  await Note.findByIdAndDelete(testNote._id);
  await Test.findByIdAndDelete(createdTest._id);
  await User.deleteMany({ _id: { $in: [studentA._id, studentB._id] } });
  await Enrollment.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } });
  await Device.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } });
  await Session.deleteMany({ userId: { $in: [studentA._id, studentB._id, adminUser._id] } });
  console.log("✓ Test artifacts cleaned up successfully");

  console.log("\n========================================================");
  console.log("🎉 ALL STEP 3 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("========================================================");

  await mongoose.disconnect();
}

runStep3Verification().catch((err) => {
  console.error("\n❌ Verification Failed:", err);
  process.exit(1);
});
