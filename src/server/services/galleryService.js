import { cacheTag, cacheLife } from "next/cache";
import connectDB from "@/server/db/connect";
import { GalleryItem } from "@/lib/models/GalleryItem";

export async function getCachedGalleryItems(options = {}) {
  "use cache";
  cacheTag("gallery");
  cacheLife("max");
  await connectDB();

  const query = options?.onHomeOnly
    ? { $or: [{ showOnHome: true }, { showOnHome: { $exists: false } }] }
    : {};

  const items = await GalleryItem.find(query)
    .sort({ position: 1, order: 1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items || []));
}
