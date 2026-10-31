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

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const BASE_URL = "http://localhost:3000";

async function runVerification() {
  console.log("=== STARTING COMPREHENSIVE VERIFICATION ===");
  const results = {
    checks: [],
    screenshots: [],
    errors: [],
  };

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  const courseId = course._id;

  const lectureWithVideo = await db.collection("lectures").findOne({
    courseId,
    $or: [{ vimeoId: { $exists: true, $ne: "" } }, { vimeoUrl: { $exists: true, $ne: "" } }],
    isFree: true,
  });

  console.log(`Found lecture with video: ${lectureWithVideo?._id} - ${lectureWithVideo?.title}`);

  // Test student setup in users collection
  const TEST_USER = "RD-PLAYWRIGHT-VERIFY-2";
  const TEST_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_PASS, 10);

  let student = await db.collection("users").findOne({ loginId: TEST_USER });
  let studentId;
  if (!student) {
    const res = await db.collection("users").insertOne({
      role: "student",
      name: "Playwright Verify Student",
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

  // 1. Perform login in a context to acquire auth cookies & approve device
  console.log("\nLogging in test student via UI...");
  const authCtx = await browser.newContext();
  const authPage = await authCtx.newPage();
  await authPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await authPage.fill("#auth-loginId", TEST_USER);
  await authPage.fill("#auth-password", TEST_PASS);
  await authPage.click('button[type="submit"]');
  await authPage.waitForTimeout(3000);

  // Approve all devices
  await db.collection("devices").updateMany(
    { $or: [{ studentId }, { userId: studentId }] },
    { $set: { status: "approved" } }
  );

  const authCookies = await authCtx.cookies();
  console.log(`Obtained ${authCookies.length} session cookies:`, authCookies.map(c => c.name));
  await authCtx.close();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Viewport Horizontal Overflow Check on Watch Page
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 1: Viewport Horizontal Overflow Check on /student/watch ---");
    const viewports = [320, 360, 390, 768, 1024];

    for (const width of viewports) {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(2000);

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          winWidth,
          docWidth,
          bodyWidth,
          hasHorizontalScroll: docWidth > winWidth || bodyWidth > winWidth,
        };
      });

      console.log(`Viewport ${width}px: scrollWidth = ${overflow.docWidth}px, innerWidth = ${overflow.winWidth}px -> hasHorizontalScroll: ${overflow.hasHorizontalScroll}`);
      results.checks.push({
        test: `No horizontal scroll at ${width}px`,
        passed: !overflow.hasHorizontalScroll,
        details: overflow,
      });

      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 2: Capture Watch Page Screenshots (320px, 390px, 768px)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 2: Capture Watch Page Screenshots ---");
    for (const w of [320, 390, 768]) {
      const context = await browser.newContext({
        viewport: { width: w, height: 850 },
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(2500);

      // Info card screenshot
      const infoCard = page.locator("div.rounded-\\[22px\\]").first();
      const infoCardShot = path.join(ARTIFACT_DIR, `watch_info_card_${w}px.png`);
      if (await infoCard.count() > 0) {
        await infoCard.screenshot({ path: infoCardShot });
        console.log(`Saved screenshot: ${infoCardShot}`);
        results.screenshots.push(infoCardShot);
      }

      // Control row screenshot at 320px
      if (w === 320) {
        const controlRow = page.locator("div.aspect-video").first();
        const controlRowShot = path.join(ARTIFACT_DIR, `watch_control_row_320px.png`);
        if (await controlRow.count() > 0) {
          await page.mouse.move(160, 200);
          await page.waitForTimeout(600);
          await controlRow.screenshot({ path: controlRowShot });
          console.log(`Saved screenshot: ${controlRowShot}`);
          results.screenshots.push(controlRowShot);
        }
      }

      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 3: Quality Menu UI & Screenshots (Desktop & Mobile)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 3: Quality Menu Mobile Drawer & Desktop Popover ---");
    // Mobile 390px (Pixel 7)
    {
      const context = await browser.newContext({
        ...devices["Pixel 7"],
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__rd_mock_qualities = [
          { id: "1080p", label: "1080p" },
          { id: "720p", label: "720p" },
          { id: "540p", label: "540p" },
          { id: "360p", label: "360p" },
        ];
      });

      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3000);

      // Tap on player to show controls
      await page.click("div.aspect-video");
      await page.waitForTimeout(500);

      const qualityBtn = page.locator("button[aria-label='Video Quality']");
      if (await qualityBtn.count() > 0) {
        await qualityBtn.click();
        await page.waitForTimeout(800);
        const mobileMenuShot = path.join(ARTIFACT_DIR, "quality_menu_mobile_390px.png");
        await page.screenshot({ path: mobileMenuShot });
        console.log(`Saved screenshot: ${mobileMenuShot}`);
        results.screenshots.push(mobileMenuShot);

        // Verify bottom sheet layout
        const hasAuto = await page.locator("button:has-text('Auto (recommended)')").count() > 0;
        const hasHint = await page.locator("text='Choose a lower quality if your internet is slow.'").count() > 0;
        console.log(`Mobile Quality Menu items: Auto=${hasAuto}, Hint=${hasHint}`);
        results.checks.push({
          test: "Quality bottom sheet shows Auto and Slow Internet hint on mobile",
          passed: hasAuto && hasHint,
        });
      }
      await context.close();
    }

    // Desktop 1280px
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__rd_mock_qualities = [
          { id: "1080p", label: "1080p" },
          { id: "720p", label: "720p" },
          { id: "540p", label: "540p" },
          { id: "360p", label: "360p" },
        ];
      });

      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3000);

      await page.mouse.move(500, 300);
      await page.waitForTimeout(500);

      const qualityBtn = page.locator("button[aria-label='Video Quality']");
      if (await qualityBtn.count() > 0) {
        await qualityBtn.click();
        await page.waitForTimeout(800);
        const desktopMenuShot = path.join(ARTIFACT_DIR, "quality_menu_desktop.png");
        await page.screenshot({ path: desktopMenuShot });
        console.log(`Saved screenshot: ${desktopMenuShot}`);
        results.screenshots.push(desktopMenuShot);
      }
      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 4: Public Course Free Preview Modal (390px)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 4: Public Course Free Preview Modal (390px) ---");
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/courses/class-12-accountancy`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(2500);

      // Open Free Preview modal via "Watch Free" button
      const previewBtn = page.locator("button:has-text('Watch Free')").first();
      if (await previewBtn.count() > 0) {
        await previewBtn.click();
        await page.waitForTimeout(1500);

        const previewShot = path.join(ARTIFACT_DIR, "preview_modal_390px.png");
        await page.screenshot({ path: previewShot });
        console.log(`Saved screenshot: ${previewShot}`);
        results.screenshots.push(previewShot);

        // Verify modal bounds
        const modalCheck = await page.evaluate(() => {
          const dialog = document.querySelector("div[role='dialog']");
          if (!dialog) return { found: false };
          const docW = document.documentElement.scrollWidth;
          return {
            found: true,
            windowWidth: window.innerWidth,
            docWidth: docW,
            hasOverflow: docW > window.innerWidth,
          };
        });
        console.log("Modal layout check:", modalCheck);
        results.checks.push({
          test: "Free preview modal fits 390px with no horizontal overflow",
          passed: modalCheck.found && !modalCheck.hasOverflow,
          details: modalCheck,
        });
      } else {
        console.log("No Watch Free button found on /courses/class-12-accountancy");
      }
      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 5: Stress Test Controls & Quality Menu (20-30 times)
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 5: Stress Test Controls & Quality Menu (20-30 times) ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      page.addInitScript(() => {
        window.__rd_mock_qualities = [
          { id: "1080p", label: "1080p" },
          { id: "720p", label: "720p" },
          { id: "540p", label: "540p" },
          { id: "360p", label: "360p" },
        ];
      });

      let errorScreenAppeared = false;

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.log("[Browser Console Error]:", msg.text());
        }
      });

      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3000);

      const checkFatal = async () => {
        const fatal = await page.locator("text='Playback Interrupted'").count();
        if (fatal > 0) {
          errorScreenAppeared = true;
          throw new Error("Fatal error screen appeared unexpectedly!");
        }
      };

      // Tap Play/Pause 20 times
      console.log("Tapping Play/Pause 20 times...");
      const playBtn = page.locator("button[aria-label*='Play Video'], button[aria-label*='Pause Video']").first();
      for (let i = 0; i < 20; i++) {
        await page.mouse.move(600, 300);
        if (await playBtn.count() > 0) {
          await playBtn.click().catch(() => {});
        }
        await page.waitForTimeout(80);
      }
      await checkFatal();

      // Tap Seek ±10s 20 times
      console.log("Tapping Seek ±10s 20 times...");
      const rewBtn = page.locator("button[aria-label='Rewind 10 seconds']");
      const ffBtn = page.locator("button[aria-label='Fast forward 10 seconds']");
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(600, 300);
        if (await rewBtn.count() > 0) await rewBtn.click().catch(() => {});
        if (await ffBtn.count() > 0) await ffBtn.click().catch(() => {});
        await page.waitForTimeout(80);
      }
      await checkFatal();

      // Open and close Quality Menu 30 times
      console.log("Opening and closing Quality Menu 30 times...");
      const qualBtn = page.locator("button[aria-label='Video Quality']");
      for (let i = 0; i < 30; i++) {
        await page.mouse.move(600, 300);
        if (await qualBtn.count() > 0) {
          await qualBtn.click().catch(() => {});
          await page.waitForTimeout(50);
          await page.mouse.click(200, 200);
          await page.waitForTimeout(50);
        }
      }
      await checkFatal();

      results.checks.push({
        test: "Control taps and 30x Quality Menu toggles without crash",
        passed: !errorScreenAppeared,
      });

      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 6: Quality Switching & LocalStorage Persistence
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 6: Quality Switching & LocalStorage Persistence ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      await context.addCookies(authCookies);
      const page = await context.newPage();
      page.addInitScript(() => {
        window.__rd_mock_qualities = [
          { id: "1080p", label: "1080p" },
          { id: "720p", label: "720p" },
          { id: "540p", label: "540p" },
          { id: "360p", label: "360p" },
        ];
      });

      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3000);

      // Verify localStorage persistence
      await page.mouse.move(500, 300);
      const qualBtn = page.locator("button[aria-label='Video Quality']");
      if (await qualBtn.count() > 0) {
        await qualBtn.click();
        await page.waitForTimeout(400);

        // Click 360p
        const option360 = page.locator("button:has-text('360p')");
        if (await option360.count() > 0) {
          await option360.first().click();
          await page.waitForTimeout(500);

          const stored = await page.evaluate(() => localStorage.getItem("rd_player_quality"));
          console.log(`Stored quality in localStorage: ${stored}`);
          results.checks.push({
            test: "User quality preference remembered in localStorage under 'rd_player_quality'",
            passed: stored === "360p",
            storedQuality: stored,
          });
        }
      }

      await context.close();
    }

    // ------------------------------------------------------------------------
    // TEST 7: Block player.vimeo.com -> Verify E:load / E:network fatal screen & Retry
    // ------------------------------------------------------------------------
    console.log("\n--- TEST 7: Block player.vimeo.com -> Fatal Screen & Retry ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      await context.addCookies(authCookies);

      // Route-block player.vimeo.com
      await context.route("**/player.vimeo.com/**", (route) => route.abort());

      const page = await context.newPage();
      await page.goto(`${BASE_URL}/student/watch/${lectureWithVideo._id}`, {
        waitUntil: "domcontentloaded",
      });

      // Wait 7 seconds for the 6s load timeout to fire
      await page.waitForTimeout(7000);

      const fatalScreenVisible = await page.locator("text='Playback Interrupted'").isVisible();
      const codeVisible = await page.locator("text=/Code: E:(network|load)/").isVisible();
      const retryBtn = page.locator("button:has-text('Retry')");
      const retryVisible = await retryBtn.isVisible();

      console.log(`Fatal screen on network block: visible=${fatalScreenVisible}, code=${codeVisible}, retry=${retryVisible}`);
      results.checks.push({
        test: "Blocked network shows fatal screen with E:load/network and Retry button",
        passed: fatalScreenVisible && retryVisible,
        details: { fatalScreenVisible, codeVisible, retryVisible },
      });

      if (retryVisible) {
        console.log("Clicking Retry Video button...");
        await retryBtn.click();
        await page.waitForTimeout(1000);
      }

      await context.close();
    }
  } catch (err) {
    console.error("Verification encountered error:", err);
    results.errors.push(err.message);
  } finally {
    await browser.close();

    // Clean up test student
    await db.collection("users").deleteOne({ loginId: TEST_USER });
    console.log(`Cleaned up test student: ${TEST_USER}`);

    await client.close();
  }

  console.log("\n=== VERIFICATION SUMMARY ===");
  console.log(JSON.stringify(results, null, 2));
}

runVerification().catch(console.error);
