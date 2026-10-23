import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { programs } from "@/data/programs";
import { terms } from "@/data/terms";

async function CoursesContent({ searchParams }) {
  const params = await searchParams;
  const selectedType = params?.type || "all";
  const selectedTopic = params?.topic || null;

  const activeProgram = programs.find((p) => p.link.includes(`type=${selectedType}`));
  const activeTerm = terms.find((t) => t.slug === selectedTopic);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-[112px] pb-24 px-6 sm:px-12 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <header className="mb-12">
        <span className="text-[#FFB800] text-xs font-bold uppercase tracking-widest block mb-2">
          Course Offerings
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Explore All Accountancy Courses
        </h1>
        {activeProgram && (
          <p className="mt-4 text-lg text-neutral-300">
            Filtered by format: <span className="text-[#FFB800] font-semibold">{activeProgram.title}</span> ({activeProgram.eyebrow})
          </p>
        )}
        {activeTerm && (
          <p className="mt-4 text-lg text-neutral-300">
            Filtered by topic: <span className="text-[#FFB800] font-semibold">{activeTerm.name}</span>
          </p>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/courses"
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            selectedType === "all" && !selectedTopic
              ? "bg-[#FFB800] text-[#0A0A0A]"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          All Programs
        </Link>
        {programs.map((prog) => {
          const typeVal = prog.link.replace("/courses?type=", "");
          const isActive = selectedType === typeVal;
          return (
            <Link
              key={prog.id}
              href={prog.link}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#FFB800] text-[#0A0A0A]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {prog.title}
            </Link>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs
          .filter((prog) => {
            if (selectedType === "all" && !selectedTopic) return true;
            if (selectedType !== "all") {
              const typeVal = prog.link.replace("/courses?type=", "");
              return typeVal === selectedType;
            }
            return true;
          })
          .map((prog) => (
            <div
              key={prog.id}
              className="rounded-2xl p-6 border border-white/10 bg-white/5 hover:border-[#FFB800]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#FFB800]">
                    {prog.eyebrow}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    BATCH {prog.number}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">
                  {prog.title}
                </h2>
                <p className="text-neutral-400 text-sm whitespace-pre-line leading-relaxed mb-6">
                  {prog.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Enroll Now
                </span>
                <span className="w-8 h-8 rounded-full bg-[#FFB800] text-[#0A0A0A] flex items-center justify-center font-bold">
                  →
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CoursesPage({ searchParams }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] text-white pt-[112px] p-8">Loading courses...</div>}>
      <CoursesContent searchParams={searchParams} />
    </Suspense>
  );
}
