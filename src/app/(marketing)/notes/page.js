import { Suspense } from "react";
import { FileText, Sigma, BookOpen, FileClock } from "lucide-react";
import { getCachedPublicNotes } from "@/server/services/noteService.js";
import { getCachedPublicCourses } from "@/server/services/courseService.js";
import { getCachedSettings } from "@/server/services/settingService.js";
import NotesDirectoryClient from "@/components/notes/NotesDirectoryClient";
import NotesHeroIllustration from "@/components/notes/NotesHeroIllustration";
import { SITE_CONFIG } from "@/constants/site";

const noteHeroChips = [
  {
    label: "Chapter-wise Notes",
    icon: FileText,
    holderBg: "#E8F1FD",
    iconColor: "#1E5BD8",
  },
  {
    label: "Formula Sheets",
    icon: Sigma,
    holderBg: "#FFF1DB",
    iconColor: "#E8870E",
  },
  {
    label: "Practice Questions",
    icon: BookOpen,
    holderBg: "#E3F6EC",
    iconColor: "#1F9D63",
  },
  {
    label: "Previous Year Papers",
    icon: FileClock,
    holderBg: "#EFE9FD",
    iconColor: "#7C4DDB",
  },
];

export const metadata = {
  title: "Premium Notes for Class 11 & 12 Accountancy | RD Classes",
  description:
    "Chapter-wise notes, formula sheets and practice questions prepared by Ronak Sir for CBSE Class 11 & 12 Accountancy students.",
  alternates: {
    canonical: "/notes",
  },
  openGraph: {
    title: "Premium Notes for Class 11 & 12 Accountancy | RD Classes",
    description:
      "Chapter-wise notes, formula sheets and practice questions prepared by Ronak Sir.",
    url: "/notes",
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Premium Notes for Class 11 & 12 Accountancy",
    description:
      "Chapter-wise notes, formula sheets and practice questions prepared by Ronak Sir.",
    provider: {
      "@type": "EducationalOrganization",
      name: "RD Classes",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pb-14 overflow-x-clip">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER (display flex, align-items center, min-height 400px, padding 40px 0, warm gradient + 3 blobs) */}
      <header
        className="w-full border-b border-[rgba(20,30,60,0.06)] relative overflow-hidden flex items-center min-h-[400px] py-10 max-[1000px]:py-8 max-[560px]:py-8 mb-7"
        style={{
          background: "linear-gradient(180deg, #FFF8EE 0%, #FFF3E2 100%)",
        }}
      >
        {/* Decorative Soft Blobs (z-index 0, pointer-events none) */}
        {/* Blob A: 560px circle, right -60px, top -80px */}
        <div
          className="absolute -right-[60px] -top-[80px] w-[560px] h-[560px] rounded-full pointer-events-none z-0 max-[560px]:w-[336px] max-[560px]:h-[336px]"
          style={{
            background: "radial-gradient(circle, rgba(255,214,150,0.7) 0%, rgba(255,214,150,0) 70%)",
          }}
          aria-hidden="true"
        />

        {/* Blob B: 420px circle, left -140px, bottom -200px */}
        <div
          className="absolute -left-[140px] -bottom-[200px] w-[420px] h-[420px] rounded-full pointer-events-none z-0 max-[560px]:w-[252px] max-[560px]:h-[252px]"
          style={{
            background: "rgba(255,201,87,0.30)",
          }}
          aria-hidden="true"
        />

        {/* Blob C: 260px circle, right 32%, top -120px */}
        <div
          className="absolute right-[32%] -top-[120px] w-[260px] h-[260px] rounded-full pointer-events-none z-0 max-[560px]:w-[156px] max-[560px]:h-[156px]"
          style={{
            background: "rgba(255,223,190,0.5)",
          }}
          aria-hidden="true"
        />

        {/* Inner Content Grid Container (z-index 1, 2 columns on desktop with vertical centering & 80px gap) */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 w-full relative z-[1] grid grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-y-8 gap-x-12 min-[1100px]:gap-x-20">
          {/* LEFT: Text Block (Vertically centered, max-width 560px, consistent gaps) */}
          <div className="w-full max-w-[560px] flex flex-col justify-center">
            {/* Small Label with Yellow Dash (gap to title: 12px) */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-1 bg-[#FFB800] rounded-full inline-block" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#556987]">
                STUDY MATERIAL
              </span>
            </div>

            {/* Title with 'Class 11 & 12' in amber with thin yellow marker band underneath (gap to subtitle: 14px) */}
            <h1
              className="font-extrabold text-[#0B2A4A] tracking-tight mb-3.5"
              style={{
                fontSize: "clamp(26px, 2.8vw, 40px)",
                lineHeight: 1.1,
              }}
            >
              Premium Notes for<br className="hidden sm:inline" />{" "}
              <span
                className="text-[#D97706] whitespace-nowrap"
                style={{
                  backgroundImage: "linear-gradient(transparent 62%, #FFC93C 62%, #FFC93C 92%, transparent 92%)",
                }}
              >
                Class 11 &amp; 12
              </span>{" "}
              Accountancy.
            </h1>

            {/* Subtitle 15.5px, max-width 560px (gap to chips: 20px) */}
            <p className="text-[15.5px] text-[#475569] leading-relaxed line-clamp-3 max-w-[560px] mb-5">
              Chapter-wise notes, formula sheets and practice questions prepared by Ronak Sir.
            </p>

            {/* CHIPS ROW (Highlighted pill chips, wrapping onto 2 lines if needed, max-width 560px) */}
            <div className="flex flex-wrap gap-3 max-w-[560px]">
              {noteHeroChips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={chip.label}
                    className="h-10 px-4 rounded-full bg-white flex items-center shrink-0 border border-[rgba(232,135,14,0.25)] shadow-[0_4px_12px_rgba(20,30,60,0.06)] hover:-translate-y-0.5 transition-transform duration-200 select-none cursor-default"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2.5"
                      style={{ backgroundColor: chip.holderBg }}
                    >
                      <Icon className="w-4 h-4 shrink-0" style={{ color: chip.iconColor }} strokeWidth={2} />
                    </div>
                    <span className="text-[14px] font-semibold text-[#1B2B4B] whitespace-nowrap">
                      {chip.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: NotesHeroIllustration inside right grid cell (justify-self: end; align-self: center; width: clamp(380px, 34vw, 520px)) */}
          <div className="justify-self-end self-center max-[1000px]:justify-self-center w-[clamp(380px,34vw,520px)] max-[1000px]:w-[70%] h-auto hidden min-[560px]:block select-none pointer-events-none">
            <NotesHeroIllustration className="w-full h-auto block drop-shadow-xs" />
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: DIRECTORY CLIENT */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6">
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
