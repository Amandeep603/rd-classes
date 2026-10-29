import { cacheTag, cacheLife } from "next/cache";
import connectDB from "@/server/db/connect";
import { Topper } from "@/lib/models/Topper";
import { ResultPdf } from "@/lib/models/ResultPdf";

export async function getCachedFeaturedToppers() {
  "use cache";
  cacheTag("toppers");
  cacheLife("max");
  await connectDB();

  let toppers = await Topper.find({
    $or: [{ featured: true }, { isFeatured: true }],
  })
    .sort({ year: -1, marks: -1, createdAt: -1 })
    .lean();

  if (!toppers || toppers.length === 0) {
    toppers = await Topper.find()
      .sort({ year: -1, marks: -1, createdAt: -1 })
      .limit(8)
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
    Topper.find().sort({ year: -1, marks: -1, createdAt: -1 }).lean(),
    ResultPdf.find().sort({ year: -1, createdAt: -1 }).lean(),
  ]);

  return {
    toppers: JSON.parse(JSON.stringify(toppers || [])),
    resultPdfs: JSON.parse(JSON.stringify(resultPdfs || [])),
  };
}
