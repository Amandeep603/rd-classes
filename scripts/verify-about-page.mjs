import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const BASE_URL = "http://localhost:3000";
const artifactDir = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";

async function verifyAboutPage() {
  console.log("=== Testing About Page ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Navigation and Active Link in Navbar
  await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle" });
  console.log("Page loaded:", page.url());

  // Check Navbar About active underline
  const aboutNavActive = await page.evaluate(() => {
    const aboutLink = Array.from(document.querySelectorAll("header nav a")).find(
      (a) => a.textContent.trim() === "About"
    );
    if (!aboutLink) return { found: false };
    const underline = aboutLink.querySelector("span.bg-\\[\\#FFB800\\]");
    return {
      found: true,
      text: aboutLink.textContent.trim(),
      hasUnderline: !!underline,
      classes: aboutLink.className,
    };
  });
  console.log("Navbar About Active State:", aboutNavActive);

  // Check WhatsApp link in CTA banner
  const whatsappLinkInfo = await page.evaluate(() => {
    const waLink = Array.from(document.querySelectorAll("a")).find(
      (a) => a.textContent.trim() === "WhatsApp"
    );
    if (!waLink) return null;
    return {
      href: waLink.getAttribute("href"),
      target: waLink.getAttribute("target"),
      rel: waLink.getAttribute("rel"),
    };
  });
  console.log("WhatsApp Link:", whatsappLinkInfo);

  // Check Explore Courses button
  const exploreCoursesInfo = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("a")).find((a) =>
      a.textContent.includes("Explore Courses")
    );
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return {
      href: btn.getAttribute("href"),
      height: rect.height,
      width: rect.width,
    };
  });
  console.log("Explore Courses Button:", exploreCoursesInfo);

  // Check 1 H1 only
  const h1Count = await page.evaluate(() => document.querySelectorAll("h1").length);
  const h1Text = await page.evaluate(() => document.querySelector("h1")?.innerText);
  console.log("H1 Count:", h1Count, "H1 Text:", JSON.stringify(h1Text));

  // Test 2: Horizontal Overflow across widths
  const widths = [320, 360, 390, 768, 1024, 1280, 1440, 1920];
  const overflowResults = {};
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    overflowResults[w] = overflow;
    console.log(`Viewport ${w}px overflow check:`, overflow);
  }

  // Test 3: Capture Full Page Screenshots at 1024, 1440, 768, 390
  const screenshotViewports = [
    { w: 1024, h: 900, name: "about_desktop_1024px.png" },
    { w: 1440, h: 900, name: "about_desktop_1440px.png" },
    { w: 768, h: 1024, name: "about_tablet_768px.png" },
    { w: 390, h: 844, name: "about_mobile_390px.png" },
  ];

  for (const vp of screenshotViewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(500);
    const savePath = path.join(artifactDir, vp.name);
    await page.screenshot({ path: savePath, fullPage: true });
    console.log(`Saved screenshot: ${vp.name}`);
  }

  // Test 4: Button click test
  await page.setViewportSize({ width: 1024, height: 900 });
  const exploreBtn = page.locator('a:has-text("Explore Courses")').last();
  await exploreBtn.click();
  await page.waitForURL("**/courses");
  console.log("Explore Courses Click Navigated successfully to:", page.url());

  await browser.close();

  // Test 5: Create a side-by-side comparison image at 1024px
  const referenceMockupPath =
    "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66/.user_uploaded/media_1793485590487_0dd932d9.jpg";
  const rendered1024Path = path.join(artifactDir, "about_desktop_1024px.png");

  if (fs.existsSync(referenceMockupPath) && fs.existsSync(rendered1024Path)) {
    const refMeta = await sharp(referenceMockupPath).metadata();
    const rendMeta = await sharp(rendered1024Path).metadata();

    const targetHeight = 1400;
    const refResized = await sharp(referenceMockupPath)
      .resize({ height: targetHeight })
      .toBuffer();
    const rendResized = await sharp(rendered1024Path)
      .resize({ height: targetHeight })
      .toBuffer();

    const refInfo = await sharp(refResized).metadata();
    const rendInfo = await sharp(rendResized).metadata();

    const compositeWidth = refInfo.width + rendInfo.width + 20;
    const sideBySide = await sharp({
      create: {
        width: compositeWidth,
        height: targetHeight,
        channels: 3,
        background: { r: 240, g: 240, b: 240 },
      },
    })
      .composite([
        { input: refResized, left: 0, top: 0 },
        { input: rendResized, left: refInfo.width + 20, top: 0 },
      ])
      .png()
      .toFile(path.join(artifactDir, "about_1024px_side_by_side.png"));

    console.log("Created side-by-side comparison artifact: about_1024px_side_by_side.png");
  }

  console.log("=== All Tests Completed Successfully ===");
}

verifyAboutPage().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

