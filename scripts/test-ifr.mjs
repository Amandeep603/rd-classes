import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const page = await context.newPage();
  page.on("console", (m) => console.log(`[PAGE LOG ${m.type()}]:`, m.text()));
  page.on("request", (req) => {
    if (req.url().includes("/api/")) console.log("[API REQ]:", req.method(), req.url());
  });
  page.on("response", async (res) => {
    if (res.url().includes("/api/")) {
      console.log("[API RES]:", res.status(), res.url());
      try {
        const json = await res.json();
        console.log("[API BODY]:", json);
      } catch {}
    }
  });

  await page.goto("http://localhost:3000/courses/class-12-accountancy", { waitUntil: "networkidle" });

  const btn = page.locator("button:has-text('Watch Free')").first();
  console.log("Clicking button...");
  await btn.click();
  await page.waitForTimeout(4000);

  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("iframe")).map((f) => ({
      src: f.src,
      offsetWidth: f.offsetWidth,
      offsetHeight: f.offsetHeight,
    }));
  });
  console.log("Iframes count:", iframes.length, iframes);

  await browser.close();
}

main().catch(console.error);
