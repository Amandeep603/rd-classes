import { Suspense } from "react";
import { getCachedPublicNotes } from "@/server/services/noteService.js";
import { getCachedPublicCourses } from "@/server/services/courseService.js";
import NotesDirectoryClient from "@/components/notes/NotesDirectoryClient";
import { BookOpen, Sparkles, FileText } from "lucide-react";

export const metadata = {
  title: "Study Notes & Revision Materials | Class 11 & 12 Accountancy | RD Classes",
  description:
    "Download comprehensive CBSE Accountancy notes, chapter summaries, formula cheat sheets, and board practice papers curated by Ronak Dugar Sir in Sector 9, Faridabad.",
  alternates: {
    canonical: "/notes",
  },
  openGraph: {
    title: "Study Notes & Revision Materials | RD Classes",
    description:
      "Master Class 11 & 12 Accountancy with concept-focused notes, formula sheets, and practice question banks.",
    url: "/notes",
  },
};

export default async function PublicNotesPage() {
  const [notes, courses] = await Promise.all([
    getCachedPublicNotes(),
    getCachedPublicCourses(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "RD Classes Study Notes & Materials",
    description:
      "Comprehensive Accountancy revision notes, chapter formulas, and practice sheets for CBSE Class 11 & 12.",
    provider: {
      "@type": "EducationalOrganization",
      name: "RD Classes",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pt-[86px] pb-24 overflow-x-clip">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-[1330px] mx-auto px-4 lg:px-0 space-y-8">
        {/* HERO BANNER SECTION */}
        <section className="relative pt-6 sm:pt-10 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E8F0]/80">
          <div className="max-w-2xl space-y-3">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF5FF] text-[#0066FF] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CBSE Commerce Notes & Revision</span>
            </div>

            {/* H1 */}
            <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0B1B3D] tracking-tight leading-tight">
              Study Notes & Practice Material
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#556987] leading-relaxed max-w-xl">
              Chapter-wise concept summaries, formula quick-reference sheets, and board examination question banks curated for Class 11 &amp; 12 Commerce students by Ronak Dugar Sir.
            </p>
          </div>

          {/* Quick Counter Card */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs self-start md:self-center">
            <div className="w-12 h-12 rounded-xl bg-[#0B2545] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <FileText className="w-6 h-6 text-[#FFB800]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#0B1B3D] font-mono leading-none">
                {notes.length}
              </div>
              <div className="text-xs text-[#64748B] font-semibold mt-1">
                Study Materials Available
              </div>
            </div>
          </div>
        </section>

        {/* NOTES INTERACTIVE DIRECTORY */}
        <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading study materials...</div>}>
          <NotesDirectoryClient
            notes={notes}
            courses={courses}
            siteWhatsapp="+918368545620"
          />
        </Suspense>
      </div>
    </div>
  );
}
