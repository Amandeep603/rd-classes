import { cacheTag, cacheLife } from "next/cache";
import connectDB from "@/server/db/connect";
import { Review } from "@/lib/models/Review";

export async function getCachedPublishedReviews() {
  "use cache";
  cacheTag("reviews");
  cacheLife("max");
  await connectDB();

  const reviews = await Review.find({
    $or: [{ published: true }, { isVisible: true }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(reviews || []));
}
