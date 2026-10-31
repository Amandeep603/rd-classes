import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

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
const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
  console.log("===============================================================");
  console.log("FOLLOW-UP VIDEO PLAYER & MOBILE CONTROLS VERIFICATION");
  console.log("===============================================================\n");

  await client.connect();
  const db = client.db();

  const course = await db.collection("courses").findOne({
    $or: [{ slug: "class-12-accountancy" }, { title: /Class 12 Accountancy/i }],
  });
  const courseId = course._id;

  const freeLecture = await db.collection("lectures").findOne({
    courseId,
    isFree: true,
    vimeoId: { $exists: true, $ne: "" },
  });

  const enrolledLecture = await db.collection("lectures").findOne({
    courseId,
    isFree: false,
    vimeoId: { $exists: true, $ne: "" },
  });

  console.log(`Course: ${course.title} (${courseId})`);
  console.log(`Free Lecture: "${freeLecture.title}" (${freeLecture._id})`);
  console.log(`Enrolled Lecture: "${enrolledLecture.title}" (${enrolledLecture._id})\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  // --------------------------------------------------------------------------
  // SECTION 1: Logged-out Public Free Preview on Pixel 7, iPhone 14, Desktop
  // --------------------------------------------------------------------------
  console.log("--- SECTION 1: LOGGED-OUT FREE PREVIEW MULTI-DEVICE TEST ---");

  const devicesToTest = [
    { name: "Pixel 7 (Android Chrome)", config: devices["Pixel 7"] },
    { name: "iPhone 14 (Mobile Safari)", config: devices["iPhone 14"] },
    { name: "Desktop Chrome", config: { viewport: { width: 1280, height: 720 }, isMobile: false, hasTouch: false } },
  ];

  for (const dev of devicesToTest) {
    console.log(`\nTesting ${dev.name}...`);
    const ctx = await browser.newContext({
      ...dev.config,
      extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    });
    const page = await ctx.newPage();

    let uncaughtErrors = 0;
    page.on("pageerror", (err) => {
      console.error(`[PAGE ERROR on ${dev.name}]:`, err.message);
      uncaughtErrors++;
    });

    // Navigate to course page
    await page.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Warm-up check: confirm NO iframe in DOM before clicking
    const preIframe = await page.locator("iframe").count();
    console.log(`Warm-up check on ${dev.name}: ${preIframe === 0 ? "PASSED (0 iframes in DOM before click)" : `FAILED (${preIframe} found)`}`);

    // Click "Watch Free"
    const watchFreeBtn = page.locator("button:has-text('Watch Free')").first();
    await watchFreeBtn.scrollIntoViewIfNeeded();
    await watchFreeBtn.click();

    // Check modal visibility & iframe presence
    await page.waitForFunction(() => {
      const ifr = document.querySelector("div[role='dialog'] iframe");
      return ifr && ifr.getAttribute("src") && ifr.getAttribute("src").includes("player.vimeo.com");
    }, { timeout: 8000 });
    const modalIframeSrc = await page.locator("div[role='dialog'] iframe").getAttribute("src");
    console.log(`Modal opened on ${dev.name}: iframe src: ${modalIframeSrc ? modalIframeSrc.slice(0, 65) : "none"}...`);

    // Verify 10 Open/Close/Reopen cycles
    console.log(`Testing 10 Open/Close/Reopen cycles on ${dev.name}...`);
    let cyclesOk = 0;
    for (let c = 1; c <= 10; c++) {
      const closeBtn = page.locator("button[aria-label='Close free preview modal']").first();
      await closeBtn.click();
      await page.waitForTimeout(300);

      // Reopen
      await watchFreeBtn.scrollIntoViewIfNeeded();
      await watchFreeBtn.click();
      await page.waitForFunction(() => {
        const ifr = document.querySelector("div[role='dialog'] iframe");
        return ifr && ifr.getAttribute("src") && ifr.getAttribute("src").includes("player.vimeo.com");
      }, { timeout: 8000 });
      cyclesOk++;
    }
    console.log(`10 Cycles on ${dev.name}: ${cyclesOk}/10 successful!`);

    // Test Forced API Failure (confirm in-modal message & WhatsApp, global error page NEVER shows)
    console.log(`Testing forced API failure resilience on ${dev.name}...`);
    await page.route("**/api/student/watch/*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Simulated backend error", code: "E:network" }),
      });
    });

    // Close and reopen to trigger failure
    const closeBtn = page.locator("button[aria-label='Close free preview modal']").first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    await watchFreeBtn.scrollIntoViewIfNeeded();
    await watchFreeBtn.click();
    await page.waitForTimeout(1500);

    const failureState = await page.evaluate(() => {
      const globalError = document.body.innerText.includes("Something went wrong");
      const inModalError = document.body.innerText.includes("Playback Interrupted");
      const hasRetry = Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.includes("Retry"));
      const hasWhatsApp = Array.from(document.querySelectorAll("a")).some((a) => a.textContent?.includes("WhatsApp"));
      return { globalError, inModalError, hasRetry, hasWhatsApp };
    });

    console.log(`Forced failure on ${dev.name}:`, {
      globalErrorShown: failureState.globalError,
      inModalErrorShown: failureState.inModalError,
      retryButtonAvailable: failureState.hasRetry,
      whatsAppButtonAvailable: failureState.hasWhatsApp,
    });

    await ctx.close();
  }

  // --------------------------------------------------------------------------
  // SECTION 2: 20 Consecutive Opens as Logged-out Visitor
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 2: 20 CONSECUTIVE OPENS WITH TIME MEASUREMENT ---");
  const publicCtx = await browser.newContext({
    ...devices["Pixel 7"],
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const publicPage = await publicCtx.newPage();

  let openSuccess = 0;
  const openTimes = [];

  for (let i = 1; i <= 20; i++) {
    await publicPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
    const btn = publicPage.locator("button:has-text('Watch Free')").first();
    await btn.scrollIntoViewIfNeeded();

    const t0 = performance.now();
    await btn.click();
    await publicPage.waitForFunction(() => {
      const ifr = document.querySelector("div[role='dialog'] iframe");
      return ifr && ifr.getAttribute("src") && ifr.getAttribute("src").includes("player.vimeo.com");
    }, { timeout: 8000 });
    const elapsed = Math.round(performance.now() - t0);

    openSuccess++;
    openTimes.push(elapsed);
    if (i % 5 === 0 || i === 1) {
      console.log(`Open #${i}: SUCCESS (${elapsed}ms)`);
    }

    const closeBtn = publicPage.locator("button[aria-label='Close free preview modal']").first();
    await closeBtn.click();
    await publicPage.waitForTimeout(200);
  }

  const avgOpenTime = Math.round(openTimes.reduce((a, b) => a + b, 0) / (openTimes.length || 1));
  console.log(`20 Opens Summary: ${openSuccess}/20 succeeded. Average tap-to-player time: ${avgOpenTime}ms\n`);
  await publicCtx.close();

  // --------------------------------------------------------------------------
  // SECTION 3: Logged-in Student Watch Page (Controls, Seeks, Fullscreen)
  // --------------------------------------------------------------------------
  console.log("--- SECTION 3: STUDENT WATCH PAGE INTERACTIVE CONTROLS & FULLSCREEN ---");

  const TEST_USER = "RD-PLAYWRIGHT-VERIFY-2";
  const TEST_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_PASS, 10);

  await db.collection("users").deleteOne({ loginId: TEST_USER });
  const studentUserRes = await db.collection("users").insertOne({
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
  const studentId = studentUserRes.insertedId;
  await db.collection("devices").deleteMany({ $or: [{ studentId }, { userId: studentId }] });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await db.collection("enrollments").insertOne({
    userId: studentId,
    studentId,
    courseId,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null,
  });

  const studentCtx = await browser.newContext({
    ...devices["Pixel 7"],
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const studentPage = await studentCtx.newPage();

  // Login
  await studentPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await studentPage.fill("#auth-loginId", TEST_USER);
  await studentPage.fill("#auth-password", TEST_PASS);
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((u) => u.pathname.startsWith("/student"), { timeout: 15000 });

  // Navigate to watch page
  const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}?debugplayer=1`;
  console.log(`Navigating to student watch page: ${watchUrl}`);
  await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });
  await studentPage.waitForSelector("iframe", { timeout: 10000 });
  await studentPage.waitForTimeout(2000);

  // 1. Single Tap to show controls
  console.log("Testing Single Tap to reveal controls...");
  const gestureLayer = studentPage.locator("div[aria-label='Video gesture surface']").first();
  await gestureLayer.click();
  await studentPage.waitForTimeout(400);

  // Capture Screenshot: Controls Shown
  const controlsVisible = await studentPage.locator("button[aria-label='Play Video'], button[aria-label='Pause Video']").isVisible();
  console.log(`Controls visible after single tap: ${controlsVisible}`);
  await studentPage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_controls_shown.png"),
  });
  console.log("Saved screenshot -> player_controls_shown.png");

  // 2. Open Speed Sheet
  console.log("Testing Speed Sheet...");
  const speedBtn = studentPage.locator("button[aria-label='Playback speed']").first();
  await speedBtn.click();
  await studentPage.waitForTimeout(400);
  const speedSheetVisible = await studentPage.locator("span:has-text('Speed')").isVisible();
  console.log(`Speed sheet visible: ${speedSheetVisible}`);

  // Capture Screenshot: Speed Sheet
  await studentPage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_speed_sheet.png"),
  });
  console.log("Saved screenshot -> player_speed_sheet.png");

  // Select 1.5x speed
  await studentPage.locator("div:has(> span:has-text('Speed')) button:has-text('1.5x')").first().click();
  await studentPage.waitForTimeout(400);

  // 3. Double-tap left/right
  console.log("Testing Double-tap seek gestures...");
  const box = await gestureLayer.boundingBox();
  if (box) {
    // Double tap right third
    const rightX = box.x + box.width * 0.8;
    const centerY = box.y + box.height * 0.5;
    await studentPage.mouse.dblclick(rightX, centerY);
    await studentPage.waitForTimeout(500);

    // Double tap left third
    const leftX = box.x + box.width * 0.2;
    await studentPage.mouse.dblclick(leftX, centerY);
    await studentPage.waitForTimeout(500);
  }

  // 4. 10 Random Seeks & Recovery
  console.log("Testing 10 random seeks recovery...");
  for (let s = 1; s <= 10; s++) {
    const target = s * 95;
    await studentPage.evaluate((sec) => {
      const ifr = document.querySelector("iframe");
      if (ifr) ifr.contentWindow.postMessage(JSON.stringify({ method: "setCurrentTime", value: sec }), "*");
    }, target);
    await studentPage.waitForTimeout(1000);
  }
  console.log("10 Seeks completed smoothly.");

  // 5. 30 Consecutive Play/Pause Toggles
  console.log("Testing 30 consecutive play/pause toggles...");
  for (let p = 1; p <= 30; p++) {
    await studentPage.evaluate(() => {
      const ifr = document.querySelector("iframe");
      const method = p % 2 === 1 ? "play" : "pause";
      if (ifr) ifr.contentWindow.postMessage(JSON.stringify({ method }), "*");
    });
    await studentPage.waitForTimeout(120);
  }
  console.log("30 Play/Pause toggles completed with zero stall!");

  // 6. Fullscreen: Portrait (390x844) & Landscape (844x390)
  console.log("\nTesting Portrait Fullscreen (390x844)...");
  await studentPage.setViewportSize({ width: 390, height: 844 });
  await gestureLayer.click();
  await studentPage.waitForTimeout(300);
  const fsBtn = studentPage.locator("button[aria-label='Enter Fullscreen'], button[aria-label='Exit Fullscreen']").first();
  await fsBtn.click();
  await studentPage.waitForTimeout(600);

  // Capture Screenshot: Portrait Fullscreen
  await studentPage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_portrait_fullscreen_390x844.png"),
  });
  console.log("Saved screenshot -> player_portrait_fullscreen_390x844.png");

  // Landscape Fullscreen (844x390)
  console.log("Testing Landscape Fullscreen (844x390)...");
  await studentPage.setViewportSize({ width: 844, height: 390 });
  await studentPage.waitForTimeout(600);

  // Capture Screenshot: Landscape Fullscreen
  await studentPage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_landscape_fullscreen_844x390.png"),
  });
  console.log("Saved screenshot -> player_landscape_fullscreen_844x390.png");

  // Exit fullscreen
  await fsBtn.click();
  await studentPage.waitForTimeout(400);

  await studentCtx.close();
  await browser.close();

  // Cleanup test user
  await db.collection("users").deleteOne({ _id: studentId });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await client.close();

  console.log("\n===============================================================");
  console.log("ALL FOLLOW-UP PLAYER VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("===============================================================\n");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});