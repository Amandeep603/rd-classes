import fs from "fs";
import path from "path";
import http from "http";
import { spawn } from "child_process";
import { chromium } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local
function loadEnv() {
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
}

loadEnv();

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

import { deriveIsolatedTestUri } from "./lib/testDbIsolation.mjs";

async function run() {
  console.log("=== RD Classes Portal & Routes E2E Crawl ===");

  const { testUri, testDbName } = deriveIsolatedTestUri();
  console.log(`Connecting to Isolated Test DB: "${testDbName}"...`);
  await mongoose.connect(testUri, { bufferCommands: false });
  const { User, Course, Enrollment, Device } = await import(
    "../src/server/db/models/index.js"
  );

  const adminUser = await User.findOne({ role: "admin" }).lean();
  if (!adminUser) {
    console.error("No admin user found. Run npm run seed:admin first.");
    process.exit(1);
  }

  // Ensure test student exists
  const testStudentLoginId = "student_crawl_test";
  const testPassword = "Password123!";
  const testPasswordHash = await bcrypt.hash(testPassword, 10);

  let student = await User.findOne({ loginId: testStudentLoginId });
  if (!student) {
    student = await User.create({
      role: "student",
      loginId: testStudentLoginId,
      name: "Test Crawl Student",
      passwordHash: testPasswordHash,
      phone: "9876543210",
      status: "active",
      deviceLimit: 3,
      deviceCount: 0,
      mustChangePassword: false,
    });
  } else {
    student.passwordHash = testPasswordHash;
    student.status = "active";
    await student.save();
  }

  // Ensure student has enrollment in at least 1 course
  const firstCourse = await Course.findOne({ published: true }).lean();
  if (firstCourse) {
    const existingEnr = await Enrollment.findOne({
      userId: student._id,
      courseId: firstCourse._id,
    });
    if (!existingEnr) {
      await Enrollment.create({
        userId: student._id,
        courseId: firstCourse._id,
        status: "active",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Clear any existing devices for test student so clean login works
  await Device.deleteMany({ userId: student._id });
  student.deviceCount = 0;
  await student.save();

  // Check if Next server is running, or start it
  let serverProcess = null;
  const isRunning = await checkServerRunning();
  if (!isRunning) {
    console.log("Starting Next.js production server for crawl test...");
    serverProcess = spawn("npm.cmd", ["run", "start"], {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: true,
    });

    let started = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await checkServerRunning()) {
        started = true;
        break;
      }
    }
    if (!started) {
      console.error("Failed to start server within 30s.");
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  console.log(`✓ Server ready at ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const failedPages = [];

  const checkUrl = async (page, url, expectedTitleSubstring = "") => {
    console.log(`Checking: ${url} ...`);
    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    };
    page.on("console", onConsole);

    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    const status = response ? response.status() : 0;
    const title = await page.title();
    const content = await page.content();

    page.off("console", onConsole);

    const is404 = status === 404;
    const is500 = status >= 500;

    if (is404 || is500) {
      console.error(`✗ FAIL: ${url} returned status ${status}`);
      failedPages.push({ url, status, error: is404 ? "Not Found (404)" : "Server Error (500)" });
    } else {
      console.log(`✓ PASS: ${url} (${status}) - Title: "${title}"`);
    }
  };

  try {
    // 1. PUBLIC ROUTES CRAWL
    console.log("\n--- 1. Testing Public Routes ---");
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();

    await checkUrl(publicPage, `${BASE_URL}/`);
    await checkUrl(publicPage, `${BASE_URL}/courses`);
    if (firstCourse) {
      await checkUrl(publicPage, `${BASE_URL}/courses/${firstCourse.slug}`);
    }
    await publicContext.close();

    // 2. ADMIN PORTAL CRAWL
    console.log("\n--- 2. Testing Admin Portal Routes ---");
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Login as admin
    await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
    await adminPage.fill('input[type="text"]', process.env.ADMIN_LOGIN_ID || "admin");
    await adminPage.fill('input[type="password"]', process.env.ADMIN_PASSWORD);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL("**/admin", { timeout: 15000 });

    const adminRoutes = [
      "/admin",
      "/admin/students",
      "/admin/device-requests",
      "/admin/courses",
      "/admin/courses/new",
      "/admin/lectures",
      "/admin/tests",
      "/admin/announcements",
      "/admin/settings",
      "/admin/activity",
      "/admin/media",
    ];

    for (const r of adminRoutes) {
      await checkUrl(adminPage, `${BASE_URL}${r}`);
    }
    await adminContext.close();

    // 3. STUDENT PORTAL CRAWL
    console.log("\n--- 3. Testing Student Portal Routes ---");
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    // Login as student
    await studentPage.goto(`${BASE_URL}/student/login`, { waitUntil: "networkidle" });
    await studentPage.fill('input[type="text"]', testStudentLoginId);
    await studentPage.fill('input[type="password"]', testPassword);
    await studentPage.click('button[type="submit"]');
    await studentPage.waitForURL("**/student", { timeout: 15000 });

    const studentRoutes = [
      "/student",
      "/student/lectures",
      "/student/tests",
      "/student/profile",
      "/student/courses",
    ];

    for (const r of studentRoutes) {
      await checkUrl(studentPage, `${BASE_URL}${r}`);
    }
    await studentContext.close();
  } finally {
    await browser.close();
    await mongoose.disconnect();
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log("\n========================================");
  if (failedPages.length > 0) {
    console.error(`CRAWL FAILED: ${failedPages.length} pages returned errors:`);
    console.error(JSON.stringify(failedPages, null, 2));
    process.exit(1);
  } else {
    console.log("✓ ALL PUBLIC, ADMIN, AND STUDENT ROUTES PASSED CLEANLY!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Crawl script error:", err);
  process.exit(1);
});
