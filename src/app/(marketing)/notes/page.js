import { Suspense } from "react";
import Image from "next/image";
import { FileText, Sigma, BookOpen, FileClock } from "lucide-react";
import { getCachedPublicNotes } from "@/server/services/noteService.js";
import { getCachedPublicCourses } from "@/server/services/courseService.js";
import { getCachedSettings } from "@/server/services/settingService.js";
import NotesDirectoryClient from "@/components/notes/NotesDirectoryClient";
import { SITE_CONFIG } from "@/constants/site";

const noteHeroChips = [
  {
    label: "Chapter-wise Notes",
    icon: FileText,
    holderBg: "#E3EEFF",
    iconColor: "#3B82F6",
  },
  {
    label: "Formula Sheets",
    icon: Sigma,
    holderBg: "#FFEBD2",
    iconColor: "#F59E0B",
  },
  {
    label: "Practice Questions",
    icon: BookOpen,
    holderBg: "#DDF5E6",
    iconColor: "#22A55B",
  },
  {
    label: "Previous Year Papers",
    icon: FileClock,
    holderBg: "#EEE4FF",
    iconColor: "#8B5CF6",
  },
];

export const metadata = {
  title: "Free Accountancy Notes & Revision Sheets | R.D. Classes",
  description:
    "CBSE Class 11 & 12 Accountancy chapter notes, formulas and question banks from Ronak Dugar in Sector 9, Faridabad, Haryana. Download PDF study material.",
  alternates: {
    canonical: "https://www.rd-classes.in/notes",
  },
  openGraph: {
    title: "Free Accountancy Notes & Revision Sheets | R.D. Classes",
    description:
      "CBSE Class 11 & 12 Accountancy chapter notes, formulas and question banks from Ronak Dugar in Sector 9, Faridabad, Haryana. Download PDF study material.",
    url: "https://www.rd-classes.in/notes",
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

function NotesLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-14 bg-gray-200 rounded-2xl w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function PublicNotesPage() {
  const [notes, courses, settingDoc] = await Promise.all([
    getCachedPublicNotes(),
    getCachedPublicCourses(),
    getCachedSettings(),
  ]);

  const phone =
    settingDoc?.whatsapp ||
    settingDoc?.whatsappNumber ||
    settingDoc?.phone ||
    SITE_CONFIG?.contact?.phone ||
    "918368545620";

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
        name: "Notes",
        item: "https://www.rd-classes.in/notes",
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Accountancy Notes & Revision Sheets",
    description:
      "CBSE Class 11 & 12 Accountancy chapter notes, formulas and practice questions prepared by Ronak Sir.",
    provider: {
      "@type": "EducationalOrganization",
      name: "R.D. Classes for Accountancy",
      url: "https://www.rd-classes.in",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#FDF8F1] text-[#0F172A] pb-14 overflow-x-clip">
      {/* Animation Styles */}
      <style>{`
        @keyframes notesHeroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-notes-float {
            animation: notesHeroFloat 4s ease-in-out infinite;
          }
        }
      `}</style>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 1. SECTION: Compact, warm cream hero section */}
      <section className="relative overflow-hidden bg-[#FDF8F1] h-auto lg:h-[clamp(520px,33vw,660px)] border-b border-[rgba(20,30,60,0.06)]">
        {/* Faint pale-yellow corner circle: top-right */}
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-[#FBEBCB]/50 z-0"
          aria-hidden="true"
        />

        {/* Faint pale-yellow corner circle: bottom-left */}
        <div
          className="pointer-events-none absolute -bottom-24 -left-20 h-[240px] w-[240px] rounded-full bg-[#FBEBCB]/50 z-0"
          aria-hidden="true"
        />

        {/* DESKTOP BACKDROP ARC (soft arc behind the books melting near floor shadow) */}
        <div
          className="pointer-events-none absolute left-[72%] top-[14%] z-0 hidden h-[clamp(420px,32vw,560px)] w-[clamp(420px,32vw,560px)] -translate-x-1/2 rounded-full bg-[#FCEFD3]/70 lg:block"
          style={{
            maskImage: "linear-gradient(to bottom, #000 0%, #000 35%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 35%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* DESKTOP ILLUSTRATION (positioned absolutely, centered at 72% x and 50% y) */}
        <div className="pointer-events-none absolute left-[51%] top-1/2 z-10 hidden w-[46%] max-w-[780px] -translate-y-1/2 lg:block">
          <div className="animate-notes-float w-full select-none">
            <Image
              src="/notes-hero-books.png"
              alt="Accountancy, Practice and Results textbooks stack with study notes"
              width={1000}
              height={666}
              priority
              className="h-auto w-full object-contain"
              sizes="(min-width: 1024px) 46vw, 780px"
            />
          </div>
        </div>

        {/* FLEX WRAPPER FOR TEXT CONTENT (max-w-7xl, vertically centered) */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 lg:px-12 py-12 lg:py-0">
          {/* 2. LEFT COLUMN: Text block (sits ABOVE decorative layer and image, z-20) */}
          <div className="relative z-20 w-full lg:w-[48%] flex flex-col justify-center">
            {/* Eyebrow: — STUDY MATERIAL */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="w-5 h-[3px] bg-[#FFB800] rounded-full inline-block" />
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                STUDY MATERIAL
              </span>
            </div>

            {/* H1 Heading: Exactly two lines on desktop, ends before 48% width */}
            <h1
              className="font-extrabold leading-[1.08] tracking-tight text-[#0B1B3A]"
              style={{ fontSize: "clamp(2.5rem, 3.4vw, 3.75rem)" }}
            >
              Premium Notes for<br className="hidden lg:block" />{" "}
              <span className="lg:whitespace-nowrap">
                <span className="text-[#FFB800]">Class 11 &amp; 12</span> Accountancy.
              </span>
            </h1>

            {/* Paragraph: Wraps cleanly into 2 lines, ends at ~43% width */}
            <p className="mt-4 max-w-[600px] text-base lg:text-lg xl:text-xl leading-relaxed text-slate-500">
              Chapter-wise notes, formula sheets and practice questions<br className="hidden lg:block" />{" "}
              prepared by Ronak Sir.
            </p>

            {/* Chips Grid: 2x2 grid with second column aligned on both rows */}
            <div className="mt-6 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-3">
              {noteHeroChips.map((chip, idx) => {
                const Icon = chip.icon;
                const isCol1 = idx % 2 === 0;
                return (
                  <div
                    key={chip.label}
                    className={`inline-flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(11,27,58,0.06)] hover:shadow-[0_8px_24px_rgba(11,27,58,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-default select-none justify-self-start ${
                      isCol1 ? "w-full" : "w-auto"
                    }`}
                  >
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: chip.holderBg }}
                    >
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: chip.iconColor }}
                        strokeWidth={2.2}
                      />
                    </div>
                    <span className="text-[15px] font-semibold text-[#0B1B3A] whitespace-nowrap">
                      {chip.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 4. MOBILE / TABLET ILLUSTRATION (below lg, normal flow) */}
            <div className="relative mx-auto mt-8 block w-full max-w-md lg:hidden">
              {/* Scaled down circle behind it */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full bg-[#FCEFD3]/70 pointer-events-none z-0"
                style={{
                  maskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 80%)",
                  WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 80%)",
                }}
                aria-hidden="true"
              />
              <div className="relative z-10 w-full animate-notes-float select-none">
                <Image
                  src="/notes-hero-books.png"
                  alt="Accountancy, Practice and Results textbooks stack with study notes"
                  width={1000}
                  height={666}
                  priority
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 448px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER: DIRECTORY CLIENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
        <Suspense fallback={<NotesLoadingSkeleton />}>
          <NotesDirectoryClient
            notes={notes}
            courses={courses}
            siteWhatsapp={phone}
          />
        </Suspense>
      </main>
    </div>
  );
}
