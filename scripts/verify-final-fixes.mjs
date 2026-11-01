import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const BASE_URL = "http://localhost:3000";
const REF_IMAGE = path.join(ARTIFACT_DIR, ".user_uploaded/media_1793517731239_0c5c88af.jpg");

async function run() {
  console.log("=== STARTING FINAL ABOUT PAGE FIXES VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop_1440px", width: 1440, height: 900 },
    { name: "desktop_1024px", width: 1024, height: 800 },
    { name: "tablet_768px", width: 768, height: 1024 },
    { name: "mobile_390px", width: 390, height: 844 },
    { name: "mobile_320px", width: 320, height: 600 },
  ];

  const results = {
    viewports: [],
    noJsTest: null,
    fiveSecondCheck: [],
    overflowCheck: [],
    screenshots: [],
    sideBySide: [],
  };

  // 1. Test viewports with JS enabled (and 5-second wait)
  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    const consoleLogs = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
    
    // Explicit 5-second wait as requested
    console.log("Waiting 5 seconds to verify no disappearance after hydration...");
    await page.waitForTimeout(5000);

    // Assert visibility of all 5 target sections
    const sectionCheck = await page.evaluate(() => {
      const targets = [
        { name: "Hero H1", sel: "#about-hero-heading" },
        { name: "Hero Photo Card", sel: "main section:first-of-type img" },
        { name: "Founder Card", sel: "section[aria-label='Founder and Mentor Profile']" },
        { name: "Pillar Card 01", sel: "article:nth-of-type(1)" },
        { name: "Pillar Card 02", sel: "article:nth-of-type(2)" },
        { name: "Pillar Card 03", sel: "article:nth-of-type(3)" },
        { name: "CTA Section", sel: "section[aria-label='Accountancy Preparation Call to Action']" },
      ];

      return targets.map((t) => {
        const el = document.querySelector(t.sel);
        if (!el) return { name: t.name, exists: false };
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          name: t.name,
          exists: true,
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          isVisible: cs.display !== "none" && cs.visibility === "visible" && parseFloat(cs.opacity) >= 0.99 && rect.width > 0 && rect.height > 0,
        };
      });
    });

    console.log("Section checks after 5s:", sectionCheck.map(s => `${s.name}: isVisible=${s.isVisible} (${s.width}x${s.height})`));

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
      };
    });
    console.log(`Overflow check: clientWidth=${overflow.clientWidth}, scrollWidth=${overflow.scrollWidth}, hasHorizontalScroll=${overflow.hasHorizontalScroll}`);

    // Capture screenshot
    const screenshotPath = path.join(ARTIFACT_DIR, `about_${vp.name}_final.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshots.push({ viewport: vp.name, path: screenshotPath });

    results.viewports.push({
      viewport: vp.name,
      sectionCheck,
      overflow,
      consoleLogs,
    });

    await page.close();
  }

  // 2. Test with JAVASCRIPT DISABLED
  console.log("\n--- Testing with JavaScript DISABLED ---");
  const noJsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
  await noJsPage.waitForTimeout(500);

  const noJsScreenshotPath = path.join(ARTIFACT_DIR, "about_no_js_1440px_final.png");
  await noJsPage.screenshot({ path: noJsScreenshotPath, fullPage: true });

  const noJsCheck = await noJsPage.evaluate(() => {
    const targets = [
      { name: "Hero H1", sel: "#about-hero-heading" },
      { name: "Hero Photo Card", sel: "main section:first-of-type img" },
      { name: "Founder Card", sel: "section[aria-label='Founder and Mentor Profile']" },
      { name: "Pillars", sel: "section[aria-labelledby='pillars-heading']" },
      { name: "CTA", sel: "section[aria-label='Accountancy Preparation Call to Action']" },
    ];
    return targets.map((t) => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, exists: false };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        name: t.name,
        exists: true,
        isVisible: cs.display !== "none" && cs.visibility === "visible" && parseFloat(cs.opacity) >= 0.99 && rect.width > 0 && rect.height > 0,
      };
    });
  });
  console.log("No-JS Check results:", noJsCheck);
  results.noJsTest = noJsCheck;
  await noJsContext.close();

  // 3. Generate side-by-side comparison images
  console.log("\n--- Generating Side-by-Side Comparisons with Reference ---");
  if (fs.existsSync(REF_IMAGE)) {
    for (const vpName of ["desktop_1440px", "desktop_1024px"]) {
      const actualPath = path.join(ARTIFACT_DIR, `about_${vpName}_final.png`);
      if (fs.existsSync(actualPath)) {
        const targetHeight = 1600;
        const refResized = await sharp(REF_IMAGE)
          .resize({ height: targetHeight, fit: "inside" })
          .toBuffer();
        const refMeta = await sharp(refResized).metadata();

        const actualResized = await sharp(actualPath)
          .resize({ height: targetHeight, fit: "inside" })
          .toBuffer();
        const actualMeta = await sharp(actualResized).metadata();

        const totalWidth = refMeta.width + actualMeta.width + 40;
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
            { input: refResized, top: 40, left: 15 },
            { input: actualResized, top: 40, left: refMeta.width + 25 },
          ])
          .png()
          .toBuffer();

        const sbsPath = path.join(ARTIFACT_DIR, `about_${vpName}_vs_ref.png`);
        fs.writeFileSync(sbsPath, sbsBuffer);
        console.log(`Saved side-by-side: ${sbsPath}`);
        results.sideBySide.push({ viewport: vpName, path: sbsPath });
      }
    }
  }

  await browser.close();
  console.log("\n=== VERIFICATION FINISHED SUCCESSFULLY ===");
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "about_final_fixes_results.json"),
    JSON.stringify(results, null, 2)
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

