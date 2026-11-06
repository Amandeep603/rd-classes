import { Trophy } from "lucide-react";
import { getCachedResultsData } from "@/server/services/resultService";
import ResultsClient from "@/components/results/ResultsClient";

export const metadata = {
  title: "CBSE Board Accountancy Toppers & Results | R.D. Classes",
  description:
    "CBSE Class 11 & 12 Accountancy 100/100 scorers and 95+ toppers from R.D. Classes, Sector 9, Faridabad, Haryana. Verified annual board results.",
  alternates: {
    canonical: "https://www.rd-classes.in/results",
  },
  openGraph: {
    title: "CBSE Board Accountancy Toppers & Results | R.D. Classes",
    description:
      "CBSE Class 11 & 12 Accountancy 100/100 scorers and 95+ toppers from R.D. Classes, Sector 9, Faridabad, Haryana. Verified annual board results.",
    url: "https://www.rd-classes.in/results",
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

export default async function ResultsPage() {
  const { toppers, resultPdfs } = await getCachedResultsData();

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
        name: "Results",
        item: "https://www.rd-classes.in/results",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#FDF8F1] text-[#0B1B3A] pt-8 sm:pt-10 pb-16 lg:pb-24 relative overflow-hidden">
      {/* 1-2 faint pale-yellow circles in the corners */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FFE8A3]/30 blur-2xl -z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-12 -left-28 w-80 h-80 rounded-full bg-[#FFE8A3]/25 blur-2xl -z-0"
        aria-hidden="true"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Header matching Reference 1 */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 lg:mb-14">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF7E8] border border-[#FFB800]/50 text-[#B45309] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-2xs select-none">
            <Trophy className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>EXCELLENCE IN ACCOUNTANCY</span>
          </div>

          {/* Heading with Orange Gradient Highlight Bar & Spark Rays */}
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-[#0B1B3A] tracking-tight leading-[1.12]">
              Celebrating Our Board Toppers &amp;
              <br />
              <span className="relative inline-block px-1 whitespace-nowrap mt-1">
                <span
                  className="absolute inset-x-0 bottom-1.5 h-[45%] bg-gradient-to-r from-[#FFB800] to-[#FF6B00] -z-10 rounded-xs opacity-90 -rotate-1"
                  aria-hidden="true"
                />
                Official Results
              </span>
            </h1>

            {/* Orange Spark Rays near top right */}
            <span
              className="absolute -top-3 -right-8 hidden sm:inline-flex items-center gap-1 select-none pointer-events-none"
              aria-hidden="true"
            >
              <span className="w-1 h-3 rounded-full bg-[#FF7A00] rotate-[-25deg] block" />
              <span className="w-1 h-4 rounded-full bg-[#FFB800] rotate-[5deg] block" />
              <span className="w-1 h-3 rounded-full bg-[#FF7A00] rotate-[35deg] block" />
            </span>
          </div>

          {/* Paragraph */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal max-w-2xl leading-relaxed">
            Consistent 100/100 and 95+ distinctions in CBSE Class 11 &amp; 12. Proof of concept-first teaching and dedicated practice.
          </p>
        </div>

        {/* Results 2 Cards & Merit Viewer */}
        <ResultsClient toppers={toppers} resultPdfs={resultPdfs} />
      </div>
    </main>
  );
}
