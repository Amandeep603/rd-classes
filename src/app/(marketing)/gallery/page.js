import { getCachedGalleryItems } from "@/server/services/galleryService";
import GalleryClient from "@/components/gallery/GalleryClient";

export const metadata = {
  title: "Classroom & Campus Gallery | R.D. Classes Faridabad",
  description:
    "Explore classroom photos, doubt workshops and board felicitation ceremonies at R.D. Classes for Accountancy in Sector 9, Faridabad, Haryana.",
  alternates: {
    canonical: "https://www.rd-classes.in/gallery",
  },
  openGraph: {
    title: "Classroom & Campus Gallery | R.D. Classes Faridabad",
    description:
      "Explore classroom photos, doubt workshops and board felicitation ceremonies at R.D. Classes for Accountancy in Sector 9, Faridabad, Haryana.",
    url: "https://www.rd-classes.in/gallery",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "R.D. Classes for Accountancy - Sector 9, Faridabad",
      },
    ],
  },
};

export default async function GalleryPage() {
  const items = await getCachedGalleryItems();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.rd-classes.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Gallery",
        item: "https://www.rd-classes.in/gallery",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#FDF8F1] text-[#0B1B3A] pt-6 sm:pt-8 pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row matching Reference 2 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-12 mb-10 lg:mb-14">
          {/* Left Column: Pill + 2-line Heading */}
          <div className="max-w-2xl text-left">
            {/* Pill with small orange bar on left */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs select-none">
              <span className="w-1.5 h-3.5 bg-[#FF7A00] rounded-full inline-block" />
              <span>Life at RD Classes</span>
            </div>

            {/* H1 Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B1B3A] tracking-tight leading-[1.08]">
              Classroom Moments &amp;
              <br />
              Celebrations
            </h1>
          </div>

          {/* Right Column (lg): Paragraph with yellow left border */}
          <div className="max-w-md text-left lg:pb-2">
            <div className="border-l-4 border-[#FFC107] pl-4 sm:pl-5">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                A glimpse into our offline batches, high-energy doubt seminars, board felicitation ceremonies, and everyday student focus.
              </p>
            </div>
          </div>
        </div>

        {/* Mosaic Grid */}
        <GalleryClient initialItems={items} />
      </div>
    </main>
  );
}
