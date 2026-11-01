import { chromium } from "playwright";
import fs from "node:fs";

async function testHome() {
  console.log("=== TESTING HOME PAGE FOR FLASH & VANISH ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    window.__vanished = [];
    setInterval(() => {
      const sections = document.querySelectorAll("section");
      sections.forEach((sec, idx) => {
        const cs = window.getComputedStyle(sec);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.1) {
          window.__vanished.push({ idx, id: sec.id, class: sec.className, opacity: cs.opacity, display: cs.display });
        }
      });
    }, 50);
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const homeVanished = await page.evaluate(() => window.__vanished);
  console.log(`Home page vanished count: ${homeVanished.length}`);

  // Also check client-side navigation from / to /about
  console.log("\n=== TESTING CLIENT-SIDE NAVIGATION: / -> /about ===");
  const aboutLink = page.locator("nav a[href='/about']").first();
  await aboutLink.click();
  await page.waitForTimeout(3000);

  const aboutState = await page.evaluate(() => {
    const main = document.querySelector("main");
    const h1 = document.querySelector("#about-hero-heading");
    return {
      mainExists: !!main,
      h1Exists: !!h1,
      mainComputed: main ? {
        display: window.getComputedStyle(main).display,
        visibility: window.getComputedStyle(main).visibility,
        opacity: window.getComputedStyle(main).opacity,
        height: main.getBoundingClientRect().height,
      } : null,
    };
  });
  console.log("Client-side navigation to /about result:", JSON.stringify(aboutState));

  await browser.close();
}

testHome().catch(console.error);

