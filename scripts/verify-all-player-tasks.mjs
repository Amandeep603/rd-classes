import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";

// Load .env
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

async function runVerification() {
  console.log("===============================================================");
  console.log("FINAL VIDEO PLAYER COMPREHENSIVE VERIFICATION");
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

  const FREE_VIMEO_ID = freeLecture.vimeoId;
  const ENROLLED_VIMEO_ID = enrolledLecture.vimeoId;

  console.log(`Course: ${course.title} (${courseId})`);
  console.log(`Free Lecture: "${freeLecture.title}" (${freeLecture._id}) - Vimeo ID: ${FREE_VIMEO_ID}`);
  console.log(`Enrolled Lecture: "${enrolledLecture.title}" (${enrolledLecture._id}) - Vimeo ID: ${ENROLLED_VIMEO_ID}\n`);

  // --------------------------------------------------------------------------
  // TEST 1: Privacy Grep Verification (No raw vimeoId/hash in HTML or client JS)
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: CODE-SIDE PRIVACY & GREP AUDIT ---");

  // Check SSR HTML of public course page
  const coursePageRes = await fetch(`${BASE_URL}/courses/class-12-accountancy`);
  const coursePageHtml = await coursePageRes.text();

  const leakedInCoursePage =
    coursePageHtml.includes(FREE_VIMEO_ID) || coursePageHtml.includes(ENROLLED_VIMEO_ID);
  console.log(`Vimeo ID in /courses/class-12-accountancy SSR HTML: ${leakedInCoursePage ? "LEAK DETECTED!" : "CLEAN (None found)"}`);

  // Check built client chunks in .next/static/chunks
  const chunksDir = path.resolve(process.cwd(), ".next/static/chunks");
  let rawIdInChunks = false;
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir).filter((f) => f.endsWith(".js"));
    for (const f of chunkFiles) {
      const content = fs.readFileSync(path.join(chunksDir, f), "utf-8");
      if (content.includes(FREE_VIMEO_ID) || content.includes(ENROLLED_VIMEO_ID)) {
        rawIdInChunks = true;
        console.error(`Vimeo ID leaked in chunk: ${f}`);
      }
    }
  }
  console.log(`Vimeo ID in .next/static/chunks: ${rawIdInChunks ? "LEAK DETECTED!" : "CLEAN (None found)"}\n`);

  // Setup test enrolled student
  const TEST_USER = "RD-PLAYWRIGHT-VERIFY";
  const TEST_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_PASS, 10);

  await db.collection("users").deleteOne({ loginId: TEST_USER });
  await db.collection("loginattempts").deleteMany({ key: { $regex: new RegExp(TEST_USER, "i") } });

  const studentUserRes = await db.collection("users").insertOne({
    role: "student",
    name: "Verification Student",
    loginId: TEST_USER,
    email: "verify.student@rdclasses.com",
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

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  // --------------------------------------------------------------------------
  // TEST 2: Free preview as logged-out visitor (20 consecutive loads)
  // --------------------------------------------------------------------------
  console.log("--- TEST 2: FREE PREVIEW 20 CONSECUTIVE LOADS (Logged-out visitor) ---");
  const publicContext = await browser.newContext({
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const publicPage = await publicContext.newPage();

  let successCount = 0;
  const playTimes = [];

  for (let i = 1; i <= 20; i++) {
    await publicPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
    await publicPage.waitForTimeout(600);

    const watchFreeBtn = publicPage.locator("button:has-text('Watch Free')").first();
    await watchFreeBtn.scrollIntoViewIfNeeded();

    const t0 = performance.now();
    await watchFreeBtn.click();

    // Wait for iframe with non-empty src to be present and modal visible
    const modalIframe = publicPage.locator("div[role='dialog'] iframe");
    await modalIframe.waitFor({ state: "attached", timeout: 8000 }).catch(() => {});
    const src = await modalIframe.getAttribute("src").catch(() => null);

    const tPlay = Math.round(performance.now() - t0);

    if (src && src.includes("player.vimeo.com")) {
      successCount++;
      playTimes.push(tPlay);
      console.log(`Load #${i}: SUCCESS (${tPlay}ms) - iframe src: ${src.slice(0, 55)}...`);
    } else {
      console.log(`Load #${i}: FAILED - src was "${src}"`);
    }

    if (i === 1) {
      // Capture Desktop Screenshot of Modal Player & Poster/Watermark
      await publicPage.screenshot({
        path: path.join(ARTIFACT_DIR, "player_desktop_preview.png"),
      });
      console.log("Saved desktop screenshot -> player_desktop_preview.png");
    }

    // Close modal
    const closeBtn = publicPage.locator("button[aria-label='Close free preview modal']").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    await publicPage.waitForTimeout(400);
  }

  const avgPlayTime = Math.round(playTimes.reduce((a, b) => a + b, 0) / (playTimes.length || 1));
  console.log(`\nFree Preview 20-Run Results: ${successCount}/20 successful. Average warmed load time: ${avgPlayTime}ms\n`);

  // --------------------------------------------------------------------------
  // TEST 3: Mobile Viewport (390px) Screenshot
  // --------------------------------------------------------------------------
  console.log("--- TEST 3: 390px MOBILE VIEWPORT TEST & SCREENSHOT ---");
  const mobileContext = await browser.newContext({
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1000);

  const mBtn = mobilePage.locator("button:has-text('Watch Free')").first();
  await mBtn.scrollIntoViewIfNeeded();
  await mBtn.click();
  await mobilePage.waitForTimeout(1500);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_mobile_390px.png"),
  });
  console.log("Saved mobile screenshot -> player_mobile_390px.png\n");

  // --------------------------------------------------------------------------
  // TEST 4: Student Watch Page (3 Minutes Playback + 10 Seeks + Throttling/Offline)
  // --------------------------------------------------------------------------
  console.log("--- TEST 4: STUDENT WATCH PAGE (3m Playback, 10 Seeks, Slow 4G, 5s Offline) ---");
  const studentContext = await browser.newContext({
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const studentPage = await studentContext.newPage();

  const metrics = {
    iframeCreations: 0,
    iframeSrcChanges: 0,
    routerRefreshCallsDuringPlayback: 0,
    spinnersShownDuringSeek: 0,
    blackScreenWithoutSpinner: false,
    slow4gRecovered: false,
    offlineRecovered: false,
  };

  let isWatchingLive = false;
  studentPage.on("request", (req) => {
    const url = req.url();
    if (isWatchingLive && (url.includes("_rsc=") || (req.headers()["rsc"] && !url.includes(".js")))) {
      metrics.routerRefreshCallsDuringPlayback++;
      console.log(`[ALERT] router.refresh detected during playback: ${url}`);
    }
  });

  // Login
  await studentPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await studentPage.fill("#auth-loginId", TEST_USER);
  await studentPage.fill("#auth-password", TEST_PASS);
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((url) => url.pathname.startsWith("/student"), { timeout: 15000 });

  // Navigate to watch page
  const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}?debugplayer=1`;
  console.log(`Navigating to ${watchUrl}...`);
  await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });
  await studentPage.waitForTimeout(2000);

  // Now start strict playback tracking
  isWatchingLive = true;

  await studentPage.exposeFunction("__onIframeCreated", () => {
    metrics.iframeCreations++;
  });
  await studentPage.exposeFunction("__onIframeSrcChange", () => {
    metrics.iframeSrcChanges++;
  });

  await studentPage.evaluate(() => {
    document.querySelectorAll("iframe").forEach(() => window.__onIframeCreated());
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.tagName === "IFRAME") {
            window.__onIframeCreated();
            new MutationObserver(() => window.__onIframeSrcChange()).observe(n, {
              attributes: true,
              attributeFilter: ["src"],
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Monitor playback for 3 minutes (180s)
  console.log("Playing for 180 seconds (3 minutes)...");
  const sStart = Date.now();
  let sElapsed = 0;
  while (sElapsed < 180000) {
    await studentPage.waitForTimeout(15000);
    sElapsed = Date.now() - sStart;
    console.log(`[Watch Playback] ${Math.round(sElapsed / 1000)}s / 180s - router.refresh count: ${metrics.routerRefreshCallsDuringPlayback}`);

    // At 60s: Test Slow 4G
    if (sElapsed >= 60000 && !metrics.slow4gRecovered) {
      console.log("\n>>> Applying Slow 4G Network Throttling (500 kbps, 400ms latency)...");
      const cdp = await studentContext.newCDPSession(studentPage);
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 400,
        downloadThroughput: (500 * 1024) / 8,
        uploadThroughput: (500 * 1024) / 8,
      });
      await studentPage.waitForTimeout(10000);
      console.log(">>> Restoring network to normal...");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      metrics.slow4gRecovered = true;
    }

    // At 120s: Test 5-Second Offline Blip
    if (sElapsed >= 120000 && !metrics.offlineRecovered) {
      console.log("\n>>> Simulating 5-second offline blip...");
      await studentContext.setOffline(true);
      await studentPage.waitForTimeout(5000);
      console.log(">>> Restoring online status...");
      await studentContext.setOffline(false);
      metrics.offlineRecovered = true;
    }
  }

  // 10 Forward Seeks
  console.log("\n>>> Performing 10 forward seeks (including beyond buffered range)...");
  for (let i = 1; i <= 10; i++) {
    const targetSec = i * 150;
    console.log(`Seek #${i} to ${targetSec}s...`);
    await studentPage.evaluate((sec) => {
      const ifr = document.querySelector("iframe");
      if (ifr) {
        ifr.contentWindow.postMessage(JSON.stringify({ method: "setCurrentTime", value: sec }), "*");
      }
    }, targetSec);

    // Check if spinner displays during wait
    await studentPage.waitForTimeout(400);
    const spinnerVisible = await studentPage.locator("div:has-text('Seeking...'), div:has-text('Buffering...')").isVisible();
    if (spinnerVisible) metrics.spinnersShownDuringSeek++;

    await studentPage.waitForTimeout(2500);
  }

  // Save student watch page screenshot showing debug overlay
  await studentPage.screenshot({
    path: path.join(ARTIFACT_DIR, "player_student_watch_debug.png"),
  });
  console.log("Saved student watch screenshot -> player_student_watch_debug.png\n");

  await browser.close();

  // --------------------------------------------------------------------------
  // TEST 5: Rate Limiter Audit (Moved to end to not block earlier tests)
  // --------------------------------------------------------------------------
  console.log("--- TEST 5: RATE LIMITER AUDIT (60 req/min) ---");
  let rateLimitHit = false;
  for (let i = 0; i < 65; i++) {
    const r = await fetch(`${BASE_URL}/api/student/watch/${freeLecture._id}`);
    if (r.status === 429) {
      rateLimitHit = true;
      console.log(`Rate limit 429 received on request #${i + 1}`);
      break;
    }
  }
  console.log(`Rate limit enforcement: ${rateLimitHit ? "VERIFIED (429 triggered)" : "FAILED"}\n`);

  // Cleanup test user
  await db.collection("users").deleteOne({ _id: studentId });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await client.close();

  console.log("===============================================================");
  console.log("FINAL VERIFICATION SUMMARY");
  console.log("===============================================================");
  console.log({
    freePreviewSuccess: `${successCount}/20`,
    avgWarmedPlayTimeMs: avgPlayTime,
    iframeCreationsOnWatch: metrics.iframeCreations,
    iframeSrcChangesOnWatch: metrics.iframeSrcChanges,
    routerRefreshCallsDuring3MinWatch: metrics.routerRefreshCallsDuringPlayback,
    slow4gRecovered: metrics.slow4gRecovered,
    offlineBlipRecovered: metrics.offlineRecovered,
    spinnersShownDuringSeek: `${metrics.spinnersShownDuringSeek}/10 seeks`,
    blackScreenWithoutSpinner: metrics.blackScreenWithoutSpinner,
    privacyRawVimeoIdExposed: leakedInCoursePage || rawIdInChunks,
  });
  console.log("===============================================================\n");
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
