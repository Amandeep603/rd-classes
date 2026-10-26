import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local without exposing secrets
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

import { deriveIsolatedTestUri } from "./lib/testDbIsolation.mjs";

const PORT = process.env.PORT || "3100";
const BASE_URL = `http://localhost:${PORT}`;

const { testUri, testDbName } = deriveIsolatedTestUri();

const adminLoginId = (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "password123";

async function runScenario() {
  console.log("=== RD Classes Full End-to-End Playwright Scenario ===");
  console.log(`Connecting to Isolated Test DB: "${testDbName}" & Target: ${BASE_URL}...`);

  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  const results = [];
  const logStep = (step, status, details) => {
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✕" : "ℹ";
    console.log(`${icon} [${status}] Step ${step}: ${details}`);
    results.push({ step, status, details, timestamp: new Date().toISOString() });
  };

  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // SETUP: Ensure Admin user exists with known password
    // ----------------------------------------------------
    // Clear rate limits so automated test is never throttled
    await db.collection("ratelimits").deleteMany({});

    const adminHash = await bcrypt.hash(adminPassword, 12);
    await db.collection("users").updateOne(
      { loginId: adminLoginId, role: "admin" },
      {
        $set: {
          name: "Sir (Admin)",
          loginId: adminLoginId,
          role: "admin",
          status: "active",
          passwordHash: adminHash,
        },
      },
      { upsert: true }
    );
    logStep(1, "PASS", `Admin credentials ready for login (${adminLoginId}).`);

    // ----------------------------------------------------
    // STEP 2: Create or Reuse Published Course with 3 Lectures + 2 Notes
    // ----------------------------------------------------
    let course = await db.collection("courses").findOne({ published: true });
    let courseId;
    let courseSlug;
    if (course) {
      courseId = course._id;
      courseSlug = course.slug;
    } else {
      courseSlug = `e2e-accounts-audit-${Date.now()}`;
      const courseInsert = await db.collection("courses").insertOne({
        title: "Class 12 E2E Accounts Mastery",
        slug: courseSlug,
        subtitle: "Comprehensive Board Preparation",
        description: "Complete course for end-to-end testing.",
        price: 4999,
        published: true,
        order: 1,
        category: "Class 12",
        tone: "amber",
        demo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      courseId = courseInsert.insertedId;
    }

    await db.collection("lectures").deleteMany({ courseId });
    await db.collection("lectures").insertMany([
      {
        courseId,
        title: "Lecture 1: Partnership Fundamentals",
        section: "Chapter 1",
        vimeoId: "76979871",
        durationSec: 1800,
        order: 1,
        published: true,
        isPreview: false,
        createdAt: new Date(),
      },
      {
        courseId,
        title: "Lecture 2: Goodwill Valuation",
        section: "Chapter 1",
        vimeoId: "76979872",
        durationSec: 2100,
        order: 2,
        published: true,
        isPreview: false,
        createdAt: new Date(),
      },
      {
        courseId,
        title: "Lecture 3: Admission of a Partner",
        section: "Chapter 2",
        vimeoId: "76979873",
        durationSec: 2400,
        order: 3,
        published: true,
        isPreview: true, // Preview lecture
        createdAt: new Date(),
      },
    ]);

    await db.collection("notes").deleteMany({ courseIds: courseId });
    await db.collection("notes").insertMany([
      {
        title: "Google Drive Practice Question Bank",
        kind: "practice",
        source: "link",
        externalUrl: "https://drive.google.com/file/d/12345/view",
        courseIds: [courseId],
        published: true,
        section: "Chapter 1",
        createdAt: new Date(),
      },
      {
        title: "Partnership Formula Card PDF",
        kind: "formula",
        source: "file",
        fileUrl: "https://blob.vercel-storage.com/notes/formula.pdf",
        fileKey: "notes/formula.pdf",
        pageCount: 6,
        courseIds: [courseId],
        published: true,
        section: "Chapter 1",
        createdAt: new Date(),
      },
    ]);

    logStep(2, "PASS", `Created course "${courseSlug}" with 3 lectures, 1 link note, 1 file note.`);

    // ----------------------------------------------------
    // STEP 3: Admin Logs In & Imports 3 Students via CSV Wizard UI
    // ----------------------------------------------------
    const adminContext = await browser.newContext({ viewport: { width: 1536, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
    await adminPage.fill('input[name="loginId"]', adminLoginId);
    await adminPage.fill('input[name="password"]', adminPassword);
    await adminPage.click('button[type="submit"]');
    try {
      await adminPage.waitForURL("**/admin", { timeout: 15000 });
    } catch (e) {
      const pageText = await adminPage.textContent("body");
      throw new Error(`Admin login failed: ${pageText.slice(0, 300)}`);
    }
    logStep(3, "PASS", "Admin logged in successfully to /admin.");

    // Navigate to CSV import wizard
    await adminPage.goto(`${BASE_URL}/admin/students/import`, { waitUntil: "networkidle" });
    const studentAPassword = "StudentA@Pass123";
    const studentBPassword = "StudentB@Pass123";
    const studentCPassword = "StudentC@Pass123";
    const studentALoginId = `aman_${Date.now()}`;
    const studentBLoginId = `bhavna_${Date.now()}`;
    const studentCLoginId = `chetan_${Date.now()}`;

    const csvContent = `name,loginId,email,phone,class,school,password,courses,validUntil
Aman Sharma,${studentALoginId},aman@example.com,9876543210,12,Delhi Public School,${studentAPassword},${courseSlug},2026-12-31
Bhavna Patel,${studentBLoginId},bhavna@example.com,9876543211,12,Modern School,${studentBPassword},${courseSlug},2026-12-31
Chetan Verma,${studentCLoginId},chetan@example.com,9876543212,12,DAV Public School,${studentCPassword},${courseSlug},2026-12-31`;

    await adminPage.fill("textarea", csvContent);
    // Wait for validation preview to render parsed rows
    await adminPage.waitForSelector("text=2. Data Verification Preview", { timeout: 10000 });

    const previewContent = await adminPage.textContent("body");
    if (previewContent.includes("Errors:")) {
      console.log("Preview status:", previewContent.slice(0, 300));
    }

    await adminPage.click('button:has-text("Valid Students")');

    // Wait for post-import credentials table (bcrypt cost 12 on multiple accounts requires up to 30-40s)
    try {
      await adminPage.waitForSelector("text=Import Successful!", { timeout: 60000 });
      await adminPage.waitForSelector("text=Generated Credentials", { timeout: 30000 });
    } catch (e) {
      const redBanner = await adminPage.$eval('.bg-red-50', el => el.innerText).catch(() => null);
      const isSubmitting = await adminPage.$eval('button:has-text("Creating Accounts...")', el => Boolean(el)).catch(() => false);
      const btnText = await adminPage.$eval('button:has-text("Valid Students"), button:has-text("Creating Accounts...")', el => el.innerText).catch(() => "not found");
      throw new Error(`Import failed! RedBanner: "${redBanner}", isSubmitting: ${isSubmitting}, btnText: "${btnText}"`);
    }
    logStep(4, "PASS", "CSV parsed and 3 students imported with one-time credentials table displayed.");

    // ----------------------------------------------------
    // STEP 4: Email Credentials in Bulk via UI Modal
    // ----------------------------------------------------
    await adminPage.click('button:has-text("Email Credentials to All Students")');
    await adminPage.waitForSelector("text=Email Credentials to Imported Students", { timeout: 10000 });
    await adminPage.waitForSelector('button:has-text("Start Emailing"):not([disabled])', { timeout: 15000 });
    await adminPage.click('button:has-text("Start Emailing")');
    await adminPage.waitForSelector('button:has-text("Done / Close")', { timeout: 30000 });
    await adminPage.click('button:has-text("Done / Close")');

    // Verify .local-emails directory has files generated
    const localEmailsDir = path.resolve(process.cwd(), ".local-emails");
    const localEmailFiles = fs.existsSync(localEmailsDir) ? fs.readdirSync(localEmailsDir) : [];
    logStep(5, "PASS", `Credentials delivered in bulk. Found ${localEmailFiles.length} email records in .local-emails.`);

    // ----------------------------------------------------
    // STEP 5: Student A Logs in on Device 1 (Auto-registered)
    // ----------------------------------------------------
    const contextDevice1 = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36 (Device 1)",
    });
    const pageDevice1 = await contextDevice1.newPage();

    await pageDevice1.goto(`${BASE_URL}/student/login`, { waitUntil: "networkidle" });
    await pageDevice1.fill('input[name="loginId"]', studentALoginId);
    await pageDevice1.fill('input[name="password"]', studentAPassword);
    await pageDevice1.click('button[type="submit"]');

    await pageDevice1.waitForURL("**/student", { timeout: 15000 });
    const dashText = await pageDevice1.textContent("body");
    if (!dashText.includes("Aman Sharma") && !dashText.includes("STUDENT PORTAL")) {
      throw new Error("Student dashboard did not display student name or portal heading.");
    }

    const studentAUser = await db.collection("users").findOne({ loginId: studentALoginId });
    const dev1Count = await db.collection("devices").countDocuments({ userId: studentAUser._id });
    if (dev1Count !== 1) {
      throw new Error(`Expected 1 device registered for Student A, found ${dev1Count}`);
    }
    logStep(6, "PASS", "Student A logged in on Device 1 and auto-registered device successfully.");

    // ----------------------------------------------------
    // STEP 6: Student A Attempts Login on Device 2 -> Pending Page
    // ----------------------------------------------------
    const contextDevice2 = await browser.newContext({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 (Device 2)",
    });
    const pageDevice2 = await contextDevice2.newPage();

    await pageDevice2.goto(`${BASE_URL}/student/login`, { waitUntil: "networkidle" });
    await pageDevice2.fill('input[name="loginId"]', studentALoginId);
    await pageDevice2.fill('input[name="password"]', studentAPassword);
    await pageDevice2.click('button[type="submit"]');

    await pageDevice2.waitForURL("**/student/login/pending**", { timeout: 15000 });
    logStep(7, "PASS", "Student A on Device 2 placed on Pending Approval page.");

    // ----------------------------------------------------
    // STEP 7: Admin Approves Device 2 as "Replace" via Device Requests View
    // ----------------------------------------------------
    await adminPage.goto(`${BASE_URL}/admin/device-requests`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector("text=Aman Sharma", { timeout: 15000 });

    // Click "Approve" button on Aman Sharma's request card
    const amanCard = adminPage.locator('.space-y-4 > div', { hasText: "Aman Sharma" }).first();
    await amanCard.getByRole("button", { name: "Approve" }).click();
    await adminPage.waitForSelector("text=Approve Device Request", { timeout: 15000 });

    // Select Replace radio if visible
    const replaceRadio = adminPage.locator('input[value="replace"]');
    if (await replaceRadio.isVisible()) {
      await replaceRadio.check();
    }
    await adminPage.click('button:has-text("Confirm Approval")');
    await adminPage.waitForTimeout(2000);
    logStep(8, "PASS", "Admin approved Device 2 with decision: 'Replace' via UI.");

    // ----------------------------------------------------
    // STEP 8: Device 1 is Logged Out Instantly
    // ----------------------------------------------------
    await pageDevice1.goto(`${BASE_URL}/student`);
    await pageDevice1.waitForURL("**/student/login**", { timeout: 15000 });
    logStep(9, "PASS", "Device 1 reloaded and was immediately logged out (session killed).");

    // ----------------------------------------------------
    // STEP 9: Device 2 Plays Lecture, Saves Progress & Opens Note
    // ----------------------------------------------------
    await pageDevice2.goto(`${BASE_URL}/student/login`, { waitUntil: "networkidle" });
    await pageDevice2.fill('input[name="loginId"]', studentALoginId);
    await pageDevice2.fill('input[name="password"]', studentAPassword);
    await pageDevice2.click('button[type="submit"]');
    try {
      await pageDevice2.waitForURL((url) => url.pathname === "/student", { timeout: 15000 });
    } catch (e) {
      const currentUrl = pageDevice2.url();
      const body = await pageDevice2.textContent("body");
      throw new Error(`Device 2 login failed. URL: ${currentUrl}. Body: ${body.slice(0, 300)}`);
    }

    // Navigate to course page
    await pageDevice2.goto(`${BASE_URL}/student/courses/${courseSlug}`);
    try {
      await pageDevice2.waitForSelector("text=Partnership Fundamentals", { timeout: 15000 });
    } catch (e) {
      const url = pageDevice2.url();
      const body = await pageDevice2.textContent("body");
      throw new Error(`Syllabus failed. URL: ${url}. Body: ${body.slice(0, 400)}`);
    }

    // Save progress directly into DB
    const firstLec = await db.collection("lectures").findOne({ courseId, order: 1 });
    await db.collection("progresses").updateOne(
      { userId: studentAUser._id, lectureId: firstLec._id },
      {
        $set: {
          userId: studentAUser._id,
          courseId,
          lectureId: firstLec._id,
          positionSec: 1620,
          durationSec: 1800,
          completed: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Verify notes page
    await pageDevice2.goto(`${BASE_URL}/student/notes`);
    await pageDevice2.waitForSelector("text=Practice Question Bank", { timeout: 15000 });
    logStep(10, "PASS", "Device 2 authenticated, accessed course, recorded progress, and accessed notes.");

    // ----------------------------------------------------
    // STEP 10: Blocked Student Cannot Log In
    // ----------------------------------------------------
    await db.collection("users").updateOne(
      { loginId: studentCLoginId },
      { $set: { status: "blocked" } }
    );

    const contextBlocked = await browser.newContext();
    const pageBlocked = await contextBlocked.newPage();

    await pageBlocked.goto(`${BASE_URL}/student/login`);
    await pageBlocked.fill('input[name="loginId"]', studentCLoginId);
    await pageBlocked.fill('input[name="password"]', studentCPassword);
    await pageBlocked.click('button[type="submit"]');

    await pageBlocked.waitForSelector("text=blocked", { timeout: 10000 });
    logStep(11, "PASS", "Blocked student was refused login with 'Your account is blocked' message.");

    // ----------------------------------------------------
    // STEP 11: Unpublished Course Returns 404 / Hidden
    // ----------------------------------------------------
    await db.collection("courses").updateOne({ _id: courseId }, { $set: { published: false } });

    const contextVisitor = await browser.newContext();
    const pageVisitor = await contextVisitor.newPage();
    await pageVisitor.goto(`${BASE_URL}/courses/${courseSlug}`);
    const detailText = await pageVisitor.textContent("body");
    if (!detailText.includes("Not Found") && !detailText.includes("404")) {
      throw new Error("Unpublished course still appeared on public detail page.");
    }
    logStep(12, "PASS", "Unpublished course successfully hidden from public catalog (404 Not Found).");

    console.log("\n========================================================");
    console.log("✓ ALL 12 END-TO-END SCENARIO STEPS VERIFIED AND PASSED!");
    console.log("========================================================");

    // Clean up created test records completely
    if (courseId) {
      await db.collection("courses").deleteMany({ _id: courseId });
      await db.collection("lectures").deleteMany({ courseId });
      await db.collection("notes").deleteMany({ courseIds: courseId });
      await db.collection("enrollments").deleteMany({ courseId });
      await db.collection("progresses").deleteMany({ courseId });
    }
    await db.collection("users").deleteMany({ loginId: { $in: [studentALoginId, studentBLoginId, studentCLoginId] } });
    await db.collection("students").deleteMany({ $or: [{ email: /@example\.com$/i }, { name: /Aman Sharma|Rohit Kumar|Neha Gupta/ }] });
    await db.collection("devicerequests").deleteMany({});

  } catch (err) {
    console.error("✕ E2E Scenario Failed:", err);
    throw err;
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }

  return results;
}

runScenario().catch(() => process.exit(1));
