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

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
  const courseId = course._id;
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
  const studentCtx = await browser.newContext({
    ...devices["Pixel 7"],
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const studentPage = await studentCtx.newPage();

  studentPage.on("pageerror", (err) => {
    console.log("\n==============================");
    console.log("[STUDENT PAGE ERROR]:", err.name, ":", err.message);
    console.log("[STACK]:\n", err.stack);
    console.log("==============================\n");
  });

  studentPage.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") {
      console.log(`[STUDENT ${t.toUpperCase()}]:`, msg.text());
    }
  });

  await studentPage.route("http://localhost:3000/api/**", (route) => {
    route.continue({
      headers: { ...route.request().headers(), "x-forwarded-for": "203.0.113.15" },
    });
  });

  // Login
  console.log("Logging in on Pixel 7...");
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
  console.log(`Navigating to watch page: ${watchUrl}`);
  await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });
  await studentPage.waitForSelector("iframe", { timeout: 15000 });
  await studentPage.waitForTimeout(4000);

  // Tap gesture layer to show controls
  const surface = studentPage.locator("div[aria-label='Video gesture surface']").first();
  if (await surface.isVisible()) {
    await surface.click({ position: { x: 30, y: 30 }, force: true });
  }
  await studentPage.waitForTimeout(500);

  // List all buttons in the player
  const buttons = await studentPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map((b) => ({
      ariaLabel: b.getAttribute("aria-label"),
      text: b.textContent.trim(),
      className: b.className,
      rect: b.getBoundingClientRect(),
    }));
  });
  console.log("Buttons on watch page:", JSON.stringify(buttons.filter((b) => b.ariaLabel || b.text), null, 2));

  // Check Vimeo SDK player getQualities() directly via injected module
  const qualityRes = await studentPage.evaluate(async () => {
    const ifr = document.querySelector("iframe");
    if (!ifr) return { error: "No iframe" };
    // Let's import Vimeo player
    try {
      const mod = await import("@vimeo/player");
      const Player = mod.default || mod;
      const p = new Player(ifr);
      const qualities = await p.getQualities();
      return { qualities };
    } catch (e) {
      return { sdkError: e.name + ": " + e.message };
    }
  });
  console.log("SDK Quality Result:", JSON.stringify(qualityRes, null, 2));

  // Check if quality button exists
  const qualityBtn = studentPage.locator("button[aria-label='Video Quality']").first();
  const qVis = await qualityBtn.isVisible();
  console.log("Quality Button visible:", qVis);
  if (qVis) {
    console.log("Clicking Quality Button...");
    await qualityBtn.click({ force: true });
    await studentPage.waitForTimeout(1000);
    const fatal = await studentPage.locator("h4:has-text('Playback Interrupted')").isVisible();
    console.log("Fatal screen visible after click:", fatal);
  }

  // Also check PART 2: mobile layout issues below 640px
  console.log("\n--- Checking Mobile Layout at 390px ---");
  const layoutInfo = await studentPage.evaluate(() => {
    const titleEl = document.querySelector("h1, h2, h3");
    const container = document.querySelector(".max-w-7xl, main");
    return {
      windowWidth: window.innerWidth,
      titleText: titleEl ? titleEl.textContent : null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  console.log("Layout Info:", layoutInfo);

  await studentCtx.close();
  await browser.close();
  await client.close();
}

main().catch(console.error);
