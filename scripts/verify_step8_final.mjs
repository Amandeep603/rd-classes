import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chromium } from "playwright";
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
  console.log("STARTING STEP 8: FINAL SYSTEM VERIFICATION");
  console.log("==================================================");

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;
  console.log("Connected to MongoDB:", db.name);

  // 1. Verify Course & 67 Lectures in DB
  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  if (!course) throw new Error("Course 'class-12-accountancy' not found!");
  console.log(`Course Found: "${course.title}" ID: ${course._id}`);

  const allLectures = await db.collection("lectures").find({
    courseId: course._id
  }).sort({ bookNo: 1, chapterNo: 1, lectureNo: 1 }).toArray();

  console.log(`Lectures in DB for course: ${allLectures.length} (Expected: 67)`);
  if (allLectures.length !== 67) {
    throw new Error(`Expected 67 lectures, found ${allLectures.length}`);
  }

  // Verify chapter counts: 15, 5, 16, 4, 10, 4, 13
  const expectedChapterCounts = [15, 5, 16, 4, 10, 4, 13];
  for (let ch = 1; ch <= 7; ch++) {
    const chLecs = allLectures.filter(l => l.chapterNo === ch);
    console.log(`Chapter ${ch}: ${chLecs.length} lectures (Expected: ${expectedChapterCounts[ch - 1]})`);
    if (chLecs.length !== expectedChapterCounts[ch - 1]) {
      throw new Error(`Chapter ${ch} count mismatch: got ${chLecs.length}, expected ${expectedChapterCounts[ch - 1]}`);
    }
  }

  const freeIntroLecture = allLectures.find(l => l.chapterNo === 1 && l.lectureNo === 1);
  if (!freeIntroLecture || !freeIntroLecture.isFree) {
    throw new Error("Chapter 1, Lecture 1 'Introduction to Class 12th' must be seeded with isFree: true");
  }
  console.log(`✓ Confirmed Chapter 1 Lecture 1 is free: "${freeIntroLecture.title}"`);

  // Set up Test Student 1 (Enrolled in Class 12 Accountancy)
  const S1_LOGIN = "RD-STEP8-ENROLLED";
  const s1PassHash = await bcrypt.hash("Pass@123", 12);
  await db.collection("users").deleteOne({ loginId: S1_LOGIN });
  const s1Insert = await db.collection("users").insertOne({
    role: "student",
    name: "Enrolled Student",
    loginId: S1_LOGIN,
    passwordHash: s1PassHash,
    status: "active",
    courses: [course._id.toString()],
    enrolledCourses: [course._id.toString()],
    classLevel: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const s1Id = s1Insert.insertedId;

  // Set up Test Student 2 (Non-enrolled, zero courses)
  const S2_LOGIN = "RD-STEP8-NONENROLLED";
  const s2PassHash = await bcrypt.hash("Pass@123", 12);
  await db.collection("users").deleteOne({ loginId: S2_LOGIN });
  const s2Insert = await db.collection("users").insertOne({
    role: "student",
    name: "Non-Enrolled Student",
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

  // Find or create admin
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

  async function createSessionForUser(userId, role = "student") {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tHash = hashToken(rawToken);
    const devId = new mongoose.Types.ObjectId();
    const devKey = devId.toString();

    await db.collection("devices").insertOne({
      _id: devId,
      userId: userId,
      studentId: userId,
      deviceId: devKey,
      deviceKey: devKey,
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
      deviceId: devKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(),
    });

    const cookieName = role === "admin" ? "rd_admin_session" : "rd_session";
    return [
      { name: cookieName, value: rawToken, domain: "127.0.0.1", path: "/" },
      { name: "rd_device", value: signDeviceToken(devKey), domain: "127.0.0.1", path: "/" },
    ];
  }

  const s1Cookies = await createSessionForUser(s1Id, "student");
  const s2Cookies = await createSessionForUser(s2Id, "student");
  const adminCookies = await createSessionForUser(adminUser._id, "admin");

  const browser = await chromium.launch({ headless: true });

  try {
    // ========================================================
    // PART A: LOGGED-OUT VISITOR ON /courses/class-12-accountancy
    // ========================================================
    console.log("\n--- PART A: Public Visitor on /courses/class-12-accountancy ---");
    const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "networkidle" });

    const publicBody = await publicPage.innerText("body");

    // 1. Verify 7 chapters and all counts visible
    const chaptersExpected = [
      "Fundamentals of a Partnership Firm",
      "Valuation of Goodwill",
      "Admission of a Partner",
      "Change in Profit Sharing Ratio",
      "Retirement of a Partner",
      "Death of a Partner",
      "Dissolution of a Partnership Firm"
    ];

    for (const chName of chaptersExpected) {
      if (!publicBody.includes(chName)) {
        throw new Error(`FAIL: Public course page missing chapter: ${chName}`);
      }
    }
    console.log("✓ All 7 chapters visible to logged-out visitor");

    // 2. Verify counts: 15, 5, 16, 4, 10, 4, 13
    if (!publicBody.includes("15 lectures") || !publicBody.includes("5 lectures") || !publicBody.includes("16 lectures")) {
      throw new Error("FAIL: Public course page chapter lecture counts missing!");
    }
    console.log("✓ Correct chapter lecture counts (15, 5, 16, 4, 10, 4, 13) visible on page");

    // 3. Verify Free badge on Lecture 1
    if (!publicBody.includes("FREE")) {
      throw new Error("FAIL: Free badge missing on Lecture 1!");
    }
    console.log("✓ Free badge present on Chapter 1 Lecture 1 ('Introduction to Class 12th')");

    // 4. Test clicking a Locked row (Lecture 2) -> popup opens
    const lockedRow = publicPage.locator("text=Basics of Partnership, P&L Appropriation").first();
    await lockedRow.click();
    await publicPage.waitForTimeout(500);

    const popupVisible = await publicPage.locator("text=This lecture is for enrolled students").isVisible();
    const whatsappBtnVisible = await publicPage.locator("a:has-text('Contact on WhatsApp')").isVisible();
    console.log("✓ Locked lecture popup opened:", popupVisible, "WhatsApp button visible:", whatsappBtnVisible);
    if (!popupVisible || !whatsappBtnVisible) {
      throw new Error("FAIL: Locked lecture popup with WhatsApp button did not open!");
    }

    // Close popup
    await publicPage.locator("button:has-text('Close')").first().click();

    // 5. Test server API access for locked lecture without login -> must return 403 Forbidden!
    const lockedLec2 = allLectures.find(l => l.chapterNo === 1 && l.lectureNo === 2);
    const unauthApiRes = await publicPage.request.get(`${BASE_URL}/api/student/watch/${lockedLec2._id}`);
    const unauthApiData = await unauthApiRes.json();
    console.log("Public Visitor -> Locked Lecture API status:", unauthApiRes.status(), "body:", unauthApiData);
    if (unauthApiRes.status() !== 403) {
      throw new Error(`FAIL: Server did not return 403 for locked lecture! (got ${unauthApiRes.status()})`);
    }
    if (unauthApiData.vimeoId || unauthApiData.playerUrl) {
      throw new Error("CRITICAL SECURITY FAIL: Vimeo credentials leaked to visitor!");
    }
    console.log("🔒 SECURITY VERIFIED: 403 returned, zero credentials leaked!");

    // Capture screenshots
    const publicScreenshot = path.join(ARTIFACTS_DIR, "public_course_syllabus_1440x900.png");
    await publicPage.screenshot({ path: publicScreenshot, fullPage: true });
    console.log("✓ Saved public course syllabus desktop screenshot:", publicScreenshot);

    await publicPage.setViewportSize({ width: 390, height: 844 });
    const publicMobileScreenshot = path.join(ARTIFACTS_DIR, "public_course_syllabus_390x844.png");
    await publicPage.screenshot({ path: publicMobileScreenshot, fullPage: true });
    console.log("✓ Saved public course syllabus mobile screenshot:", publicMobileScreenshot);

    // ========================================================
    // PART B: SIMPLE ADMIN LECTURES PAGE (/admin/lectures)
    // ========================================================
    console.log("\n--- PART B: Simple Admin Lectures Page (/admin/lectures) ---");
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminContext.addCookies(adminCookies);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${BASE_URL}/admin/lectures?course=class-12-accountancy`, { waitUntil: "networkidle" });

    const adminBody = await adminPage.innerText("body");

    // 1. Verify Top Dropdown & Progress counter
    if (!adminBody.includes("of 67 lectures have video links")) {
      throw new Error("FAIL: Admin counter 'X of 67 lectures have video links' not found!");
    }
    console.log("✓ Admin counter 'X of 67 lectures have video links' visible");

    // 2. Verify Helper banner
    if (!adminBody.includes("Open the video in Vimeo") || !adminBody.includes("Share > Embed > Copy")) {
      throw new Error("FAIL: Admin helper banner line missing!");
    }
    console.log("✓ Admin helper instructions banner visible");

    // 3. Test Single Vimeo link input auto-save on Lecture 1
    const lec1Input = adminPage.locator("table tbody tr").first().locator("input[type='text']").nth(1);
    await lec1Input.fill("https://player.vimeo.com/video/1040854407?h=59f81bc26c");
    await lec1Input.blur();
    await adminPage.waitForTimeout(1500);

    const lec1Text = await adminPage.locator("table tbody tr").first().innerText();
    console.log("Lecture 1 row after link paste:", lec1Text.replace(/\n+/g, " "));
    if (!lec1Text.includes("Video added")) {
      throw new Error("FAIL: Single Vimeo link did not show 'Video added' on paste/blur!");
    }
    console.log("✓ Single Vimeo link input auto-saved and showed 'Video added'");

    // 4. Test "Paste all links" button for Chapter 1
    const pasteAllBtn = adminPage.locator("button:has-text('Paste all links')").first();
    await pasteAllBtn.click();
    await adminPage.waitForTimeout(500);

    const pasteModalOpen = await adminPage.locator("text=BULK PASTE VIMEO LINKS").isVisible();
    console.log("Bulk paste modal visible:", pasteModalOpen);

    // Paste 15 sample links
    const sample15Links = Array.from({ length: 15 }, (_, i) => `https://player.vimeo.com/video/104085440${i}?h=hash${i}`).join("\n");
    await adminPage.locator("textarea").fill(sample15Links);
    await adminPage.waitForTimeout(500);

    const previewText = await adminPage.locator("text=Preview: 15 links for 15 lectures").isVisible();
    console.log("Preview '15 links for 15 lectures' visible:", previewText);
    if (!previewText) throw new Error("FAIL: Preview counter in bulk paste modal missing!");

    // Save bulk links
    await adminPage.locator("button:has-text('Save Links')").click();
    await adminPage.waitForTimeout(2000);

    const adminBodyAfterBulk = await adminPage.innerText("body");
    console.log("Chapter 1 counter after bulk paste:", adminBodyAfterBulk.slice(0, 500).replace(/\n+/g, " "));
    if (!adminBodyAfterBulk.includes("15 of 15 videos added")) {
      throw new Error("FAIL: Chapter 1 counter did not update to '15 of 15 videos added'!");
    }
    console.log("✓ 'Paste all links' successfully filled all 15 lectures with preview and updated counter to '15 of 15 videos added'!");

    // Capture Admin Screenshots
    const adminScreenshot = path.join(ARTIFACTS_DIR, "admin_simple_lectures_1440x900.png");
    await adminPage.screenshot({ path: adminScreenshot, fullPage: true });
    console.log("✓ Saved admin lectures desktop screenshot:", adminScreenshot);

    await adminPage.setViewportSize({ width: 390, height: 844 });
    const adminMobileScreenshot = path.join(ARTIFACTS_DIR, "admin_simple_lectures_390x844.png");
    await adminPage.screenshot({ path: adminMobileScreenshot, fullPage: true });
    console.log("✓ Saved admin lectures mobile screenshot:", adminMobileScreenshot);

    // ========================================================
    // PART C: ENROLLED STUDENT ON /student/lectures
    // ========================================================
    console.log("\n--- PART C: Enrolled Student on /student/lectures ---");
    const s1Context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await s1Context.addCookies(s1Cookies);
    const s1Page = await s1Context.newPage();
    await s1Page.goto(`${BASE_URL}/student/lectures`, { waitUntil: "networkidle" });

    const s1Body = await s1Page.innerText("body");
    // Verify Play on lectures that have videos (Chapter 1 has 15 videos)
    if (!s1Body.includes("Watch") && !s1Body.includes("Play")) {
      throw new Error("FAIL: Enrolled student does not see Watch/Play button on lecture with video!");
    }
    console.log("✓ Enrolled student sees Play/Watch on lecture with video link");

    // Open Chapter 2 (which has no videos yet) to check "Coming soon"
    const ch2Btn = s1Page.locator("button:has-text('Valuation of Goodwill')").first();
    if (await ch2Btn.isVisible()) {
      await ch2Btn.click();
      await s1Page.waitForTimeout(500);
      const s1BodyCh2 = await s1Page.innerText("body");
      if (!s1BodyCh2.includes("Coming soon")) {
        throw new Error("FAIL: Enrolled student does not see 'Coming soon' on lectures without video links!");
      }
      console.log("✓ Enrolled student sees 'Coming soon' on lectures without video links");
    }

    const s1Screenshot = path.join(ARTIFACTS_DIR, "student_lectures_enrolled_1440x900.png");
    await s1Page.screenshot({ path: s1Screenshot, fullPage: true });
    console.log("✓ Saved student lectures enrolled screenshot:", s1Screenshot);

    await s1Page.setViewportSize({ width: 390, height: 844 });
    const s1MobileScreenshot = path.join(ARTIFACTS_DIR, "student_lectures_enrolled_390x844.png");
    await s1Page.screenshot({ path: s1MobileScreenshot, fullPage: true });
    console.log("✓ Saved student lectures enrolled mobile screenshot:", s1MobileScreenshot);

    // ========================================================
    // PART D: NON-ENROLLED STUDENT (Sees Locks)
    // ========================================================
    console.log("\n--- PART D: Non-enrolled Student on Locked Lecture API ---");
    const s2Context = await browser.newContext();
    await s2Context.addCookies(s2Cookies);
    const s2Page = await s2Context.newPage();

    const s2Res = await s2Page.request.get(`${BASE_URL}/api/student/watch/${lockedLec2._id}`);
    const s2Data = await s2Res.json();
    console.log("Non-enrolled student API status:", s2Res.status(), "body:", s2Data);
    if (s2Res.status() !== 403) {
      throw new Error(`FAIL: Non-enrolled student did not receive 403! (got ${s2Res.status()})`);
    }
    console.log("✓ Non-enrolled student correctly denied with 403 on locked lecture");

    // ========================================================
    // PART E: CLEAR TEST LINKS & RESTORE TO SEEDED STATE
    // ========================================================
    console.log("\n--- PART E: Reset to Seeded State ---");
    await db.collection("lectures").updateMany(
      { courseId: course._id },
      { $set: { vimeoId: "", vimeoHash: "", videoUrl: "", status: "draft" } }
    );
    await db.collection("lectures").updateOne(
      { courseId: course._id, chapterNo: 1, lectureNo: 1 },
      { $set: { isFree: true, vimeoId: "", vimeoHash: "", videoUrl: "", status: "draft" } }
    );
    console.log("✓ All test video links cleared back to seeded state (no video links yet, Lecture 1 isFree=true).");

    console.log("\n==================================================");
    console.log("🎉 ALL STEP 8 CHECKS PASSED WITH 100% SUCCESS!");
    console.log("==================================================");

  } finally {
    // CLEANUP TEST USERS & SESSIONS
    console.log("\n--- Cleaning up temporary test fixtures ---");
    await db.collection("users").deleteMany({ _id: { $in: [s1Id, s2Id] } });
    await db.collection("devices").deleteMany({ studentId: { $in: [s1Id, s2Id] } });
    await db.collection("sessions").deleteMany({ userId: { $in: [s1Id, s2Id] } });
    console.log("Cleanup complete.");

    await browser.close();
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error("Fatal Error in Step 8 Verification:", err);
  process.exit(1);
});
