import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "Referer": "https://rd-classes.in/",
    },
  });
  const page = await context.newPage();

  page.on("response", (res) => {
    if (res.url().includes("player.vimeo.com/video")) {
      console.log(`Vimeo video response: ${res.status()} ${res.url()}`);
    }
  });

  console.log("Navigating to course page with Referer https://rd-classes.in/...");
  await page.goto("http://localhost:3000/courses/class-12-accountancy", { waitUntil: "networkidle" });

  const btn = page.locator("button:has-text('Watch Free')").first();
  await btn.click();
  await page.waitForTimeout(3000);

  const ifr = page.locator("iframe");
  console.log("Iframe count:", await ifr.count());
  if (await ifr.count() > 0) {
    console.log("Iframe src:", await ifr.first().getAttribute("src"));
  }

  await browser.close();
}

main().catch(console.error);

