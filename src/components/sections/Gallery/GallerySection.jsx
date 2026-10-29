import { getCachedGalleryItems } from "@/server/services/galleryService";
import GalleryClientSection from "./GalleryClientSection";

export default async function GallerySection() {
  const items = await getCachedGalleryItems();

  if (!items || items.length === 0) {
    return null; // Requirement: "Public Gallery reads from it. If empty, the public section hides itself."
  }

  // Pre-calculate 3D card tilt values
  const RYS = [3, 1.5, 0, -1.5, -3, 2, -2];
  const SKEWS = [0.8, 0.4, 0, -0.4, -0.8, 0.5, -0.5];

  const enriched = items.map((it, idx) => ({
    ...it,
    _id: it._id.toString(),
    ry: RYS[idx % RYS.length],
    skew: SKEWS[idx % SKEWS.length],
  }));

  return <GalleryClientSection items={enriched} />;
}
