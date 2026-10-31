import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { chromium } from "playwright";

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
const resultsDir = path.resolve(process.cwd(), "docs/lighthouse");
fs.mkdirSync(resultsDir, { recursive: true });

async function getStudentCookie() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });
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
      courses: [course._id],
      enrolledCourses: [course._id],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    studentId = res.insertedId;
  } else {
    studentId = student._id;
  }

  await db.collection("enrollments").deleteMany({ userId: studentId });
  await db.collection("enrollments").insertOne({
    userId: studentId,
    studentId,
    courseId: course._id,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await page.fill("#auth-loginId", TEST_USER);
  await page.fill("#auth-password", TEST_PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await db.collection("devices").updateMany(
    { $or: [{ studentId }, { userId: studentId }] },
    { $set: { status: "approved" } }
  );

  const cookies = await context.cookies();
  await browser.close();
  await client.close();

  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  console.log("Acquired student cookies for lighthouse:", cookieStr);
  return cookieStr;
}

async function runLighthouse() {
  const cookieHeader = await getStudentCookie();

  const routes = [
    { name: "home", path: "/" },
    { name: "courses", path: "/courses" },
    { name: "course-detail", path: "/courses/class-12-accountancy" },
    { name: "notes", path: "/notes" },
    { name: "results", path: "/results" },
    { name: "gallery", path: "/gallery" },
    { name: "about", path: "/about" },
    { name: "contact", path: "/contact" },
    { name: "student", path: "/student", auth: true },
  ];

  const suffix = process.argv[2] || "baseline";
  console.log(`\n=== Running Lighthouse Mobile Audits (${suffix}) ===\n`);

  const summary = {};

  for (const route of routes) {
    const outputPath = path.join(resultsDir, `${route.name}-${suffix}.json`);
    const targetUrl = `${BASE_URL}${route.path}`;
    console.log(`Auditing ${route.name} (${targetUrl})...`);

    let extraHeadersFlag = "";
    if (route.auth && cookieHeader) {
      const headersObj = { Cookie: cookieHeader };
      // escape quotes for Windows CLI
      const escaped = JSON.stringify(headersObj).replace(/"/g, '\\"');
      extraHeadersFlag = `--extra-headers="${escaped}"`;
    }

    try {
      const cmd = `npx -y lighthouse "${targetUrl}" --output=json --output-path="${outputPath}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate ${extraHeadersFlag} --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --quiet`;
      execSync(cmd, { stdio: "inherit" });

      const data = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

      // Calculate total JS transfer size
      const networkRequests = data.audits["network-requests"]?.details?.items || [];
      const jsRequests = networkRequests.filter(
        (r) => r.resourceType === "Script" || r.url.endsWith(".js")
      );
      const totalJsBytes = jsRequests.reduce((acc, r) => acc + (r.transferSize || 0), 0);
      const totalJsKb = Math.round(totalJsBytes / 1024);

      const scores = {
        url: route.path,
        performance: Math.round((data.categories.performance?.score || 0) * 100),
        accessibility: Math.round((data.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((data.categories["best-practices"]?.score || 0) * 100),
        seo: Math.round((data.categories.seo?.score || 0) * 100),
        lcp: data.audits["largest-contentful-paint"]?.displayValue || "N/A",
        lcpNumericMs: Math.round(data.audits["largest-contentful-paint"]?.numericValue || 0),
        cls: data.audits["cumulative-layout-shift"]?.displayValue || "0",
        tbt: data.audits["total-blocking-time"]?.displayValue || "0 ms",
        tbtNumericMs: Math.round(data.audits["total-blocking-time"]?.numericValue || 0),
        totalJsKb: `${totalJsKb} KB`,
      };

      summary[route.name] = scores;
      console.log(`Scores for ${route.name}: Perf=${scores.performance}, LCP=${scores.lcp}, CLS=${scores.cls}, TBT=${scores.tbt}, JS=${scores.totalJsKb}`);
    } catch (err) {
      console.error(`Failed to audit ${route.name}:`, err.message);
    }
  }

  const summaryPath = path.join(resultsDir, `summary-${suffix}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nLighthouse audit complete! Saved to ${summaryPath}`);
  console.table(summary);
}

runLighthouse().catch(console.error);

