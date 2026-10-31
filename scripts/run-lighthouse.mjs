import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const routes = [
  { name: "home", url: "http://localhost:3000/" },
  { name: "course", url: "http://localhost:3000/courses/class-12-accountancy" },
  { name: "contact", url: "http://localhost:3000/contact" },
  { name: "student", url: "http://localhost:3000/student" },
];

const resultsDir = path.resolve(process.cwd(), "docs/lighthouse");
fs.mkdirSync(resultsDir, { recursive: true });

const suffix = process.argv[2] || "before";
console.log(`Running Mobile Lighthouse Audits (${suffix})...`);

const summary = {};

for (const route of routes) {
  const outputPath = path.join(resultsDir, `${route.name}-${suffix}.json`);
  console.log(`Auditing ${route.url} -> ${outputPath}`);
  try {
    const cmd = `npx -y lighthouse "${route.url}" --output=json --output-path="${outputPath}" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --quiet`;
    execSync(cmd, { stdio: "inherit" });
    const data = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    const scores = {
      performance: Math.round((data.categories.performance?.score || 0) * 100),
      accessibility: Math.round((data.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((data.categories["best-practices"]?.score || 0) * 100),
      seo: Math.round((data.categories.seo?.score || 0) * 100),
      fcp: data.audits["first-contentful-paint"]?.displayValue,
      lcp: data.audits["largest-contentful-paint"]?.displayValue,
      cls: data.audits["cumulative-layout-shift"]?.displayValue,
      tbt: data.audits["total-blocking-time"]?.displayValue,
      speedIndex: data.audits["speed-index"]?.displayValue,
    };
    summary[route.name] = scores;
    console.log(`Results for ${route.name}:`, scores);
  } catch (err) {
    console.error(`Error auditing ${route.name}:`, err.message);
  }
}

fs.writeFileSync(path.join(resultsDir, `summary-${suffix}.json`), JSON.stringify(summary, null, 2));
console.log("Lighthouse run complete!");
console.table(summary);

