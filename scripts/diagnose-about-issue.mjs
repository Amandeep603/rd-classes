import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function diagnose() {
  console.log("=== STEP 1: DIAGNOSIS OF ABOUT PAGE ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const consoleErrors = [];
  page.on("console", (msg) => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === "error" || text.includes("Hydration") || text.includes("Warning")) {
      consoleErrors.push(text);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push("Page Error: " + err.message);
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  console.log("HTTP Status:", response.status());

  // Check view source (raw HTML returned by SSR)
  const rawHtml = await page.content();
  const hasH1InHtml = rawHtml.includes("Concept-First") && rawHtml.includes("Ronak Sir.");
  const hasFounderInHtml = rawHtml.includes("Ronak Dugar") && rawHtml.includes("FOUNDER & MENTOR");
  const hasPillarsInHtml = rawHtml.includes("Our 3-Pillar Pedagogy");
  const hasCtaInHtml = rawHtml.includes("Ready to Start Accountancy");
  console.log("SSR HTML contains sections:", {
    hasH1InHtml,
    hasFounderInHtml,
    hasPillarsInHtml,
    hasCtaInHtml,
  });

  // Evaluate sections in browser
  const diagnosis = await page.evaluate(() => {
    const targets = [
      { name: "hero_h1", selector: "h1" },
      { name: "photo_card", selector: 'img[alt="Ronak Sir teaching accountancy on the whiteboard"]' },
      { name: "founder_card", selector: 'section[aria-label="Founder and Mentor Profile"]' },
      { name: "pillar_card_01", selector: 'article' },
      { name: "cta_banner", selector: 'section[aria-label="Accountancy Preparation Call to Action"]' },
      { name: "decorations_bottom", selector: "div.relative.w-full.h-16" },
    ];

    function getElementChainInfo(el) {
      if (!el) return null;
      const chain = [];
      let curr = el;
      while (curr && curr !== document.documentElement) {
        const cs = window.getComputedStyle(curr);
        chain.push({
          tag: curr.tagName.toLowerCase(),
          id: curr.id || undefined,
          className: curr.className || undefined,
          dataReveal: curr.getAttribute("data-reveal"),
          dataVisible: curr.getAttribute("data-visible"),
          opacity: cs.opacity,
          visibility: cs.visibility,
          display: cs.display,
          transform: cs.transform,
          contentVisibility: cs.contentVisibility,
          overflow: cs.overflow,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          height: cs.height,
          clientHeight: curr.clientHeight,
          rect: curr.getBoundingClientRect(),
        });
        curr = curr.parentElement;
      }
      return chain;
    }

    const htmlAttrs = {
      className: document.documentElement.className,
      dataset: { ...document.documentElement.dataset },
    };

    const targetDetails = {};
    for (const t of targets) {
      const el = document.querySelector(t.selector);
      targetDetails[t.name] = {
        found: !!el,
        chain: getElementChainInfo(el),
      };
    }

    return {
      htmlAttrs,
      targetDetails,
    };
  });

  console.log("HTML attributes:", diagnosis.htmlAttrs);
  for (const [name, data] of Object.entries(diagnosis.targetDetails)) {
    console.log(`\n--- Target: ${name} (Found: ${data.found}) ---`);
    if (data.chain) {
      data.chain.slice(0, 3).forEach((item, idx) => {
        console.log(` Level ${idx} <${item.tag}> class="${item.className || ""}" data-reveal="${item.dataReveal}":`);
        console.log(`   opacity=${item.opacity}, visibility=${item.visibility}, display=${item.display}, transform=${item.transform}, h=${item.height}`);
      });
    }
  }

  console.log("\nConsole Errors & Hydration Warnings:", consoleErrors);
  console.log("Total Console Messages:", consoleMessages.length);

  await browser.close();
}

diagnose().catch(console.error);
