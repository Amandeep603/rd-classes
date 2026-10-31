import { chromium, devices } from "playwright";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// Load environment variables
for (const envFile of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || "").trim().replace(/^["']|["']$/g, "");
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    }
  }
}

const BASE_URL = "http://localhost:3000";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("===============================================================");
  console.log("STEP 1: REPRODUCE AND DIAGNOSE VIDEO PLAYER CONTROLS CRASH");
  console.log("===============================================================");

  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  const courseId = course._id;
  const freeLecture = await db.collection("lectures").findOne({
    courseId,
    $or: [{ isFree: true }, { is_free: true }],
  });
  const enrolledLecture = await db.collection("lectures").findOne({
    courseId,
    isFree: false,
    vimeoId: { $exists: true, $ne: "" },
  });

  const TEST_USER = "RD-PLAYWRIGHT-VERIFY-2";
  const TEST_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_PASS, 10);

  let student = await db.collection("users").findOne({ loginId: TEST_USER });
  let studentId;
  if (!student) {
    const res = await db.collection("users").insertOne({
      role: "student",
      name: "Followup Verification Student",
      loginId: TEST_USER,
      email: "verify2.student@rdclasses.com",
      phone: "9876543210",
      passwordHash: passHash,
      status: "active",
      maxDevices: 2,
      courses: [courseId],
      enrolledCourses: [courseId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    studentId = res.insertedId;
  } else {
    studentId = student._id;
    await db.collection("users").updateOne(
      { _id: studentId },
      { $set: { passwordHash: passHash, status: "active", courses: [courseId], enrolledCourses: [courseId] } }
    );
  }

  await db.collection("enrollments").deleteMany({ userId: studentId });
  await db.collection("enrollments").insertOne({
    userId: studentId,
    studentId,
    courseId,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null,
  });

  const browser = await chromium.launch({ headless: true });
  const testConfigs = [
    { name: "Desktop Chrome", config: { viewport: { width: 1280, height: 800 } } },
    { name: "Pixel 7 (Android)", config: { ...devices["Pixel 7"] } },
    { name: "iPhone 14 (Mobile Safari)", config: { ...devices["iPhone 14"] } },
  ];

  const diagnosisReport = [];

  for (const { name, config } of testConfigs) {
    console.log(`\n--- Testing ${name} ---`);

    // A) Free Preview Modal (Logged-out)
    console.log(`[${name}] A. Logged-out Free Preview Modal...`);
    const previewCtx = await browser.newContext({
      ...config,
      extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    });
    const previewPage = await previewCtx.newPage();

    await previewPage.route("http://localhost:3000/api/**", (route) => {
      route.continue({
        headers: { ...route.request().headers(), "x-forwarded-for": "203.0.113.10" },
      });
    });

    const pageErrors = [];
    previewPage.on("pageerror", (err) => {
      pageErrors.push({ type: "pageerror", name: err.name, message: err.message, stack: err.stack });
    });
    previewPage.on("console", (msg) => {
      if (msg.type() === "error") {
        pageErrors.push({ type: "console_error", text: msg.text() });
      }
    });

    await previewPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
    const watchFreeBtn = previewPage.locator("button:has-text('Watch Free')").first();
    await watchFreeBtn.click();
    await previewPage.waitForSelector("div[role='dialog'] iframe", { timeout: 10000 });
    await previewPage.waitForTimeout(2000);

    // Inspect qualities exposed by Vimeo SDK
    const rawQualities = await previewPage.evaluate(() => {
      const ifr = document.querySelector("div[role='dialog'] iframe");
      return ifr ? "iframe present" : "no iframe";
    });

    // Tap surface to reveal controls
    const gestureSurface = previewPage.locator("div[aria-label='Video gesture surface']").first();
    if (await gestureSurface.isVisible()) {
      await gestureSurface.click({ position: { x: 30, y: 30 }, force: true });
    }
    await previewPage.waitForTimeout(400);

    // List of controls to test
    const controlsToTest = [
      { id: "play_pause", selector: "button[aria-label='Play Video'], button[aria-label='Pause Video']" },
      { id: "rewind_10s", selector: "button[aria-label='Rewind 10 seconds']" },
      { id: "forward_10s", selector: "button[aria-label='Forward 10 seconds']" },
      { id: "speed_chip", selector: "button[aria-label='Playback speed']" },
      { id: "quality_or_settings", selector: "button[aria-label='Video Quality']" },
      { id: "mute_unmute", selector: "button[aria-label='Mute'], button[aria-label='Unmute']" },
      { id: "fullscreen", selector: "button[aria-label='Enter Fullscreen'], button[aria-label='Exit Fullscreen']" },
    ];

    for (const ctrl of controlsToTest) {
      const el = previewPage.locator(ctrl.selector).first();
      const isVis = await el.isVisible().catch(() => false);
      if (!isVis) {
        console.log(`  Control [${ctrl.id}]: NOT VISIBLE or not exposed`);
        continue;
      }

      console.log(`  Testing click on [${ctrl.id}]...`);
      const errorsBefore = pageErrors.length;
      await el.click({ force: true }).catch((err) => {
        pageErrors.push({ type: "click_fail", ctrl: ctrl.id, message: err.message });
      });
      await previewPage.waitForTimeout(800);

      const hasAlert = await previewPage.locator("[role='alert']").isVisible().catch(() => false);
      const newErrors = pageErrors.slice(errorsBefore);

      if (hasAlert || newErrors.length > 0) {
        console.log(`  >>> CRASH TRIGGERED BY [${ctrl.id}]! hasAlert=${hasAlert}`);
        console.log(`      Errors:`, JSON.stringify(newErrors, null, 2));
        diagnosisReport.push({
          context: `Free Preview (${name})`,
          control: ctrl.id,
          hasFatalScreen: hasAlert,
          errors: newErrors,
        });

        // If crashed, test Retry button!
        const retryBtn = previewPage.locator("button:has-text('Retry')").first();
        if (await retryBtn.isVisible()) {
          console.log(`  Testing Retry button after crash on [${ctrl.id}]...`);
          await retryBtn.click();
          await previewPage.waitForTimeout(1500);
          const stillHasAlert = await previewPage.locator("[role='alert']").isVisible().catch(() => false);
          console.log(`  Alert visible after Retry: ${stillHasAlert}`);
        }
      } else {
        console.log(`  Control [${ctrl.id}]: OK (no crash)`);
      }
    }

    await previewCtx.close();

    // B) Student Watch Page (Logged-in)
    console.log(`\n[${name}] B. Logged-in Student Watch Page...`);
    const studentCtx = await browser.newContext({
      ...config,
      extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    });
    const studentPage = await studentCtx.newPage();
    await studentPage.route("http://localhost:3000/api/**", (route) => {
      route.continue({
        headers: { ...route.request().headers(), "x-forwarded-for": "203.0.113.15" },
      });
    });

    const studentPageErrors = [];
    studentPage.on("pageerror", (err) => {
      studentPageErrors.push({ type: "pageerror", name: err.name, message: err.message, stack: err.stack });
    });
    studentPage.on("console", (msg) => {
      if (msg.type() === "error") {
        studentPageErrors.push({ type: "console_error", text: msg.text() });
      }
    });

    // Login
    await studentPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
    await studentPage.fill("#auth-loginId", TEST_USER);
    await studentPage.fill("#auth-password", TEST_PASS);
    await studentPage.click('button[type="submit"]');
    await studentPage.waitForTimeout(3000);

    // Approve device
    await db.collection("devices").updateMany(
      { $or: [{ studentId }, { userId: studentId }] },
      { $set: { status: "approved" } }
    );

    const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}?debugplayer=1`;
    await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });
    await studentPage.waitForSelector("iframe", { timeout: 15000 });
    await studentPage.waitForTimeout(2000);

    // Tap surface to show controls
    const studentSurface = studentPage.locator("div[aria-label='Video gesture surface']").first();
    if (await studentSurface.isVisible()) {
      await studentSurface.click({ position: { x: 30, y: 30 }, force: true });
    }
    await studentPage.waitForTimeout(400);

    for (const ctrl of controlsToTest) {
      const el = studentPage.locator(ctrl.selector).first();
      const isVis = await el.isVisible().catch(() => false);
      if (!isVis) {
        console.log(`  Student Control [${ctrl.id}]: NOT VISIBLE or not exposed`);
        continue;
      }

      console.log(`  Testing Student click on [${ctrl.id}]...`);
      const errorsBefore = studentPageErrors.length;
      await el.click({ force: true }).catch((err) => {
        studentPageErrors.push({ type: "click_fail", ctrl: ctrl.id, message: err.message });
      });
      await studentPage.waitForTimeout(800);

      const hasAlert = await studentPage.locator("[role='alert']").isVisible().catch(() => false);
      const newErrors = studentPageErrors.slice(errorsBefore);

      if (hasAlert || newErrors.length > 0) {
        console.log(`  >>> STUDENT CRASH TRIGGERED BY [${ctrl.id}]! hasAlert=${hasAlert}`);
        console.log(`      Errors:`, JSON.stringify(newErrors, null, 2));
        diagnosisReport.push({
          context: `Student Watch (${name})`,
          control: ctrl.id,
          hasFatalScreen: hasAlert,
          errors: newErrors,
        });

        // Test Retry button
        const retryBtn = studentPage.locator("button:has-text('Retry')").first();
        if (await retryBtn.isVisible()) {
          console.log(`  Testing Retry button after crash on [${ctrl.id}]...`);
          await retryBtn.click();
          await studentPage.waitForTimeout(1500);
          const stillHasAlert = await studentPage.locator("[role='alert']").isVisible().catch(() => false);
          console.log(`  Alert visible after Retry: ${stillHasAlert}`);
        }
      } else {
        console.log(`  Student Control [${ctrl.id}]: OK (no crash)`);
      }
    }

    await studentCtx.close();
  }

  await browser.close();
  await client.close();

  console.log("\n===============================================================");
  console.log("DIAGNOSIS COMPLETE - SUMMARY REPORT");
  console.log("===============================================================");
  console.log(JSON.stringify(diagnosisReport, null, 2));
}

main().catch(console.error);

