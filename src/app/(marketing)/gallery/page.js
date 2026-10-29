import { Camera, Sparkles } from "lucide-react";
import { getCachedGalleryItems } from "@/server/services/galleryService";
import GalleryClient from "@/components/gallery/GalleryClient";

export const metadata = {
  title: "Classroom & Events Gallery | RD Classes",
  description:
    "Photo archives of offline batches, board exam felicitations, problem-solving workshops and student celebrations at RD Classes Sector 9, Faridabad.",
  alternates: {
    canonical: "/gallery",
  },
};

export default async function GalleryPage() {
  const serialized = await getCachedGalleryItems();

  return (
    <main className="min-h-screen bg-[#FBF8F1] text-[#0B1B3B] pt-4 sm:pt-6 pb-12 sm:pb-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Camera className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>LIFE AT RD CLASSES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1B3B] tracking-tight leading-tight">
            Classroom Moments &amp; Celebrations
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#5F6A7A] leading-relaxed">
            A glimpse into our offline batches, high-energy doubt seminars, board felicitation ceremonies, and everyday student focus.
          </p>
        </div>

        {/* Gallery Grid */}
        <GalleryClient items={serialized} />
      </div>
    </main>
  );
}
