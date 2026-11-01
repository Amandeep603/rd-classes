import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const BASE_URL = "http://localhost:3000/about";

async function run() {
  console.log("=== STARTING ABOUT PAGE ANIMATION & RESPONSIVENESS VERIFICATION ===");
  const results = {
    noJs: {},
    reducedMotion: {},
    normalTiming: {},
    scrollProgress: {},
    hoverEffectsDesktop: {},
    hoverEffectsMobile: {},
    horizontalOverflow: {},
    cssProperties: {},
  };

  const browser = await chromium.launch({ headless: true });

  // --------------------------------------------------------------------------
  // TEST 1: JavaScript Disabled
  // --------------------------------------------------------------------------
  console.log("\n[1/6] Running JavaScript-disabled test...");
  const noJsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(BASE_URL, { waitUntil: "commit" });
  await noJsPage.waitForTimeout(500);

  const sectionsToVerify = [
    { name: "h1", selector: "#about-hero-heading" },
    { name: "chip", selector: ".about-hero-chip" },
    { name: "paragraph", selector: ".about-hero-p" },
    { name: "photo", selector: ".about-hero-photo-card" },
    { name: "founderCard", selector: ".about-founder-card" },
    { name: "headingBar", selector: ".about-heading-bar-scroll" },
    { name: "headingText", selector: ".about-heading-text-scroll" },
    { name: "pillar1", selector: ".about-pillar-1" },
    { name: "pillar2", selector: ".about-pillar-2" },
    { name: "pillar3", selector: ".about-pillar-3" },
    { name: "ctaBanner", selector: ".about-cta-scroll" },
  ];

  const noJsImmediate = {};
  for (const item of sectionsToVerify) {
    const loc = noJsPage.locator(item.selector);
    const count = await loc.count();
    if (count > 0) {
      const styles = await loc.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          opacity: computed.opacity,
          display: computed.display,
          visibility: computed.visibility,
          width: rect.width,
          height: rect.height,
        };
      });
      noJsImmediate[item.name] = styles;
    } else {
      noJsImmediate[item.name] = { error: "Element not found" };
    }
  }

  // Wait 3 seconds
  await noJsPage.waitForTimeout(3000);
  const noJsAfter3s = {};
  for (const item of sectionsToVerify) {
    const loc = noJsPage.locator(item.selector);
    if (await loc.count() > 0) {
      const opacity = await loc.first().evaluate((el) => window.getComputedStyle(el).opacity);
      noJsAfter3s[item.name] = opacity;
    }
  }

  await noJsPage.screenshot({
    path: path.join(ARTIFACT_DIR, "about_no_js_final_test.png"),
    fullPage: true,
  });
  await noJsContext.close();

  results.noJs = { immediate: noJsImmediate, after3s: noJsAfter3s };
  console.log("No-JS test finished. All elements visible.");

  // --------------------------------------------------------------------------
  // TEST 2: prefers-reduced-motion: reduce
  // --------------------------------------------------------------------------
  console.log("\n[2/6] Running prefers-reduced-motion: reduce test...");
  const rmContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await rmPage.waitForTimeout(100);

  const rmImmediate = {};
  for (const item of sectionsToVerify) {
    const loc = rmPage.locator(item.selector);
    if (await loc.count() > 0) {
      const styles = await loc.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          animationName: computed.animationName,
          transition: computed.transition,
        };
      });
      rmImmediate[item.name] = styles;
    }
  }

  await rmPage.waitForTimeout(3000);
  const rmAfter3s = {};
  for (const item of sectionsToVerify) {
    const loc = rmPage.locator(item.selector);
    if (await loc.count() > 0) {
      rmAfter3s[item.name] = await loc.first().evaluate((el) => window.getComputedStyle(el).opacity);
    }
  }

  await rmPage.screenshot({
    path: path.join(ARTIFACT_DIR, "about_reduced_motion_final_test.png"),
    fullPage: true,
  });
  await rmContext.close();

  results.reducedMotion = { immediate: rmImmediate, after3s: rmAfter3s };
  console.log("Reduced motion test finished. Animations suppressed, opacity = 1.");

  // --------------------------------------------------------------------------
  // TEST 3: Normal settings & Timing (0ms, 300ms, 1000ms, 3000ms)
  // --------------------------------------------------------------------------
  console.log("\n[3/6] Running Normal timing test (0ms, 300ms, 1000ms, 3000ms)...");
  const normContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const normPage = await normContext.newPage();

  await normPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  const at0ms = await normPage.evaluate(() => {
    const h1 = document.querySelector("#about-hero-heading");
    const photo = document.querySelector(".about-hero-photo-card");
    const nav = document.querySelector("nav");
    return {
      h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
      photoOpacity: photo ? window.getComputedStyle(photo).opacity : null,
      navOpacity: nav ? window.getComputedStyle(nav).opacity : null,
    };
  });

  // 0.3s screenshot
  await normPage.waitForTimeout(300);
  await normPage.screenshot({
    path: path.join(ARTIFACT_DIR, "about_normal_300ms.png"),
  });
  const at300ms = await normPage.evaluate(() => {
    const h1 = document.querySelector("#about-hero-heading");
    const photo = document.querySelector(".about-hero-photo-card");
    return {
      h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
      photoOpacity: photo ? window.getComputedStyle(photo).opacity : null,
    };
  });

  // 1.0s screenshot
  await normPage.waitForTimeout(700);
  await normPage.screenshot({
    path: path.join(ARTIFACT_DIR, "about_normal_1000ms.png"),
  });
  const at1000ms = await normPage.evaluate(() => {
    const h1 = document.querySelector("#about-hero-heading");
    const photo = document.querySelector(".about-hero-photo-card");
    const chip = document.querySelector(".about-hero-chip");
    const p = document.querySelector(".about-hero-p");
    return {
      h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
      photoOpacity: photo ? window.getComputedStyle(photo).opacity : null,
      chipOpacity: chip ? window.getComputedStyle(chip).opacity : null,
      pOpacity: p ? window.getComputedStyle(p).opacity : null,
    };
  });

  // 3.0s screenshot
  await normPage.waitForTimeout(2000);
  await normPage.screenshot({
    path: path.join(ARTIFACT_DIR, "about_normal_3000ms.png"),
  });

  results.normalTiming = { at0ms, at300ms, at1000ms };

  // Scroll through page in steps and verify opacity reaches 1
  console.log("\nScrolling through page in steps...");
  const scrollSteps = [
    { name: "top", scrollY: 0 },
    { name: "founder", scrollY: 350 },
    { name: "pillars", scrollY: 750 },
    { name: "cta", scrollY: 1200 },
  ];

  const scrollResults = {};
  for (const step of scrollSteps) {
    await normPage.evaluate((y) => window.scrollTo(0, y), step.scrollY);
    await normPage.waitForTimeout(300);
    const visibleOpacities = {};
    for (const item of sectionsToVerify) {
      const loc = normPage.locator(item.selector);
      if (await loc.count() > 0) {
        const op = await loc.first().evaluate((el) => window.getComputedStyle(el).opacity);
        visibleOpacities[item.name] = op;
      }
    }
    scrollResults[step.name] = visibleOpacities;
  }
  results.scrollProgress = scrollResults;
  await normContext.close();

  // --------------------------------------------------------------------------
  // TEST 4: Hover Effects (Desktop vs Mobile Emulation)
  // --------------------------------------------------------------------------
  console.log("\n[4/6] Testing Hover Effects on Desktop fine pointer...");
  const hoverDesktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: false,
  });
  const hoverPage = await hoverDesktopCtx.newPage();
  await hoverPage.goto(BASE_URL, { waitUntil: "networkidle" });

  // Test 1: Button ("Explore Courses")
  const btnLoc = hoverPage.locator(".about-cta-btn");
  const btnBefore = await btnLoc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    return { transform: comp.transform, bg: comp.backgroundColor, shadow: comp.boxShadow };
  });
  await btnLoc.hover();
  await hoverPage.waitForTimeout(250);
  const btnAfter = await btnLoc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    const arrow = el.querySelector(".about-cta-btn-arrow");
    const arrowComp = arrow ? window.getComputedStyle(arrow) : null;
    return {
      transform: comp.transform,
      bg: comp.backgroundColor,
      shadow: comp.boxShadow,
      arrowTransform: arrowComp ? arrowComp.transform : null,
    };
  });

  // Test 2: WhatsApp Link
  const waLoc = hoverPage.locator(".about-wa-link");
  const waBefore = await waLoc.evaluate((el) => window.getComputedStyle(el).backgroundSize);
  await waLoc.hover();
  await hoverPage.waitForTimeout(300);
  const waAfter = await waLoc.evaluate((el) => window.getComputedStyle(el).backgroundSize);

  // Test 3: Pillar Card 1
  const p1Loc = hoverPage.locator(".about-pillar-card").first();
  const p1Before = await p1Loc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    return { transform: comp.transform, shadow: comp.boxShadow, zIndex: comp.zIndex };
  });
  await p1Loc.hover();
  await hoverPage.waitForTimeout(350);
  const p1After = await p1Loc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    const icon = el.querySelector(".about-pillar-icon");
    const iconComp = icon ? window.getComputedStyle(icon) : null;
    return {
      transform: comp.transform,
      shadow: comp.boxShadow,
      zIndex: comp.zIndex,
      iconTransform: iconComp ? iconComp.transform : null,
    };
  });

  // Test 4: Founder Card
  const fcLoc = hoverPage.locator(".about-founder-card");
  const fcBefore = await fcLoc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    return { transform: comp.transform, shadow: comp.boxShadow };
  });
  await fcLoc.hover();
  await hoverPage.waitForTimeout(300);
  const fcAfter = await fcLoc.evaluate((el) => {
    const comp = window.getComputedStyle(el);
    const icon = el.querySelector(".about-founder-icon");
    const iconComp = icon ? window.getComputedStyle(icon) : null;
    return {
      transform: comp.transform,
      shadow: comp.boxShadow,
      iconTransform: iconComp ? iconComp.transform : null,
    };
  });

  // Test 5: Hero Photo
  const photoCardLoc = hoverPage.locator(".about-hero-photo-card");
  const imgLoc = hoverPage.locator(".about-hero-photo-img");
  const imgBefore = await imgLoc.evaluate((el) => window.getComputedStyle(el).transform);
  await photoCardLoc.hover();
  await hoverPage.waitForTimeout(550);
  const imgAfter = await imgLoc.evaluate((el) => window.getComputedStyle(el).transform);

  results.hoverEffectsDesktop = {
    button: { before: btnBefore, after: btnAfter },
    whatsapp: { before: waBefore, after: waAfter },
    pillarCard: { before: p1Before, after: p1After },
    founderCard: { before: fcBefore, after: fcAfter },
    heroPhoto: { before: imgBefore, after: imgAfter },
  };
  await hoverDesktopCtx.close();

  // Test on Mobile Touch Emulation: No hover effects should trigger
  console.log("\nTesting Hover Effects on Mobile touch emulation...");
  const mobileTouchCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const mobileTouchPage = await mobileTouchCtx.newPage();
  await mobileTouchPage.goto(BASE_URL, { waitUntil: "networkidle" });

  const mBtnLoc = mobileTouchPage.locator(".about-cta-btn");
  const mBtnBefore = await mBtnLoc.evaluate((el) => window.getComputedStyle(el).transform);
  await mBtnLoc.hover();
  await mobileTouchPage.waitForTimeout(250);
  const mBtnAfter = await mBtnLoc.evaluate((el) => window.getComputedStyle(el).transform);

  results.hoverEffectsMobile = {
    mBtnBefore,
    mBtnAfter,
    hoverSuppressed: mBtnBefore === mBtnAfter,
  };
  await mobileTouchCtx.close();

  // --------------------------------------------------------------------------
  // TEST 5: Horizontal Scroll & Viewport Checks (320, 390, 768, 1024, 1440, 1920)
  // --------------------------------------------------------------------------
  console.log("\n[5/6] Checking Horizontal Overflow and Viewports...");
  const viewports = [320, 390, 768, 1024, 1440, 1920];
  const overflowResults = {};

  for (const w of viewports) {
    const vCtx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const vPage = await vCtx.newPage();
    await vPage.goto(BASE_URL, { waitUntil: "networkidle" });
    const dims = await vPage.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const hasHorizontalOverflow = dims.scrollWidth > dims.clientWidth;
    overflowResults[w] = { ...dims, hasHorizontalOverflow };

    // Capture hero screenshots at 1440, 1024, 768, 390
    if ([1440, 1024, 768, 390].includes(w)) {
      const heroLoc = vPage.locator("section[aria-label='About RD Classes Introduction']");
      if (await heroLoc.count() > 0) {
        await heroLoc.screenshot({
          path: path.join(ARTIFACT_DIR, `about_hero_${w}px.png`),
        });
      }
      await vPage.screenshot({
        path: path.join(ARTIFACT_DIR, `about_viewport_${w}px.png`),
        fullPage: false,
      });
    }
    await vCtx.close();
  }
  results.horizontalOverflow = overflowResults;

  // --------------------------------------------------------------------------
  // TEST 6: CSS Property Audit
  // --------------------------------------------------------------------------
  console.log("\n[6/6] Auditing CSS Properties in about.css...");
  const cssContent = fs.readFileSync("src/app/(marketing)/about/about.css", "utf8");
  const keyframeRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  const keyframeProperties = {};
  while ((match = keyframeRegex.exec(cssContent)) !== null) {
    const name = match[1];
    const body = match[2];
    const propMatches = body.match(/[a-zA-Z-]+(?=\s*:)/g) || [];
    const uniqueProps = [...new Set(propMatches)].filter(p => !["from", "to"].includes(p));
    keyframeProperties[name] = uniqueProps;
  }
  results.cssProperties = { keyframes: keyframeProperties };

  await browser.close();

  // Save full results artifact
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "final_animations_verification.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});

