import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import mongoose from "mongoose";

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

const outDir = path.resolve(process.cwd(), "docs", "screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const responsiveViewports = [
  { name: "1920x1080", w: 1920, h: 1080 },
  { name: "1536x1024", w: 1536, h: 1024 },
  { name: "1280x800", w: 1280, h: 800 },
  { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024 },
  { name: "412x915", w: 412, h: 915 },
  { name: "390x844", w: 390, h: 844 },
  { name: "360x640", w: 360, h: 640 },
];

async function runVisualVerify() {
  console.log("Connecting to MongoDB to ensure Tanvi has first-login auto-approval...");
  await mongoose.connect(process.env.MONGODB_URI);
  const { User, Device } = await import("../src/server/db/models/index.js");

  const tanvi = await User.findOne({ loginId: "tanvi.agarwal" });
  if (tanvi) {
    tanvi.deviceCount = 0;
    await tanvi.save();
    await Device.deleteMany({ userId: tanvi._id });
  }
  await mongoose.disconnect();

  console.log("Launching Chromium for Visual Verification...");
  const browser = await chromium.launch({ headless: true });

  // 1. Student Dashboard Capture & Measurements (1536x1024)
  console.log("Logging into Student Portal (Tanvi Agarwal)...");
  const studentContext = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
  });
  const studentPage = await studentContext.newPage();

  await studentPage.goto("http://localhost:3000/student/login", { waitUntil: "networkidle" });
  await studentPage.fill('input[name="loginId"]', "tanvi.agarwal");
  await studentPage.fill('input[name="password"]', "password123");
  await studentPage.click('button[type="submit"]');

  // Wait specifically for /student pathname
  await studentPage.waitForURL((url) => url.pathname === "/student", { timeout: 15000 });
  await studentPage.waitForTimeout(2000);

  const student1536Path = path.join(outDir, "student-dashboard-1536.png");
  await studentPage.screenshot({ path: student1536Path });
  console.log(`✓ Saved student dashboard screenshot: ${student1536Path}`);

  // Measure Student Anchors
  const studentMetrics = await studentPage.evaluate(() => {
    const sidebar = document.querySelector(".student-shell aside") || document.querySelector("aside");
    const activeNav = sidebar ? sidebar.querySelector("a[data-active='true']") : null;
    const greeting = document.querySelector("h1");
    const banner = document.querySelector("div[class*='border-[#F6DFA0]']") || document.querySelector("div[class*='from-[#FFF3C9]']");
    const syllabusCard = document.querySelector("div[class*='from-[#0B2A47]']");
    const statCards = document.querySelectorAll(".portal-stat-card");

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
      };
    };

    // Find resume card (card containing "Resume Lecture")
    const allCards = Array.from(document.querySelectorAll("div[class*='rounded-[22px]'], div[class*='portal-card']"));
    const resumeCard = allCards.find((c) => c.innerText && c.innerText.includes("Resume Lecture"));
    const upcomingTest = allCards.find((c) => c.innerText && c.innerText.includes("Upcoming Test"));

    return {
      sidebar: getBox(sidebar),
      activeNav: getBox(activeNav),
      greeting: greeting
        ? {
            text: greeting.innerText,
            fontSize: window.getComputedStyle(greeting).fontSize,
            fontWeight: window.getComputedStyle(greeting).fontWeight,
          }
        : null,
      banner: getBox(banner),
      resumeCard: getBox(resumeCard),
      syllabusCard: getBox(syllabusCard),
      statCard0: getBox(statCards[0]),
      statCard1: getBox(statCards[1]),
      statCard2: getBox(statCards[2]),
      upcomingTest: getBox(upcomingTest),
    };
  });

  // 2. Admin Dashboard Capture & Measurements (1536x1024)
  console.log("Logging into Admin Portal (Ronak Sir)...");
  const adminContext = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[name="loginId"]', "admin");
  await adminPage.fill('input[name="password"]', "password123");
  await adminPage.click('button[type="submit"]');

  // Wait specifically for /admin pathname
  await adminPage.waitForURL((url) => url.pathname === "/admin", { timeout: 15000 });
  await adminPage.waitForTimeout(2000);
  console.log("Admin resolved URL:", adminPage.url());
  console.log("Admin resolved title:", await adminPage.title());

  const admin1536Path = path.join(outDir, "admin-dashboard-1536.png");
  await adminPage.screenshot({ path: admin1536Path });
  console.log(`✓ Saved admin dashboard screenshot: ${admin1536Path}`);


  // Measure Admin Anchors
  const adminMetrics = await adminPage.evaluate(() => {
    const sidebar = document.querySelector(".admin-shell aside") || document.querySelector("aside");
    const topbar = document.querySelector(".admin-shell header") || document.querySelector("header");
    const banner = document.querySelector("div[class*='from-[#FFF6DE]']");
    const statTiles = Array.from(document.querySelectorAll("a[href*='/admin/']")).filter((a) => a.querySelector("p"));

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        height: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
      };
    };

    const allCards = Array.from(document.querySelectorAll("div[class*='rounded-[22px]']"));
    const deviceCard = allCards.find((c) => c.innerText && c.innerText.includes("Device Approval Requests"));
    const recentActivity = allCards.find((c) => c.innerText && c.innerText.includes("Recent Activity"));

    return {
      sidebar: getBox(sidebar),
      topbar: getBox(topbar),
      banner: getBox(banner),
      statTilesCount: statTiles.length,
      statTile0: getBox(statTiles[0]),
      deviceCard: getBox(deviceCard),
      recentActivity: getBox(recentActivity),
    };
  });


  // 3. Responsive captures across all 8 viewports
  console.log("Capturing responsive screenshots matrix...");
  const responsiveReport = [];

  for (const vp of responsiveViewports) {
    // Student responsive
    await studentPage.setViewportSize({ width: vp.w, height: vp.h });
    await studentPage.waitForTimeout(400);
    const sShot = path.join(outDir, `student-${vp.name}.png`);
    await studentPage.screenshot({ path: sShot });

    // Admin responsive
    await adminPage.setViewportSize({ width: vp.w, height: vp.h });
    await adminPage.waitForTimeout(400);
    const aShot = path.join(outDir, `admin-${vp.name}.png`);
    await adminPage.screenshot({ path: aShot });

    const sOverflow = await studentPage.evaluate(
      () => document.scrollingElement.scrollWidth > window.innerWidth
    );
    const aOverflow = await adminPage.evaluate(
      () => document.scrollingElement.scrollWidth > window.innerWidth
    );

    responsiveReport.push({
      viewport: vp.name,
      studentOverflow: sOverflow,
      adminOverflow: aOverflow,
      status: !sOverflow && !aOverflow ? "PASS" : "FAIL",
    });
  }

  await browser.close();

  return {
    studentMetrics,
    adminMetrics,
    responsiveReport,
  };
}

runVisualVerify()
  .then((data) => {
    console.log("=== Student Metrics ===");
    console.log(JSON.stringify(data.studentMetrics, null, 2));
    console.log("=== Admin Metrics ===");
    console.log(JSON.stringify(data.adminMetrics, null, 2));
    console.log("=== Responsive Report ===");
    console.table(data.responsiveReport);

    fs.writeFileSync(
      path.join(outDir, "visual_metrics.json"),
      JSON.stringify(data, null, 2)
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("Visual verification failed:", err);
    process.exit(1);
  });
