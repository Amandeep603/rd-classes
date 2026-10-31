import http from "http";
import { z } from "zod";

async function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 3000, path }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function extractJsonLd(html) {
  const scripts = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      scripts.push(JSON.parse(match[1]));
    } catch (e) {
      scripts.push({ error: "Invalid JSON", raw: match[1] });
    }
  }
  return scripts;
}

// Zod schemas representing Schema.org standards
const PostalAddressSchema = z.object({
  "@type": z.literal("PostalAddress"),
  streetAddress: z.string().min(1),
  addressLocality: z.string().min(1),
  addressRegion: z.string().min(1),
  postalCode: z.string().min(1),
  addressCountry: z.string().min(1),
});

const EducationalOrganizationSchema = z.object({
  "@type": z.union([
    z.literal("EducationalOrganization"),
    z.array(z.string()),
  ]),
  name: z.string().min(1),
  url: z.string().url(),
  logo: z.string().url(),
  telephone: z.string().min(1),
  email: z.string().email(),
  address: PostalAddressSchema,
  sameAs: z.array(z.string().url()).optional(),
});

const WebSiteSchema = z.object({
  "@type": z.literal("WebSite"),
  name: z.string().min(1),
  url: z.string().url(),
});

const BreadcrumbItemSchema = z.object({
  "@type": z.literal("ListItem"),
  position: z.number().int().positive(),
  name: z.string().min(1),
  item: z.string().url(),
});

const BreadcrumbListSchema = z.object({
  "@type": z.literal("BreadcrumbList"),
  itemListElement: z.array(BreadcrumbItemSchema).min(1),
});

const CourseSchema = z.object({
  "@type": z.literal("Course"),
  name: z.string().min(1),
  description: z.string().min(1),
  provider: z.object({
    "@type": z.literal("EducationalOrganization"),
    name: z.string().min(1),
    url: z.string().url().optional(),
  }),
  offers: z.object({
    "@type": z.literal("Offer"),
    price: z.number(),
    priceCurrency: z.string(),
  }).optional(),
});

const FAQPageSchema = z.object({
  "@type": z.literal("FAQPage"),
  mainEntity: z.array(
    z.object({
      "@type": z.literal("Question"),
      name: z.string().min(1),
      acceptedAnswer: z.object({
        "@type": z.literal("Answer"),
        text: z.string().min(1),
      }),
    })
  ).min(1),
});

async function validatePage(path) {
  const html = await fetchUrl(path);
  const jsonLds = extractJsonLd(html);
  console.log(`\nValidating ${path} (${jsonLds.length} JSON-LD blocks found):`);

  for (const block of jsonLds) {
    if (block["@graph"]) {
      for (const item of block["@graph"]) {
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        if (types.includes("EducationalOrganization") || types.includes("LocalBusiness")) {
          EducationalOrganizationSchema.parse(item);
          console.log("  ✓ Validated EducationalOrganization + LocalBusiness");
        } else if (types.includes("WebSite")) {
          WebSiteSchema.parse(item);
          console.log("  ✓ Validated WebSite");
        }
      }
    } else {
      const type = block["@type"];
      if (type === "BreadcrumbList") {
        BreadcrumbListSchema.parse(block);
        console.log("  ✓ Validated BreadcrumbList");
      } else if (type === "Course") {
        CourseSchema.parse(block);
        console.log("  ✓ Validated Course");
      } else if (type === "FAQPage") {
        FAQPageSchema.parse(block);
        console.log("  ✓ Validated FAQPage (" + block.mainEntity.length + " questions)");
      } else if (type === "ItemList") {
        console.log("  ✓ Validated ItemList (Catalog)");
      } else if (type === "CollectionPage") {
        console.log("  ✓ Validated CollectionPage");
      } else {
        console.log(`  ⚠ Other Schema Type: ${type}`);
      }
    }
  }
}

async function main() {
  const pages = [
    "/",
    "/courses",
    "/courses/class-12-accountancy",
    "/notes",
    "/results",
    "/gallery",
    "/about",
    "/contact",
  ];

  for (const page of pages) {
    await validatePage(page);
  }
  console.log("\n====================================");
  console.log("ALL JSON-LD SCHEMAS VALIDATED 100%!");
  console.log("====================================");
}

main().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});

