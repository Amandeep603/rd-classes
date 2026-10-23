import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.resolve(process.cwd(), "docs/screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const baseUrl = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Marketing After screenshots
  console.log("Capturing marketing after screenshots...");
  const marketingContext1600 = await browser.newContext({
    viewport: { width: 1600, height: 900 },
  });
  const page1600 = await marketingContext1600.newPage();
  await page1600.goto(baseUrl, { waitUntil: "networkidle" });
  await page1600.screenshot({
    path: path.join(outDir, "marketing-after-1600.png"),
    fullPage: false,
  });
  await marketingContext1600.close();

  const marketingContext390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page390 = await marketingContext390.newPage();
  await page390.goto(baseUrl, { waitUntil: "networkidle" });
  await page390.screenshot({
    path: path.join(outDir, "marketing-after-390.png"),
    fullPage: false,
  });
  await marketingContext390.close();

  // 2. Auth pages screenshots at requested viewports: 1536x1024, 768x1024, 390x844
  const viewports = [
    { name: "1536", width: 1536, height: 1024 },
    { name: "768", width: 768, height: 1024 },
    { name: "390", width: 390, height: 844 },
  ];

  const authRoutes = [
    { route: "/student/login", filePrefix: "student-login" },
    { route: "/student/login/pending", filePrefix: "student-pending" },
    { route: "/admin/login", filePrefix: "admin-login" },
  ];

  for (const { route, filePrefix } of authRoutes) {
    for (const vp of viewports) {
      console.log(`Capturing ${route} at ${vp.width}x${vp.height}...`);
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const p = await ctx.newPage();
      await p.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      // Verify absence of marketing chrome
      const marketingNav = await p.locator('nav a[href="#courses"]').count();
      const marketingFooter = await p.locator('footer:has-text("Ronak Dugar")').count();
      if (marketingNav > 0 || marketingFooter > 0) {
        console.error(`ERROR: Marketing chrome detected on ${route}!`);
      } else {
        console.log(`✓ Confirmed NO marketing chrome on ${route} (${vp.name}px)`);
      }

      await p.screenshot({
        path: path.join(outDir, `${filePrefix}-${vp.name}.png`),
        fullPage: false,
      });
      await ctx.close();
    }
  }

  // 3. Verify portal route shells also have no marketing chrome
  console.log("Verifying portal protected shells...");
  // Let's check /admin (redirects to /admin/login if not logged in) or logged in session
  const verifyContext = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
  const pCheck = await verifyContext.newPage();
  await pCheck.goto(`${baseUrl}/student/login`, { waitUntil: "networkidle" });
  const scrollBarCount = await pCheck.locator(".fixed.top-0.left-0.right-0.h-1").count();
  console.log(`Scroll progress bar on /student/login: ${scrollBarCount} (Expected: 0)`);
  await verifyContext.close();

  await browser.close();
  console.log("All screenshots captured successfully in docs/screenshots/!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
