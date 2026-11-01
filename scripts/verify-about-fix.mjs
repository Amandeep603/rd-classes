import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== STARTING ABOUT PAGE FIX VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop_1440px", width: 1440, height: 900 },
    { name: "desktop_1024px", width: 1024, height: 800 },
    { name: "tablet_768px", width: 768, height: 1024 },
    { name: "mobile_390px", width: 390, height: 844 },
    { name: "mobile_320px", width: 320, height: 600 },
  ];

  const results = {
    viewportsTested: [],
    jsDisabledTest: null,
    elementsVisibilityCheck: [],
    overflowCheck: [],
    interactiveCheck: null,
    screenshots: [],
  };

  // 1. Test across viewports with JS enabled
  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    const consoleMessages = [];
    const pageErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
      };
    });
    console.log(`Overflow check (${vp.width}px): clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}, hasHorizontalScroll=${overflow.hasHorizontalScroll}`);

    // Capture screenshot
    const screenshotPath = path.join(ARTIFACT_DIR, `about_${vp.name}_fixed.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshots.push({ name: vp.name, path: screenshotPath });

    results.viewportsTested.push({
      viewport: vp.name,
      width: vp.width,
      overflow,
      consoleWarnings: consoleMessages,
      pageErrors,
    });

    await page.close();
  }

  // 2. Test with JAVASCRIPT DISABLED (First Paint / Zero JS Check)
  console.log("\n--- Testing with JavaScript DISABLED (Zero-JS first paint) ---");
  const noJsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
  await noJsPage.waitForTimeout(500);

  const noJsScreenshotPath = path.join(ARTIFACT_DIR, "about_no_js_1440px.png");
  await noJsPage.screenshot({ path: noJsScreenshotPath, fullPage: true });

  const noJsCheck = await noJsPage.evaluate(() => {
    const checks = [];
    const selectors = [
      { name: "Hero Heading H1", sel: "#about-hero-heading" },
      { name: "Hero Chip", sel: "main section:first-of-type span:first-child" },
      { name: "Hero Paragraph", sel: "main section:first-of-type p" },
      { name: "Hero Photo Img", sel: "main section:first-of-type img" },
      { name: "Founder Card", sel: "section[aria-label='Founder and Mentor Profile']" },
      { name: "Founder Avatar", sel: "section[aria-label='Founder and Mentor Profile'] span" },
      { name: "Founder Name H2", sel: "section[aria-label='Founder and Mentor Profile'] h2" },
      { name: "Pillars Heading H2", sel: "#pillars-heading" },
      { name: "Pillar Card 01", sel: "article:nth-of-type(1)" },
      { name: "Pillar Card 02", sel: "article:nth-of-type(2)" },
      { name: "Pillar Card 03", sel: "article:nth-of-type(3)" },
      { name: "CTA Section", sel: "section[aria-label='Accountancy Preparation Call to Action']" },
      { name: "CTA Heading H2", sel: "section[aria-label='Accountancy Preparation Call to Action'] h2" },
      { name: "CTA Explore Button", sel: "section[aria-label='Accountancy Preparation Call to Action'] a[href='/courses']" },
      { name: "CTA WhatsApp Link", sel: "section[aria-label='Accountancy Preparation Call to Action'] a[target='_blank']" },
    ];

    for (const item of selectors) {
      const el = document.querySelector(item.sel);
      if (!el) {
        checks.push({ name: item.name, found: false });
        continue;
      }
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      checks.push({
        name: item.name,
        found: true,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        transform: cs.transform,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        isVisible: cs.display !== "none" && cs.visibility === "visible" && parseFloat(cs.opacity) >= 0.99 && rect.width > 0 && rect.height > 0,
      });
    }
    return checks;
  });

  console.log("No-JS elements check results:");
  for (const c of noJsCheck) {
    console.log(`- ${c.name}: isVisible=${c.isVisible}, opacity=${c.opacity}, visibility=${c.visibility}, size=${c.width}x${c.height}`);
  }
  results.jsDisabledTest = noJsCheck;
  await noJsContext.close();

  // 3. Test interactive elements & buttons
  console.log("\n--- Testing interactive elements & button clicks ---");
  const interactivePage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await interactivePage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });

  const ctaBtn = interactivePage.locator("section[aria-label='Accountancy Preparation Call to Action'] a[href='/courses']");
  const ctaHref = await ctaBtn.getAttribute("href");
  console.log(`CTA Button href: ${ctaHref}`);

  const waLink = interactivePage.locator("section[aria-label='Accountancy Preparation Call to Action'] a[target='_blank']");
  const waHref = await waLink.getAttribute("href");
  const waTarget = await waLink.getAttribute("target");
  const waRel = await waLink.getAttribute("rel");
  console.log(`WhatsApp Link href: ${waHref}, target: ${waTarget}, rel: ${waRel}`);

  // Click CTA button
  await ctaBtn.click();
  await interactivePage.waitForURL("**/courses");
  const navigatedUrl = interactivePage.url();
  console.log(`Successfully navigated to: ${navigatedUrl}`);

  results.interactiveCheck = {
    ctaHref,
    waHref,
    waTarget,
    waRel,
    navigatedUrl,
  };
  await interactivePage.close();

  // 4. Generate Side-by-Side Comparison image at 1024px
  console.log("\n--- Generating Side-by-Side Comparison ---");
  const refPath = path.join(ARTIFACT_DIR, ".user_uploaded/media_1793485590487_0dd932d9.jpg");
  const actualPath = path.join(ARTIFACT_DIR, "about_desktop_1024px_fixed.png");

  if (fs.existsSync(refPath) && fs.existsSync(actualPath)) {
    const refMeta = await sharp(refPath).metadata();
    const actualMeta = await sharp(actualPath).metadata();
    console.log(`Ref image size: ${refMeta.width}x${refMeta.height}`);
    console.log(`Actual screenshot size: ${actualMeta.width}x${actualMeta.height}`);

    const targetHeight = 1600;
    const refResized = await sharp(refPath)
      .resize({ height: targetHeight, fit: "inside" })
      .toBuffer();
    const refResizedMeta = await sharp(refResized).metadata();

    const actualResized = await sharp(actualPath)
      .resize({ height: targetHeight, fit: "inside" })
      .toBuffer();
    const actualResizedMeta = await sharp(actualResized).metadata();

    const totalWidth = refResizedMeta.width + actualResizedMeta.width + 40;
    const canvasHeight = targetHeight + 80;

    const sbsBuffer = await sharp({
      create: {
        width: totalWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 245, g: 245, b: 247, alpha: 1 },
      },
    })
      .composite([
        { input: refResized, top: 50, left: 15 },
        { input: actualResized, top: 50, left: refResizedMeta.width + 25 },
      ])
      .png()
      .toBuffer();

    const sbsPath = path.join(ARTIFACT_DIR, "about_1024px_side_by_side_fixed.png");
    fs.writeFileSync(sbsPath, sbsBuffer);
    console.log(`Side-by-side comparison saved to: ${sbsPath}`);
    results.sideBySidePath = sbsPath;
  }

  await browser.close();
  console.log("\n=== VERIFICATION FINISHED SUCCESSFULLY ===");
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "about_fix_verification_results.json"),
    JSON.stringify(results, null, 2)
  );
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

