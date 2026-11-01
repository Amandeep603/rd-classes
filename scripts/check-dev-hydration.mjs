import { chromium } from "playwright";

async function checkDevHydration() {
  console.log("=== CHECKING DEV SERVER HYDRATION (http://localhost:3001/about) ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleLogs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    console.log(`[DEV CONSOLE ${msg.type()}] ${text}`);
  });

  page.on("pageerror", (err) => {
    console.error(`[DEV PAGE ERROR]`, err.message);
  });

  const res = await page.goto("http://localhost:3001/about", { waitUntil: "networkidle" });
  console.log("Dev response status:", res.status());

  await page.waitForTimeout(4000);

  const dom = await page.evaluate(() => {
    const main = document.querySelector("main");
    const h1 = document.querySelector("#about-hero-heading");
    return {
      mainExists: !!main,
      h1Exists: !!h1,
      h1Text: h1 ? h1.innerText : null,
      mainChildrenCount: main ? main.children.length : 0,
    };
  });

  console.log("Dev DOM status:", JSON.stringify(dom, null, 2));

  const hydrationWarnings = consoleLogs.filter(
    (l) =>
      l.text.toLowerCase().includes("hydration") ||
      l.text.toLowerCase().includes("mismatch") ||
      l.text.toLowerCase().includes("did not match")
  );
  console.log("Hydration Warnings count:", hydrationWarnings.length);
  if (hydrationWarnings.length > 0) {
    console.log(hydrationWarnings);
  }

  await browser.close();
}

checkDevHydration().catch(console.error);

