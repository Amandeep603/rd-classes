import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const BASE_URL = "http://localhost:3000";
const REF_IMAGE = path.join(process.cwd(), "reference/about-design.png");

async function samplePixel(img, x, y, size = 3) {
  const meta = await img.metadata();
  const clampedX = Math.max(0, Math.min(meta.width - size, Math.round(x - size / 2)));
  const clampedY = Math.max(0, Math.min(meta.height - size, Math.round(y - size / 2)));
  const patch = await img.clone().extract({ left: clampedX, top: clampedY, width: size, height: size }).raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0;
  const pixels = patch.data.length / patch.info.channels;
  for (let i = 0; i < patch.data.length; i += patch.info.channels) {
    r += patch.data[i];
    g += patch.data[i + 1];
    b += patch.data[i + 2];
  }
  r = Math.round(r / pixels);
  g = Math.round(g / pixels);
  b = Math.round(b / pixels);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

async function run() {
  console.log("=== STARTING MEASURED ABOUT PAGE FIXES VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop_1024px", width: 1024, height: 800 },
    { name: "desktop_1440px", width: 1440, height: 900 },
    { name: "tablet_768px", width: 768, height: 1024 },
    { name: "mobile_390px", width: 390, height: 844 },
  ];

  const results = {
    viewports: [],
    colorTable: [],
    noJsTest: null,
    checks: {},
  };

  // 1. Test viewports with JS enabled
  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
    console.log("Waiting 5s post-hydration...");
    await page.waitForTimeout(5000);

    // Evaluate detailed styles & positions
    const pageMetrics = await page.evaluate(() => {
      const h1 = document.querySelector("#about-hero-heading");
      const h1Cs = h1 ? window.getComputedStyle(h1) : null;
      const highlight = document.querySelector("#about-hero-heading span[aria-hidden='true']");
      const highlightCs = highlight ? window.getComputedStyle(highlight) : null;

      const photo = document.querySelector("main section:first-of-type img");
      const photoRect = photo ? photo.getBoundingClientRect() : null;

      // Backdrop shape
      const backdrop = document.querySelector("main section:first-of-type div.aspect-\\[5\\/4\\] > div:first-child");
      const backdropRect = backdrop ? backdrop.getBoundingClientRect() : null;
      const backdropCs = backdrop ? window.getComputedStyle(backdrop) : null;

      // Navbar bottom
      const navbar = document.querySelector("header");
      const navbarRect = navbar ? navbar.getBoundingClientRect() : null;
      const spaceAboveBackdrop = (backdropRect && navbarRect) ? Math.round(backdropRect.top - navbarRect.bottom) : null;

      // Pillar cards
      const pillarCards = Array.from(document.querySelectorAll("section[aria-labelledby='pillars-heading'] article")).map((c, i) => {
        const cs = window.getComputedStyle(c);
        const rect = c.getBoundingClientRect();
        return {
          cardIndex: i + 1,
          transform: cs.transform,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        };
      });

      // Bottom circles
      const bottomCircles = document.querySelector("div.relative.mt-16 > div[aria-hidden='true']");
      const bottomCirclesRect = bottomCircles ? bottomCircles.getBoundingClientRect() : null;
      const pillarsSection = document.querySelector("section[aria-labelledby='pillars-heading']");
      const pillarsRect = pillarsSection ? pillarsSection.getBoundingClientRect() : null;
      const circlesBelowPillars = (bottomCirclesRect && pillarsRect) ? bottomCirclesRect.top >= pillarsRect.bottom : null;

      // Horizontal overflow
      const doc = document.documentElement;
      const overflow = {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
      };

      return {
        h1: {
          fontFamily: h1Cs?.fontFamily,
          fontWeight: h1Cs?.fontWeight,
          color: h1Cs?.color,
          fontSize: h1Cs?.fontSize,
        },
        highlight: {
          backgroundColor: highlightCs?.backgroundColor,
          transform: highlightCs?.transform,
        },
        photo: {
          width: photoRect ? Math.round(photoRect.width) : null,
          height: photoRect ? Math.round(photoRect.height) : null,
          ratio: photoRect ? (photoRect.width / photoRect.height).toFixed(3) : null,
        },
        backdrop: {
          spaceAboveBackdrop,
          transform: backdropCs?.transform,
          backgroundColor: backdropCs?.backgroundColor,
        },
        pillarCards,
        circlesBelowPillars,
        overflow,
      };
    });

    console.log(`Metrics for ${vp.name}:`, JSON.stringify(pageMetrics, null, 2));

    const shotPath = path.join(ARTIFACT_DIR, `about_${vp.name}_measured.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Screenshot saved: ${shotPath}`);

    results.viewports.push({
      viewport: vp.name,
      metrics: pageMetrics,
      screenshot: shotPath,
    });

    await page.close();
  }

  // 2. Test with JAVASCRIPT DISABLED
  console.log("\n--- Testing with JavaScript DISABLED ---");
  const noJsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1024, height: 800 },
    deviceScaleFactor: 2,
  });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
  await noJsPage.waitForTimeout(500);

  const noJsScreenshotPath = path.join(ARTIFACT_DIR, "about_no_js_1024px_measured.png");
  await noJsPage.screenshot({ path: noJsScreenshotPath, fullPage: true });

  const noJsCheck = await noJsPage.evaluate(() => {
    const targets = [
      { name: "Hero H1", sel: "#about-hero-heading" },
      { name: "Hero Photo", sel: "main section:first-of-type img" },
      { name: "Founder Card", sel: "section[aria-label='Founder and Mentor Profile']" },
      { name: "Pillar Cards", sel: "section[aria-labelledby='pillars-heading']" },
      { name: "CTA Banner", sel: "section[aria-label='Accountancy Preparation Call to Action']" },
    ];
    return targets.map((t) => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, exists: false, isVisible: false };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        name: t.name,
        exists: true,
        isVisible: cs.display !== "none" && cs.visibility === "visible" && parseFloat(cs.opacity) >= 0.99 && rect.width > 0 && rect.height > 0,
      };
    });
  });
  console.log("No-JS checks:", noJsCheck);
  results.noJsTest = noJsCheck;
  await noJsContext.close();

  // 3. Side-by-side composite images
  console.log("\n--- Creating Side-by-Side Comparisons ---");
  if (fs.existsSync(REF_IMAGE)) {
    for (const vpName of ["desktop_1024px", "desktop_1440px"]) {
      const actualPath = path.join(ARTIFACT_DIR, `about_${vpName}_measured.png`);
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

        const sbsPath = path.join(ARTIFACT_DIR, `about_${vpName}_vs_ref_measured.png`);
        fs.writeFileSync(sbsPath, sbsBuffer);
        console.log(`Saved composite: ${sbsPath}`);
      }
    }
  }

  // 4. Sample and print color comparison table
  console.log("\n--- Generating Color Comparison Table ---");
  const refImg = sharp(REF_IMAGE);
  const liveImg = sharp(path.join(ARTIFACT_DIR, "about_desktop_1024px_measured.png"));
  const liveMeta = await liveImg.metadata();
  const refMeta = await refImg.metadata();

  const colorPoints = [
    { name: "Hero H1 Navy Text", refX: 120, refY: 140, liveX: 250, liveY: 340, expected: "#0F2342" },
    { name: "Highlight Behind Ronak Sir.", refX: 120, refY: 262, liveX: 250, liveY: 610, expected: "#FFE08A" },
    { name: "Yellow Backdrop Shape", refX: 610, refY: 110, liveX: 1720, liveY: 380, expected: "#FFC83A" },
    { name: "Hero Chip Background", refX: 100, refY: 100, liveX: 220, liveY: 250, expected: "#F5E9BD" },
    { name: "Pillar 1 Card (Top-Left)", refX: 245, refY: 560, liveX: 980, liveY: 1700, expected: "#DFEEFA" },
    { name: "Pillar 2 Card (Top-Left)", refX: 400, refY: 570, liveX: 1350, liveY: 1720, expected: "#FFF0C6" },
    { name: "Pillar 3 Card (Top-Left)", refX: 550, refY: 580, liveX: 1750, liveY: 1710, expected: "#E2F5E6" },
    { name: "CTA Banner Navy", refX: 400, refY: 880, liveX: 1000, liveY: 2750, expected: "#0F2342" },
  ];

  const table = [];
  for (const cp of colorPoints) {
    const refHex = await samplePixel(refImg, cp.refX, cp.refY, 3);
    const liveHex = await samplePixel(liveImg, cp.liveX, cp.liveY, 3);
    table.push({
      Element: cp.name,
      "Reference Sample": refHex,
      "Live Sample": liveHex,
      "Configured Token": cp.expected,
    });
  }
  console.table(table);
  results.colorTable = table;

  await browser.close();
  console.log("=== ALL MEASURED VERIFICATIONS COMPLETED ===");
  fs.writeFileSync(path.join(ARTIFACT_DIR, "measured_verification_results.json"), JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});

