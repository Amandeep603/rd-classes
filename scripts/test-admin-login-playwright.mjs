import fs from "fs";
import path from "path";
import { chromium } from "playwright";

// Load .env.local without exposing values
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

const adminLoginId = process.env.ADMIN_LOGIN_ID;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminLoginId || !adminPassword) {
  console.error("FAIL: Missing ADMIN_LOGIN_ID or ADMIN_PASSWORD in environment.");
  process.exit(1);
}

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${baseUrl}/admin/login ...`);
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle", timeout: 15000 });

    // Verify stand-alone bar and title
    const backLink = page.locator('header a:has-text("Back to website")');
    const hasBackLink = (await backLink.count()) > 0;
    if (!hasBackLink) {
      console.warn("Notice: Standalone top bar back link not found on /admin/login.");
    }

    // Fill credentials
    await page.fill('input[name="loginId"]', adminLoginId);
    await page.fill('input[name="password"]', adminPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin (not /admin/login)
    await page.waitForURL((url) => url.pathname === "/admin" || (url.pathname.startsWith("/admin") && !url.pathname.includes("/admin/login")), {
      timeout: 15000,
    });

    console.log(`✓ Admin login verified successfully! Current URL: ${page.url()}`);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error("FAIL: Admin login test failed.");
    console.error(`Current URL: ${page.url()}`);
    const errorAlert = await page.locator('[role="alert"]').textContent().catch(() => null);
    if (errorAlert) {
      console.error(`Page error message: "${errorAlert.trim()}"`);
    } else {
      console.error(`Error details: ${err.message}`);
    }
    await browser.close();
    process.exit(1);
  }
}

run();
