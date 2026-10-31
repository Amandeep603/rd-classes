import { chromium, devices } from "playwright";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

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

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("=================================================");
  console.log("RUNNING CONTROLS DIAGNOSTICS SUITE");
  console.log("=================================================");

  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  const enrolledLecture = await db.collection("lectures").findOne({
    courseId: course._id,
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
      courses: [course._id],
      enrolledCourses: [course._id],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    studentId = res.insertedId;
  } else {
    studentId = student._id;
  }

  await db.collection("enrollments").updateOne(
    { userId: studentId, courseId: course._id },
    { $set: { status: "active", enrolledAt: new Date() } },
    { upsert: true }
  );

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Free Preview
  console.log("\n--- 1. Desktop Free Preview ---");
  const desktopCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const page = await desktopCtx.newPage();

  const previewErrors = [];
  page.on("pageerror", (err) => previewErrors.push({ name: err.name, msg: err.message, stack: err.stack }));
  page.on("console", (m) => {
    if (m.type() === "error") previewErrors.push({ console: m.text() });
  });

  await page.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
  await page.locator("button:has-text('Watch Free')").first().click();
  await page.waitForSelector("div[role='dialog'] iframe", { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Check Vimeo SDK details from inside the page
  const vimeoInspect = await page.evaluate(async () => {
    const ifr = document.querySelector("div[role='dialog'] iframe");
    if (!ifr) return { error: "No iframe" };

    return new Promise((resolve) => {
      // Send message to Vimeo iframe to query qualities
      let answered = false;
      const handler = (e) => {
        try {
          const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (d && (d.event === "qualities" || d.method === "getQualities")) {
            answered = true;
            window.removeEventListener("message", handler);
            resolve({ fromVimeo: d });
          }
        } catch {}
      };
      window.addEventListener("message", handler);
      ifr.contentWindow.postMessage(JSON.stringify({ method: "getQualities" }), "*");
      setTimeout(() => {
        if (!answered) {
          window.removeEventListener("message", handler);
          resolve({ timedOut: true });
        }
      }, 2000);
    });
  });
  console.log("Vimeo iframe postMessage response for getQualities:", JSON.stringify(vimeoInspect, null, 2));

  // Check DOM buttons inside player
  const playerButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("div[role='dialog'] button"));
    return btns.map((b) => ({
      ariaLabel: b.getAttribute("aria-label"),
      text: b.textContent.trim(),
    }));
  });
  console.log("Player controls found:", playerButtons);

  // Click the Quality button on Desktop Preview!
  console.log("\n>>> CLICKING QUALITY BUTTON ON DESKTOP PREVIEW... <<<");
  const qBtn = page.locator("button[aria-label='Video Quality']").first();
  await qBtn.click({ force: true });
  await page.waitForTimeout(1000);

  console.log("Desktop preview errors caught after clicking Quality button:");
  console.log(JSON.stringify(previewErrors, null, 2));

  const hasFatal = await page.locator("h4:has-text('Playback Interrupted')").isVisible();
  console.log("Is Playback Interrupted fatal screen visible?", hasFatal);

  // 2. Mobile Emulation on Watch Page
  console.log("\n--- 2. Mobile Emulation on Watch Page (Pixel 7) ---");
  const phoneCtx = await browser.newContext({
    ...devices["Pixel 7"],
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const phonePage = await phoneCtx.newPage();

  const phoneErrors = [];
  phonePage.on("pageerror", (err) => phoneErrors.push({ name: err.name, msg: err.message, stack: err.stack }));
  phonePage.on("console", (m) => {
    if (m.type() === "error") phoneErrors.push({ console: m.text() });
  });

  await phonePage.route("http://localhost:3000/api/**", (route) => {
    route.continue({
      headers: { ...route.request().headers(), "x-forwarded-for": "203.0.113.15" },
    });
  });

  await phonePage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await phonePage.fill("#auth-loginId", TEST_USER);
  await phonePage.fill("#auth-password", TEST_PASS);
  await phonePage.click('button[type="submit"]');
  await phonePage.waitForTimeout(3000);

  await db.collection("devices").updateMany(
    { $or: [{ studentId }, { userId: studentId }] },
    { $set: { status: "approved" } }
  );

  const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}`;
  console.log("Navigating phone to:", watchUrl);
  await phonePage.goto(watchUrl, { waitUntil: "domcontentloaded" });
  await phonePage.waitForSelector("iframe", { timeout: 15000 });
  await phonePage.waitForTimeout(3000);

  // Tap gesture surface to show controls
  const surface = phonePage.locator("div[aria-label='Video gesture surface']").first();
  if (await surface.isVisible()) {
    await surface.click({ position: { x: 30, y: 30 }, force: true });
  }
  await phonePage.waitForTimeout(500);

  // Check phone quality button
  const phoneQBtn = phonePage.locator("button[aria-label='Video Quality']").first();
  const phoneQVis = await phoneQBtn.isVisible();
  console.log("Phone Quality Button visible:", phoneQVis);
  if (phoneQVis) {
    console.log(">>> CLICKING QUALITY BUTTON ON PHONE... <<<");
    await phoneQBtn.click({ force: true });
    await phonePage.waitForTimeout(1000);
    console.log("Phone errors caught after clicking Quality button:");
    console.log(JSON.stringify(phoneErrors, null, 2));
    const phoneFatal = await phonePage.locator("h4:has-text('Playback Interrupted')").isVisible();
    console.log("Is Playback Interrupted fatal screen visible on Phone?", phoneFatal);
  }

  // Inspect lecture info card layout at 390px
  const infoCardMetrics = await phonePage.evaluate(() => {
    const titleEl = document.querySelector("h1");
    const buttons = Array.from(document.querySelectorAll("button")).filter(b => 
      b.textContent.includes("Autoplay") || b.textContent.includes("Complete")
    ).map((b) => ({
      text: b.textContent.trim(),
      rect: b.getBoundingClientRect(),
    }));
    return {
      titleText: titleEl?.textContent?.trim(),
      titleRect: titleEl?.getBoundingClientRect(),
      titleComputedWidth: titleEl ? window.getComputedStyle(titleEl).width : null,
      buttons,
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth,
    };
  });
  console.log("\nInfo Card Metrics on Phone (390px):", JSON.stringify(infoCardMetrics, null, 2));

  await browser.close();
  await client.close();
}

run().catch(console.error);

