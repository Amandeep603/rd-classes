import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
const PROD_URL = "https://www.rd-classes.in";

async function run() {
  console.log("=== STARTING PRODUCTION DIAGNOSIS ON https://www.rd-classes.in/about ===");
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "prod_desktop_1440px", width: 1440, height: 900 },
    { name: "prod_mobile_400px", width: 400, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    const consoleLogs = [];
    page.on("console", (msg) => {
      consoleLogs.push({ time: Date.now(), type: msg.type(), text: msg.text() });
      console.log(`[PROD CONSOLE ${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      consoleLogs.push({ time: Date.now(), type: "pageerror", text: err.message, stack: err.stack });
      console.error(`[PROD ERROR]`, err);
    });

    // Install MutationObserver and style watcher at document start
    await page.addInitScript(() => {
      window.__mutationLog = [];
      window.__visibilityLog = [];
      const startTime = performance.now();

      function logEvent(type, detail) {
        window.__mutationLog.push({
          relTime: (performance.now() - startTime).toFixed(1) + "ms",
          type,
          detail,
        });
      }

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "childList") {
            for (const node of m.removedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                logEvent("NODE_REMOVED", {
                  tag: node.tagName,
                  id: node.id,
                  className: node.className,
                  parent: m.target ? (m.target.tagName + (m.target.id ? '#' + m.target.id : '') + (m.target.className ? '.' + String(m.target.className).replace(/\s+/g, '.') : '')) : null,
                  htmlSnippet: node.outerHTML ? node.outerHTML.slice(0, 150) : "",
                });
              }
            }
            for (const node of m.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                logEvent("NODE_ADDED", {
                  tag: node.tagName,
                  id: node.id,
                  className: node.className,
                  parent: m.target ? m.target.tagName : null,
                });
              }
            }
          } else if (m.type === "attributes") {
            const target = m.target;
            logEvent("ATTR_CHANGED", {
              attributeName: m.attributeName,
              tag: target.tagName,
              id: target.id,
              className: target.className,
              oldValue: m.oldValue,
              newValue: target.getAttribute(m.attributeName),
              style: target.getAttribute("style"),
            });
          }
        }
      });

      const startObserver = () => {
        observer.observe(document.documentElement, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeOldValue: true,
        });
      };

      if (document.documentElement) {
        startObserver();
      } else {
        document.addEventListener("DOMContentLoaded", startObserver);
      }

      const checkInterval = setInterval(() => {
        const now = (performance.now() - startTime).toFixed(1) + "ms";
        const main = document.querySelector("main");
        const h1 = document.querySelector("#about-hero-heading");
        const founder = document.querySelector("section[aria-label='Founder and Mentor Profile']");
        const pillars = document.querySelector("section[aria-labelledby='pillars-heading']");
        const cta = document.querySelector("section[aria-label='Accountancy Preparation Call to Action']");

        const sample = (el) => {
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            display: cs.display,
            visibility: cs.visibility,
            opacity: cs.opacity,
            transform: cs.transform,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
          };
        };

        const state = {
          time: now,
          main: sample(main),
          h1: sample(h1),
          founder: sample(founder),
          pillars: sample(pillars),
          cta: sample(cta),
        };

        window.__visibilityLog.push(state);

        if (h1 && (window.getComputedStyle(h1).display === "none" || window.getComputedStyle(h1).visibility === "hidden" || parseFloat(window.getComputedStyle(h1).opacity) < 0.1 || !main)) {
          logEvent("CONTENT_DISAPPEARED_DETECTED", state);
        }
      }, 50);

      setTimeout(() => clearInterval(checkInterval), 5500);
    });

    console.log(`Navigating to ${PROD_URL}/about...`);
    const navStartTime = Date.now();
    await page.goto(`${PROD_URL}/about`, { waitUntil: "commit" });

    const intervals = [100, 500, 1000, 3000, 5000];
    for (const ms of intervals) {
      const elapsed = Date.now() - navStartTime;
      const wait = Math.max(0, ms - elapsed);
      if (wait > 0) await page.waitForTimeout(wait);

      const shotPath = path.join(ARTIFACT_DIR, `hider_check_${vp.name}_${ms}ms.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`Screenshot saved at ~${ms}ms -> ${shotPath}`);

      const domSummary = await page.evaluate(() => {
        const main = document.querySelector("main");
        const h1 = document.querySelector("#about-hero-heading");
        return {
          mainExists: !!main,
          mainComputed: main ? {
            display: window.getComputedStyle(main).display,
            visibility: window.getComputedStyle(main).visibility,
            opacity: window.getComputedStyle(main).opacity,
            height: main.getBoundingClientRect().height,
          } : null,
          h1Exists: !!h1,
        };
      });

      console.log(`DOM at ${ms}ms: mainExists=${domSummary.mainExists}, h1Exists=${domSummary.h1Exists}, mainComputed=${JSON.stringify(domSummary.mainComputed)}`);
    }

    const { mutationLog, visibilityLog } = await page.evaluate(() => {
      return {
        mutationLog: window.__mutationLog,
        visibilityLog: window.__visibilityLog,
      };
    });

    console.log(`\nMutation Log count: ${mutationLog.length}`);
    const interestingMutations = mutationLog.filter(m => 
      m.type === "NODE_REMOVED" || 
      m.type === "CONTENT_DISAPPEARED_DETECTED" ||
      (m.type === "ATTR_CHANGED" && (m.detail.attributeName === "class" || m.detail.attributeName === "style" || m.detail.attributeName === "data-visible"))
    );
    console.log(`Interesting mutations (${interestingMutations.length}):`);
    console.log(JSON.stringify(interestingMutations.slice(0, 30), null, 2));

    console.log("\nVisibility Timeline (first 10 samples and any change):");
    let lastH1Vis = null;
    for (const v of visibilityLog) {
      const curH1Vis = v.h1 ? `${v.h1.display}/${v.h1.visibility}/${v.h1.opacity}/h=${v.h1.height}` : "null";
      if (curH1Vis !== lastH1Vis) {
        console.log(`At ${v.time}: H1 changed -> ${curH1Vis}, main=${v.main ? `${v.main.display}/${v.main.visibility}/${v.main.opacity}/h=${v.main.height}` : "null"}`);
        lastH1Vis = curH1Vis;
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("=== PROD DIAGNOSIS COMPLETE ===");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

