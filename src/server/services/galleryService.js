import { cacheTag, cacheLife } from "next/cache";
import connectDB from "@/server/db/connect";
import { GalleryItem } from "@/lib/models/GalleryItem";

export async function getCachedGalleryItems() {
  "use cache";
  cacheTag("gallery");
  cacheLife("max");
  await connectDB();

  const items = await GalleryItem.find()
    .sort({ position: 1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items || []));
}
