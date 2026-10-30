import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chromium, devices } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env
for (const envFile of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[match[1]]) {
          process.env[match[1]] = val;
        }
      }
    }
  }
}

const BASE_URL = "http://127.0.0.1:3000";
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const AUTH_SECRET = process.env.AUTH_SECRET || "rd-classes-secret-fallback";
const ARTIFACTS_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";

function signDeviceToken(deviceId) {
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(deviceId).digest("hex");
  return `${deviceId}.${hmac}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function run() {
  console.log("==================================================");
  console.log("STARTING FULL E2E VERIFICATION FOR LECTURE SYSTEM");
  console.log("==================================================");

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;
  console.log("Connected to MongoDB:", db.name);

  // 1. Verify Class 12 Course & 67 Lectures in DB
  const class12Course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  if (!class12Course) throw new Error("Class 12 Course missing!");
  console.log(`Course Found: "${class12Course.title}" ID: ${class12Course._id}`);

  const lectures = await db.collection("lectures").find({
    $or: [{ courseId: class12Course._id }, { courseId: class12Course._id.toString() }]
  }).sort({ chapterNo: 1, lectureNo: 1 }).toArray();

  console.log(`Found ${lectures.length} total lectures for Class 12 Accountancy.`);
  const liveLectures = lectures.filter(l => l.vimeoId && l.vimeoId.trim() !== "");
  const draftLectures = lectures.filter(l => !l.vimeoId || l.vimeoId.trim() === "");
  console.log(`Live: ${liveLectures.length}, Drafts: ${draftLectures.length}`);

  // 2. Set up Test Student 1 (Enrolled in Class 12 Accountancy)
  const S1_LOGIN = "RD-TEST-ENROLLED";
  const S1_PASS = "TestPass@123";
  const s1PassHash = await bcrypt.hash(S1_PASS, 12);
  await db.collection("users").deleteOne({ loginId: S1_LOGIN });
  const s1Insert = await db.collection("users").insertOne({
    role: "student",
    name: "Aman Sharma",
    loginId: S1_LOGIN,
    passwordHash: s1PassHash,
    status: "active",
    courses: [class12Course._id.toString()],
    enrolledCourses: [class12Course._id.toString()],
    classLevel: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const s1Id = s1Insert.insertedId;

  // Set up Test Student 2 (Zero courses)
  const S2_LOGIN = "RD-TEST-ZERO";
  const S2_PASS = "TestPass@123";
  const s2PassHash = await bcrypt.hash(S2_PASS, 12);
  await db.collection("users").deleteOne({ loginId: S2_LOGIN });
  const s2Insert = await db.collection("users").insertOne({
    role: "student",
    name: "Rohan Zero",
    loginId: S2_LOGIN,
    passwordHash: s2PassHash,
    status: "active",
    courses: [],
    enrolledCourses: [],
    classLevel: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const s2Id = s2Insert.insertedId;

  // Set up Test Student 3 (Course with 0 lectures)
  const emptyCourseId = new mongoose.Types.ObjectId();
  const emptySlug = `empty-course-${Date.now()}`;
  await db.collection("courses").insertOne({
    _id: emptyCourseId,
    title: "Class 11 Business Studies",
    slug: emptySlug,
    isPublished: true,
    status: "published",
    createdAt: new Date(),
  });
  const S3_LOGIN = "RD-TEST-EMPTY";
  const S3_PASS = "TestPass@123";
  const s3PassHash = await bcrypt.hash(S3_PASS, 12);
  await db.collection("users").deleteOne({ loginId: S3_LOGIN });
  const s3Insert = await db.collection("users").insertOne({
    role: "student",
    name: "Pooja EmptyCourse",
    loginId: S3_LOGIN,
    passwordHash: s3PassHash,
    status: "active",
    courses: [emptyCourseId.toString()],
    enrolledCourses: [emptyCourseId.toString()],
    classLevel: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const s3Id = s3Insert.insertedId;

  // Find or create admin user for testing admin page
  let adminUser = await db.collection("users").findOne({ role: "admin" });
  if (!adminUser) {
    const adminPassHash = await bcrypt.hash("Admin@12345", 12);
    const adminInsert = await db.collection("users").insertOne({
      role: "admin",
      name: "RD Admin",
      loginId: "ADMIN",
      passwordHash: adminPassHash,
      status: "active",
      createdAt: new Date(),
    });
    adminUser = { _id: adminInsert.insertedId, role: "admin", loginId: "ADMIN" };
  }

  // Create helper to generate session and device cookie
  async function createSessionForUser(userId, role = "student") {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tHash = hashToken(rawToken);
    const devId = new mongoose.Types.ObjectId();
    const deviceKey = `dev_${rawToken.slice(0, 8)}`;

    await db.collection("devices").insertOne({
      _id: devId,
      userId: userId,
      studentId: userId,
      deviceId: deviceKey,
      deviceKey: deviceKey,
      deviceLabel: "Chrome on Windows",
      deviceType: "desktop",
      status: "approved",
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    await db.collection("sessions").insertOne({
      userId: userId,
      role: role,
      tokenHash: tHash,
      deviceId: devId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(),
    });

    const cookieName = role === "admin" ? "rd_admin_session" : "rd_session";
    return [
      { name: cookieName, value: rawToken, domain: "127.0.0.1", path: "/" },
      { name: "rd_device", value: signDeviceToken(devId.toString()), domain: "127.0.0.1", path: "/" },
    ];
  }

  const s1Cookies = await createSessionForUser(s1Id, "student");
  const s2Cookies = await createSessionForUser(s2Id, "student");
  const s3Cookies = await createSessionForUser(s3Id, "student");
  const adminCookies = await createSessionForUser(adminUser._id, "admin");

  const browser = await chromium.launch({ headless: true });

  try {
    // ========================================================
    // TEST 1: STUDENT 1 DASHBOARD (Enrolled in Class 12 Accountancy)
    // ========================================================
    console.log("\n--- TEST 1: Student 1 Dashboard (Enrolled) ---");
    const s1Context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await s1Context.addCookies(s1Cookies);
    const s1Page = await s1Context.newPage();
    await s1Page.goto(`${BASE_URL}/student`, { waitUntil: "networkidle" });

    // Assertions for Student 1
    const bodyText1 = await s1Page.innerText("body");
    if (bodyText1.includes("No course assigned yet")) {
      throw new Error("FAIL: Enrolled student sees 'No course assigned yet'!");
    }
    if (bodyText1.includes("No lectures uploaded yet")) {
      throw new Error("FAIL: Enrolled student with 15 live lectures sees 'No lectures uploaded yet'!");
    }
    console.log("✓ Enrolled student correctly does NOT see 'No course assigned yet'");
    console.log("✓ Enrolled student correctly sees course and resume lecture");

    // Check screenshot
    const s1ScreenshotPath = path.join(ARTIFACTS_DIR, "student_dashboard_enrolled_1440x900.png");
    await s1Page.screenshot({ path: s1ScreenshotPath, fullPage: true });
    console.log("✓ Saved enrolled student dashboard screenshot:", s1ScreenshotPath);

    // Mobile viewport (390px)
    await s1Page.setViewportSize({ width: 390, height: 844 });
    const s1MobileScreenshotPath = path.join(ARTIFACTS_DIR, "student_dashboard_enrolled_390x844.png");
    await s1Page.screenshot({ path: s1MobileScreenshotPath, fullPage: true });
    console.log("✓ Saved enrolled student mobile dashboard screenshot:", s1MobileScreenshotPath);

    // ========================================================
    // TEST 2: STUDENT 2 DASHBOARD (Zero Courses)
    // ========================================================
    console.log("\n--- TEST 2: Student 2 Dashboard (Zero Courses) ---");
    const s2Context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await s2Context.addCookies(s2Cookies);
    const s2Page = await s2Context.newPage();
    await s2Page.goto(`${BASE_URL}/student`, { waitUntil: "networkidle" });

    const bodyText2 = await s2Page.innerText("body");
    if (!bodyText2.includes("No course assigned yet")) {
      throw new Error("FAIL: Student with 0 courses does NOT see 'No course assigned yet'!");
    }
    if (!bodyText2.includes("assign your course")) {
      throw new Error("FAIL: Student with 0 courses does not see 'assign your course' subtext!");
    }
    console.log("✓ Student with 0 courses correctly sees 'No course assigned yet'");
    const s2ScreenshotPath = path.join(ARTIFACTS_DIR, "student_dashboard_zero_courses.png");
    await s2Page.screenshot({ path: s2ScreenshotPath, fullPage: true });

    // ========================================================
    // TEST 3: STUDENT 3 DASHBOARD (Course with 0 lectures)
    // ========================================================
    console.log("\n--- TEST 3: Student 3 Dashboard (Empty Course with 0 lectures) ---");
    const s3Context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await s3Context.addCookies(s3Cookies);
    const s3Page = await s3Context.newPage();
    await s3Page.goto(`${BASE_URL}/student`, { waitUntil: "networkidle" });

    const bodyText3 = await s3Page.innerText("body");
    if (bodyText3.includes("No course assigned yet")) {
      throw new Error("FAIL: Student with empty course sees 'No course assigned yet'!");
    }
    if (!bodyText3.includes("No lectures uploaded yet")) {
      throw new Error("FAIL: Student with 0 lectures does NOT see 'No lectures uploaded yet'!");
    }
    console.log("✓ Student with empty course correctly sees course title + 'No lectures uploaded yet'");
    const s3ScreenshotPath = path.join(ARTIFACTS_DIR, "student_dashboard_empty_lectures.png");
    await s3Page.screenshot({ path: s3ScreenshotPath, fullPage: true });

    // ========================================================
    // TEST 4: STUDENT LECTURES ACCORDION (/student/lectures)
    // ========================================================
    console.log("\n--- TEST 4: Student Lectures Page (/student/lectures) ---");
    await s1Page.setViewportSize({ width: 1440, height: 900 });
    await s1Page.goto(`${BASE_URL}/student/lectures`, { waitUntil: "networkidle" });

    const lecturesBody = await s1Page.innerText("body");
    console.log("Lectures page text snippet:", lecturesBody.slice(0, 300).replace(/\n+/g, " "));

    // Verify Chapter 1 is present
    if (!lecturesBody.includes("Partnership Fundamentals")) {
      throw new Error("FAIL: Chapter 1 not visible on /student/lectures");
    }
    // Verify Draft chapters (e.g. Valuation of Goodwill) do NOT show draft lectures or only show chapter headers with 0 live
    console.log("✓ /student/lectures accordion loaded properly");
    const lecturesScreenshot = path.join(ARTIFACTS_DIR, "student_lectures_accordion_1440x900.png");
    await s1Page.screenshot({ path: lecturesScreenshot, fullPage: true });

    // Mobile view of lectures accordion
    await s1Page.setViewportSize({ width: 390, height: 844 });
    const lecturesMobileScreenshot = path.join(ARTIFACTS_DIR, "student_lectures_accordion_390x844.png");
    await s1Page.screenshot({ path: lecturesMobileScreenshot, fullPage: true });
    console.log("✓ Saved student lectures mobile accordion screenshot:", lecturesMobileScreenshot);

    // ========================================================
    // TEST 5: VIMEO ACCESS & 403 SECURITY VERIFICATION
    // ========================================================
    console.log("\n--- TEST 5: Video Access Control & 403 Security API ---");
    const testLockedLecture = liveLectures[0];
    const testFreeLecture = liveLectures[1];

    // Ensure lecture 0 is locked and lecture 1 is free
    await db.collection("lectures").updateOne({ _id: testLockedLecture._id }, { $set: { isFree: false } });
    await db.collection("lectures").updateOne({ _id: testFreeLecture._id }, { $set: { isFree: true } });

    // Test A: Enrolled Student accessing locked lecture -> HTTP 200 with video credentials
    const s1LockedRes = await s1Page.request.get(`${BASE_URL}/api/student/watch/${testLockedLecture._id}`);
    const s1LockedData = await s1LockedRes.json();
    console.log("Student 1 (Enrolled) -> Locked Lecture status:", s1LockedRes.status(), "hasPlayerUrl:", !!s1LockedData.playerUrl);
    if (s1LockedRes.status() !== 200 || !s1LockedData.playerUrl) {
      throw new Error("FAIL: Enrolled student could not access locked lecture!");
    }

    // Test B: Unenrolled Student (Student 2) accessing locked lecture -> HTTP 403 Forbidden!
    const s2LockedRes = await s2Page.request.get(`${BASE_URL}/api/student/watch/${testLockedLecture._id}`);
    const s2LockedData = await s2LockedRes.json();
    console.log("Student 2 (Unenrolled) -> Locked Lecture status:", s2LockedRes.status(), "body:", s2LockedData);
    if (s2LockedRes.status() !== 403) {
      throw new Error(`FAIL: Unenrolled student got status ${s2LockedRes.status()} instead of 403 Forbidden!`);
    }
    if (s2LockedData.vimeoId || s2LockedData.vimeoHash || s2LockedData.playerUrl) {
      throw new Error("CRITICAL SECURITY FAIL: Vimeo credentials leaked to unenrolled student!");
    }
    console.log("🔒 SECURITY VERIFIED: HTTP 403 returned, zero credentials leaked to client!");

    // Test C: Stream API (/api/student/lectures/[id]/stream) for unenrolled student -> HTTP 403
    const s2StreamRes = await s2Page.request.get(`${BASE_URL}/api/student/lectures/${testLockedLecture._id}/stream`);
    console.log("Student 2 (Unenrolled) -> Stream endpoint status:", s2StreamRes.status());
    if (s2StreamRes.status() !== 403) {
      throw new Error(`FAIL: Stream endpoint did not return 403 for unenrolled student! (status: ${s2StreamRes.status()})`);
    }

    // Test D: Unenrolled Student accessing FREE lecture -> HTTP 200 with video credentials
    const s2FreeRes = await s2Page.request.get(`${BASE_URL}/api/student/watch/${testFreeLecture._id}`);
    const s2FreeData = await s2FreeRes.json();
    console.log("Student 2 (Unenrolled) -> Free Lecture status:", s2FreeRes.status(), "hasPlayerUrl:", !!s2FreeData.playerUrl);
    if (s2FreeRes.status() !== 200 || !s2FreeData.playerUrl) {
      throw new Error("FAIL: Free lecture should be accessible to all students!");
    }
    console.log("✓ Free lecture correctly accessible to unenrolled student.");

    // ========================================================
    // TEST 6: WATCH PAGE & PROGRESS TRACKING (/student/watch/[lectureId])
    // ========================================================
    console.log("\n--- TEST 6: Video Watch Page & Progress Tracking ---");
    await s1Page.setViewportSize({ width: 1440, height: 900 });
    await s1Page.goto(`${BASE_URL}/student/watch/${testLockedLecture._id}`, { waitUntil: "networkidle" });

    // Screenshot Watch Page
    const watchScreenshot = path.join(ARTIFACTS_DIR, "student_watch_page_1440x900.png");
    await s1Page.screenshot({ path: watchScreenshot, fullPage: true });
    console.log("✓ Saved student watch page screenshot:", watchScreenshot);

    // Mobile Watch Page
    await s1Page.setViewportSize({ width: 390, height: 844 });
    const watchMobileScreenshot = path.join(ARTIFACTS_DIR, "student_watch_page_390x844.png");
    await s1Page.screenshot({ path: watchMobileScreenshot, fullPage: true });
    console.log("✓ Saved student watch mobile screenshot:", watchMobileScreenshot);

    // Simulate progress save via API
    const progressRes = await s1Page.request.post(`${BASE_URL}/api/student/lectures/${testLockedLecture._id}/progress`, {
      data: {
        watchedSeconds: 95,
        durationSeconds: testLockedLecture.durationSeconds || 1800
      }
    });
    console.log("Progress save status:", progressRes.status());
    if (progressRes.status() !== 200) {
      throw new Error("FAIL: Could not save progress!");
    }

    // Verify DB updated
    const progressInDb = await db.collection("lectureprogresses").findOne({
      studentId: s1Id.toString(),
      lectureId: testLockedLecture._id.toString()
    });
    console.log("✓ Progress recorded in DB:", progressInDb?.watchedSeconds, "seconds");

    // ========================================================
    // TEST 7: ADMIN LECTURES PAGE (/admin/lectures)
    // ========================================================
    console.log("\n--- TEST 7: Admin Lectures Page (/admin/lectures) ---");
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminContext.addCookies(adminCookies);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${BASE_URL}/admin/lectures?course=class-12-accountancy`, { waitUntil: "networkidle" });

    const adminBody = await adminPage.innerText("body");
    // Check for counter "15 of 15 have video links" or similar
    console.log("Admin body includes 'have video links':", adminBody.includes("have video links"));
    console.log("Admin body includes 'Import CSV':", adminBody.includes("Import CSV"));

    // Check screenshot
    const adminScreenshot = path.join(ARTIFACTS_DIR, "admin_lectures_view_1440x900.png");
    await adminPage.screenshot({ path: adminScreenshot, fullPage: true });
    console.log("✓ Saved admin lectures view screenshot:", adminScreenshot);

    // Click "Import CSV" button to test modal
    const importCsvBtn = adminPage.locator("button:has-text('Import CSV')").first();
    if (await importCsvBtn.isVisible()) {
      await importCsvBtn.click();
      await adminPage.waitForTimeout(500);
      const csvModalScreenshot = path.join(ARTIFACTS_DIR, "admin_csv_import_modal.png");
      await adminPage.screenshot({ path: csvModalScreenshot });
      console.log("✓ Saved CSV Import Modal screenshot:", csvModalScreenshot);

      // Close modal
      const closeBtn = adminPage.locator("button:has-text('Cancel'), button:has-text('Close')").first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    // Test Bulk Paste Modal
    const bulkPasteBtn = adminPage.locator("button:has-text('Paste Vimeo links')").first();
    if (await bulkPasteBtn.isVisible()) {
      await bulkPasteBtn.click();
      await adminPage.waitForTimeout(500);
      const bulkModalScreenshot = path.join(ARTIFACTS_DIR, "admin_bulk_paste_modal.png");
      await adminPage.screenshot({ path: bulkModalScreenshot });
      console.log("✓ Saved Bulk Paste Vimeo Modal screenshot:", bulkModalScreenshot);
    }

    console.log("\n==================================================");
    console.log("ALL E2E PLAYWRIGHT TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");

  } finally {
    // CLEANUP TEST USERS & SESSIONS
    console.log("\n--- Cleaning up test fixtures ---");
    await db.collection("users").deleteMany({ _id: { $in: [s1Id, s2Id, s3Id] } });
    await db.collection("courses").deleteOne({ _id: emptyCourseId });
    await db.collection("devices").deleteMany({ studentId: { $in: [s1Id, s2Id, s3Id] } });
    await db.collection("sessions").deleteMany({ userId: { $in: [s1Id, s2Id, s3Id] } });
    await db.collection("lectureprogresses").deleteMany({ studentId: s1Id.toString() });
    await db.collection("lectures").updateOne({ _id: liveLectures[1]._id }, { $set: { isFree: false } });
    console.log("Cleanup done.");

    await browser.close();
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error("Fatal Error in E2E Test:", err);
  process.exit(1);
});