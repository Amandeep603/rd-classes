import { getCachedGalleryItems } from "@/server/services/galleryService";
import GalleryClientSection from "./GalleryClientSection";

const fallbackGalleryItems = [
  {
    _id: "fb-g-1",
    imageUrl: "/images/gallery/gallery-1.webp",
    caption: "Daily lecture discussions & interactive whiteboard solving",
  },
  {
    _id: "fb-g-2",
    imageUrl: "/images/gallery/gallery-2.webp",
    caption: "Dedicated student focus during weekly practice simulations",
  },
  {
    _id: "fb-g-3",
    imageUrl: "/images/gallery/gallery-3.webp",
    caption: "Concept breakdown by Ronak Sir on the classroom board",
  },
  {
    _id: "fb-g-4",
    imageUrl: "/images/gallery/gallery-4.webp",
    caption: "Formula sheets, format worksheets and exam notes",
  },
  {
    _id: "fb-g-5",
    imageUrl: "/images/gallery/gallery-5.webp",
    caption: "Annual felicitation of CBSE 100/100 board merit holders",
  },
  {
    _id: "fb-g-6",
    imageUrl: "/images/gallery/gallery-6.webp",
    caption: "Excellence trophies awarded for top rankers in Faridabad",
  },
  {
    _id: "fb-g-7",
    imageUrl: "/images/gallery/gallery-7.webp",
    caption: "High-energy doubt clearing seminars and peer discussions",
  },
  {
    _id: "fb-g-8",
    imageUrl: "/images/gallery/gallery-8.webp",
    caption: "Batch celebrations and certificate distribution moments",
  },
];

export default async function GallerySection() {
  const items = await getCachedGalleryItems({ onHomeOnly: true });
  const displayItems = items && items.length > 0 ? items : fallbackGalleryItems;

  return <GalleryClientSection items={displayItems} />;
}
