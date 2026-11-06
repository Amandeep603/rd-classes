import { cacheTag, cacheLife } from "next/cache";
import connectDB from "@/server/db/connect";
import { Topper } from "@/lib/models/Topper";
import { ResultPdf } from "@/lib/models/ResultPdf";

export async function getCachedFeaturedToppers() {
  "use cache";
  cacheTag("toppers");
  cacheLife("max");
  await connectDB();

  // Home Toppers shows ONLY entries with featuredOnHome = true (or featured/isFeatured = true)
  // sorted by order asc, then score desc
  let toppers = await Topper.find({
    $or: [{ featuredOnHome: true }, { featured: true }, { isFeatured: true }],
  })
    .sort({ order: 1, marks: -1, score: -1, createdAt: -1 })
    .lean();

  // Fallback: if none flagged, use score >= 95 (or top entries)
  if (!toppers || toppers.length === 0) {
    toppers = await Topper.find({
      $or: [
        { marks: { $gte: "95" } },
        { score: { $gte: "95" } }
      ]
    })
      .sort({ order: 1, marks: -1, score: -1, createdAt: -1 })
      .limit(10)
      .lean();
  }

  // Second fallback: any toppers if available
  if (!toppers || toppers.length === 0) {
    toppers = await Topper.find()
      .sort({ order: 1, marks: -1, score: -1, createdAt: -1 })
      .limit(10)
      .lean();
  }

  return JSON.parse(JSON.stringify(toppers || []));
}

export async function getCachedResultsData() {
  "use cache";
  cacheTag("results");
  cacheLife("max");
  await connectDB();

  const [toppers, resultPdfs] = await Promise.all([
    Topper.find().sort({ marks: -1, score: -1, order: 1, year: -1, createdAt: -1 }).lean(),
    ResultPdf.find().sort({ order: 1, year: -1, createdAt: -1 }).lean(),
  ]);

  return {
    toppers: JSON.parse(JSON.stringify(toppers || [])),
    resultPdfs: JSON.parse(JSON.stringify(resultPdfs || [])),
  };
}
