import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: { Referer: "https://rd-classes.in/" },
  });
  const page = await context.newPage();
  page.on("console", (m) => console.log(`[PAGE LOG ${m.type()}]:`, m.text()));
  await page.goto("http://localhost:3000/courses/class-12-accountancy", { waitUntil: "networkidle" });

  const btn = page.locator("button:has-text('Watch Free')").first();
  await btn.click();
  await page.waitForTimeout(3000);

  const dialogHtml = await page.evaluate(() => {
    const d = document.querySelector("div[role='dialog']");
    return d ? d.innerHTML : "NO DIALOG FOUND";
  });
  console.log("Dialog HTML:\n", dialogHtml);

  await browser.close();
}

main().catch(console.error);
