import fs from "fs";
import path from "path";
import { chromium, devices } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
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

const BASE_URL = "http://127.0.0.1:3000";
const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log("=== STARTING PLAYWRIGHT E2E FOR TASK 1 & TASK 2 ===");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;

  const TEST_LOGIN_ID = "RD-PLAYWRIGHT-999";
  const TEST_PASSWORD = "Password@123";
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  // Clean old test artifacts
  await db.collection("users").deleteOne({ loginId: TEST_LOGIN_ID });
  await db.collection("loginattempts").deleteMany({ key: { $regex: new RegExp(TEST_LOGIN_ID, "i") } });

  const studentInsert = await db.collection("users").insertOne({
    role: "student",
    name: "Playwright E2E Student",
    loginId: TEST_LOGIN_ID,
    email: "e2e.student@rdclasses.com",
    phone: "9876543219",
    passwordHash: passwordHash,
    status: "active",
    maxDevices: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const testStudentId = studentInsert.insertedId;
  console.log("✓ Test student created with ID:", testStudentId.toString());

  const browser = await chromium.launch({ headless: true });

  try {
    // ==========================================
    // STEP 1: Desktop Login with lowercase + spaces
    // ==========================================
    console.log("\n--- STEP 1: Desktop Login (testing case-insensitivity & trimming) ---");
    const desktopContext = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
    await desktopPage.fill("#auth-loginId", "  rd-playwright-999  ");
    await desktopPage.fill("#auth-password", "  Password@123  ");
    await desktopPage.click('button[type="submit"]');

    await desktopPage.waitForURL(
      (url) => url.pathname === "/student" || url.pathname.startsWith("/student/"),
      { timeout: 15000 }
    );
    console.log("✓ Desktop login succeeded! Redirected to:", desktopPage.url());

    // Verify DB: Device auto-approved
    const dev1 = await db.collection("devices").findOne({ studentId: testStudentId, status: "approved" });
    if (!dev1) throw new Error("STEP 1 FAILED: First device was not auto-approved!");
    console.log("✓ Device auto-approved in DB:", dev1.deviceLabel, "Key:", dev1.deviceKey);

    // ==========================================
    // STEP 2: Relaxed Device Matching (Different browser, same Windows OS)
    // ==========================================
    console.log("\n--- STEP 2: Relaxed Device Matching (Firefox on same Windows OS) ---");
    const firefoxContext = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    });
    const firefoxPage = await firefoxContext.newPage();

    await firefoxPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
    await firefoxPage.fill("#auth-loginId", "RD-PLAYWRIGHT-999");
    await firefoxPage.fill("#auth-password", "Password@123");
    await firefoxPage.click('button[type="submit"]');

    await firefoxPage.waitForURL(
      (url) => url.pathname === "/student" || url.pathname.startsWith("/student/"),
      { timeout: 15000 }
    );
    console.log("✓ Firefox login succeeded immediately without device lock! Redirected to:", firefoxPage.url());

    // ==========================================
    // STEP 3: Different Device (Mobile) -> Pending Request
    // ==========================================
    console.log("\n--- STEP 3: Mobile Device Attempt -> Pending Device Warning ---");
    const mobileContext = await browser.newContext({
      ...devices["Pixel 5"],
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
    await mobilePage.fill("#auth-loginId", "RD-PLAYWRIGHT-999");
    await mobilePage.fill("#auth-password", "Password@123");
    await mobilePage.click('button[type="submit"]');

    // Wait for the pending message alert to appear
    await mobilePage.waitForSelector('text=This account is registered on another device', { timeout: 10000 });
    console.log("✓ Student correctly saw pending device warning message!");

    // Verify DB: 1 approved device and 1 pending device
    const pendingDev = await db.collection("devices").findOne({ studentId: testStudentId, status: "pending" });
    if (!pendingDev) throw new Error("STEP 3 FAILED: Pending device record not created in DB!");
    console.log("✓ Pending device in DB:", pendingDev.deviceLabel, "Type:", pendingDev.deviceType);

    // ==========================================
    // STEP 4: Admin views Device Requests & Approves with Replace
    // ==========================================
    console.log("\n--- STEP 4: Admin Device Approval in Portal ---");
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/admin-login`, { waitUntil: "networkidle" });
    await adminPage.fill("#auth-loginId", process.env.ADMIN_LOGIN_ID || "admin");
    await adminPage.fill("#auth-password", process.env.ADMIN_PASSWORD || "RDClasses@2026");
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL(
      (url) => url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && !url.pathname.includes("login")),
      { timeout: 15000 }
    );
    console.log("✓ Admin logged in successfully!");

    await adminPage.goto(`${BASE_URL}/admin/device-requests`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector(`text=${TEST_LOGIN_ID}`, { timeout: 10000 });
    console.log("✓ Admin sees pending device request card for student!");

    // Click "Approve Device"
    await adminPage.click(`button:has-text("Approve Device")`);
    await adminPage.waitForSelector('text=Approve Device Request', { timeout: 5000 });

    // Confirm Replace Old Device
    await adminPage.click('button:has-text("Confirm & Approve")');
    await adminPage.waitForTimeout(2000);
    console.log("✓ Admin confirmed approval with Replace mode!");

    // Verify DB: Old device revoked, new device approved, old session deleted
    const oldDevAfter = await db.collection("devices").findOne({ _id: dev1._id });
    const newDevAfter = await db.collection("devices").findOne({ _id: pendingDev._id });
    console.log("Old device status:", oldDevAfter.status, "(expected: revoked)");
    console.log("New device status:", newDevAfter.status, "(expected: approved)");
    if (oldDevAfter.status !== "revoked" || newDevAfter.status !== "approved") {
      throw new Error("STEP 4 FAILED: Device statuses not updated properly!");
    }

    const oldSessions = await db.collection("sessions").find({
      userId: testStudentId,
      deviceId: dev1.deviceId,
    }).toArray();
    if (oldSessions.length > 0) {
      throw new Error("STEP 4 FAILED: Old device sessions were not killed on replace!");
    }
    console.log("✓ Old session successfully killed on Replace!");

    // ==========================================
    // STEP 5: Mobile device can now log in
    // ==========================================
    console.log("\n--- STEP 5: Mobile Device logs in after approval ---");
    await mobilePage.fill("#auth-loginId", "RD-PLAYWRIGHT-999");
    await mobilePage.fill("#auth-password", "Password@123");
    await mobilePage.click('button[type="submit"]');
    await mobilePage.waitForURL(
      (url) => url.pathname === "/student" || url.pathname.startsWith("/student/"),
      { timeout: 15000 }
    );
    console.log("✓ Approved mobile device successfully logged in! Redirected to:", mobilePage.url());

    // ==========================================
    // STEP 6: Admin Debug Endpoint Check
    // ==========================================
    console.log("\n--- STEP 6: Admin Debug Endpoint GET /api/admin/debug/student/[loginId] ---");
    const debugResponse = await adminPage.evaluate(async (loginId) => {
      const res = await fetch(`/api/admin/debug/student/${loginId}`);
      return await res.json();
    }, TEST_LOGIN_ID);

    console.log("Debug response:", debugResponse);
    if (!debugResponse.exists || !debugResponse.hasPasswordHash || !debugResponse.hashValidFormat) {
      throw new Error("STEP 6 FAILED: Debug endpoint validation failed!");
    }
    if (debugResponse.password || debugResponse.passwordHash) {
      throw new Error("SECURITY VIOLATION: Debug endpoint exposed sensitive fields!");
    }
    console.log("✓ Admin debug endpoint verified: correct booleans, zero sensitive leakage!");

    // ==========================================
    // STEP 7: Wrong Password & Rate Limiting & Admin Unlock
    // ==========================================
    console.log("\n--- STEP 7: Rate Limiting & Admin Unlock ---");
    const attackerContext = await browser.newContext();
    const attackerPage = await attackerContext.newPage();
    await attackerPage.goto(`${BASE_URL}/student-login`, { waitUntil: "domcontentloaded" });

    for (let i = 1; i <= 5; i++) {
      await attackerPage.fill("#auth-loginId", TEST_LOGIN_ID);
      await attackerPage.fill("#auth-password", "BadPass" + i);
      await attackerPage.click('button[type="submit"]');
      await attackerPage.waitForSelector('text=Invalid login ID or password', { timeout: 10000 });
      console.log(`Wrong attempt ${i} verified: saw "Invalid login ID or password"`);
    }

    // 6th attempt should show rate limit error
    await attackerPage.fill("#auth-loginId", TEST_LOGIN_ID);
    await attackerPage.fill("#auth-password", "BadPass6");
    await attackerPage.click('button[type="submit"]');
    await attackerPage.waitForSelector('text=Too many attempts, try again in', { timeout: 10000 });
    console.log("✓ Rate limit lock verified! Saw: Too many attempts, try again in N minutes");

    // Admin goes to /admin/students and clicks Unlock Login
    console.log("Admin unlocks login from /admin/students...");
    await adminPage.goto(`${BASE_URL}/admin/students?search=${TEST_LOGIN_ID}`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForSelector(`text=${TEST_LOGIN_ID}`, { timeout: 10000 });

    // Handle alert dialog
    adminPage.once("dialog", async (dialog) => {
      console.log("Dialog message:", dialog.message());
      await dialog.accept();
    });

    const unlockBtn = adminPage.locator('button[title="Unlock Login"]').first();
    await unlockBtn.click();
    await adminPage.waitForTimeout(2000);
    console.log("✓ Unlock login clicked!");

    // Attacker page can now submit with correct password without rate limit error
    await attackerPage.fill("#auth-loginId", TEST_LOGIN_ID);
    await attackerPage.fill("#auth-password", TEST_PASSWORD);
    await attackerPage.click('button[type="submit"]');
    await attackerPage.waitForTimeout(2000);
    const content = await attackerPage.content();
    const rateLimitedStill = content.includes("Too many attempts");
    if (rateLimitedStill) {
      throw new Error("STEP 7 FAILED: Account was not unlocked by admin!");
    }
    console.log("✓ Account successfully unlocked! Rate limit lockout cleared.");

    console.log("\n=======================================================");
    console.log("🎉 ALL PLAYWRIGHT E2E TESTS PASSED 100%!");
    console.log("=======================================================");

  } finally {
    // Cleanup test artifacts
    await db.collection("users").deleteOne({ loginId: TEST_LOGIN_ID });
    await db.collection("devices").deleteMany({ studentId: testStudentId });
    await db.collection("sessions").deleteMany({ userId: testStudentId });
    await db.collection("loginattempts").deleteMany({ key: { $regex: new RegExp(TEST_LOGIN_ID, "i") } });
    console.log("✓ Cleaned up test student and test database records.");
    await browser.close();
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("FATAL ERROR IN PLAYWRIGHT TEST:", err);
  process.exit(1);
});
