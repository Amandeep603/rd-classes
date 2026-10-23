import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const outDir = path.resolve(process.cwd(), "docs", "screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // 1600px width
  const context1600 = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
  });
  const page1600 = await context1600.newPage();
  await page1600.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page1600.screenshot({
    path: path.join(outDir, "marketing-before-1600.png"),
    fullPage: false,
  });
  console.log("Saved marketing-before-1600.png");

  // 390px width
  const context390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page390 = await context390.newPage();
  await page390.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page390.screenshot({
    path: path.join(outDir, "marketing-before-390.png"),
    fullPage: false,
  });
  console.log("Saved marketing-before-390.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
