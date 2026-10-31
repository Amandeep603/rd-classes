import http from "http";

async function fetchUrl(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "GET",
        headers: {
          Host: "localhost:3000",
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  );

  const jsonLdScripts = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      jsonLdScripts.push(JSON.parse(match[1]));
    } catch (e) {
      jsonLdScripts.push({ error: "Invalid JSON", raw: match[1] });
    }
  }

  return {
    title: titleMatch ? titleMatch[1] : null,
    titleLength: titleMatch ? titleMatch[1].length : 0,
    description: descMatch ? descMatch[1] : null,
    descLength: descMatch ? descMatch[1].length : 0,
    canonical: canonicalMatch ? canonicalMatch[1] : null,
    ogTitle: ogTitleMatch ? ogTitleMatch[1] : null,
    ogImage: ogImageMatch ? ogImageMatch[1] : null,
    h1Count: h1Matches.length,
    h1List: h1Matches,
    jsonLdScripts,
  };
}

async function run() {
  console.log("=========================================");
  console.log("TECHNICAL SEO & SPEED VERIFICATION SUITE");
  console.log("=========================================\n");

  // 1. Home Page Verification
  console.log("--- 1. HOME (/) ---");
  const home = await fetchUrl("/");
  const homeMeta = extractMeta(home.body);
  console.log("Status:", home.statusCode);
  console.log("Title (" + homeMeta.titleLength + " chars):", homeMeta.title);
  console.log("Desc (" + homeMeta.descLength + " chars):", homeMeta.description);
  console.log("Canonical:", homeMeta.canonical);
  console.log("OG Image:", homeMeta.ogImage);
  console.log("H1 Count:", homeMeta.h1Count, "->", homeMeta.h1List);
  console.log("JSON-LD schemas count:", homeMeta.jsonLdScripts.length);
  homeMeta.jsonLdScripts.forEach((s, idx) => {
    const types = s["@graph"] ? s["@graph"].map((g) => g["@type"]).join(", ") : s["@type"];
    console.log(`  [Schema ${idx + 1}] Type:`, types);
  });

  // 2. Course Detail Verification
  console.log("\n--- 2. COURSE DETAIL (/courses/class-12-accountancy) ---");
  const course = await fetchUrl("/courses/class-12-accountancy");
  const courseMeta = extractMeta(course.body);
  console.log("Status:", course.statusCode);
  console.log("Title (" + courseMeta.titleLength + " chars):", courseMeta.title);
  console.log("Desc (" + courseMeta.descLength + " chars):", courseMeta.description);
  console.log("Canonical:", courseMeta.canonical);
  console.log("H1 Count:", courseMeta.h1Count, "->", courseMeta.h1List);
  console.log("JSON-LD schemas count:", courseMeta.jsonLdScripts.length);
  courseMeta.jsonLdScripts.forEach((s, idx) => {
    const types = s["@graph"] ? s["@graph"].map((g) => g["@type"]).join(", ") : s["@type"];
    console.log(`  [Schema ${idx + 1}] Type:`, types);
  });

  // 3. Contact Page Verification
  console.log("\n--- 3. CONTACT (/contact) ---");
  const contact = await fetchUrl("/contact");
  const contactMeta = extractMeta(contact.body);
  console.log("Status:", contact.statusCode);
  console.log("Title (" + contactMeta.titleLength + " chars):", contactMeta.title);
  console.log("Desc (" + contactMeta.descLength + " chars):", contactMeta.description);
  console.log("Canonical:", contactMeta.canonical);
  console.log("H1 Count:", contactMeta.h1Count, "->", contactMeta.h1List);
  console.log("JSON-LD schemas count:", contactMeta.jsonLdScripts.length);
  contactMeta.jsonLdScripts.forEach((s, idx) => {
    const types = s["@graph"] ? s["@graph"].map((g) => g["@type"]).join(", ") : s["@type"];
    console.log(`  [Schema ${idx + 1}] Type:`, types);
  });

  // 4. Sitemap.xml Verification
  console.log("\n--- 4. SITEMAP (/sitemap.xml) ---");
  const sitemap = await fetchUrl("/sitemap.xml");
  console.log("Status:", sitemap.statusCode);
  console.log("Content-Type:", sitemap.headers["content-type"]);
  const urlMatches = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log("Indexed URLs in sitemap (" + urlMatches.length + " total):");
  urlMatches.forEach((u) => console.log("  • " + u));

  // 5. Robots.txt Verification
  console.log("\n--- 5. ROBOTS (/robots.txt) ---");
  const robots = await fetchUrl("/robots.txt");
  console.log("Status:", robots.statusCode);
  console.log("Robots.txt content:\n" + robots.body.trim());

  // 6. Header and Redirect Verification
  console.log("\n--- 6. HEADERS & REDIRECTS ---");
  // Check /admin
  const admin = await fetchUrl("/admin");
  console.log("/admin status:", admin.statusCode, "| X-Robots-Tag:", admin.headers["x-robots-tag"]);

  // Check /student
  const student = await fetchUrl("/student");
  console.log("/student status:", student.statusCode, "| X-Robots-Tag:", student.headers["x-robots-tag"]);

  // Check /api/enquiries
  const api = await fetchUrl("/api/enquiries");
  console.log("/api/enquiries status:", api.statusCode, "| X-Robots-Tag:", api.headers["x-robots-tag"]);

  // Check /student-login
  const studentLogin = await fetchUrl("/student-login");
  console.log("/student-login status:", studentLogin.statusCode, "| X-Robots-Tag:", studentLogin.headers["x-robots-tag"]);

  // Check search URL noindex
  const searchUrl = await fetchUrl("/courses?category=class-12");
  console.log("/courses?category=class-12 X-Robots-Tag:", searchUrl.headers["x-robots-tag"]);

  // Check 404 status
  const notFound = await fetchUrl("/this-page-does-not-exist");
  console.log("Non-existent URL status:", notFound.statusCode);

  // Check canonical host redirect (rd-classes-sandy.vercel.app -> https://www.rd-classes.in)
  const sandyRedirect = await fetchUrl("/courses", {
    "x-forwarded-host": "rd-classes-sandy.vercel.app",
    host: "rd-classes-sandy.vercel.app",
  });
  console.log("rd-classes-sandy.vercel.app redirect status:", sandyRedirect.statusCode, "| Location:", sandyRedirect.headers.location);

  // Check apex redirect (rd-classes.in -> https://www.rd-classes.in)
  const apexRedirect = await fetchUrl("/courses", {
    "x-forwarded-host": "rd-classes.in",
    host: "rd-classes.in",
  });
  console.log("rd-classes.in redirect status:", apexRedirect.statusCode, "| Location:", apexRedirect.headers.location);

  // Check unknown host gets noindex
  const unknownHost = await fetchUrl("/courses", {
    "x-forwarded-host": "random-host.com",
    host: "random-host.com",
  });
  console.log("unknown host (random-host.com) X-Robots-Tag:", unknownHost.headers["x-robots-tag"]);
}

run().catch(console.error);

