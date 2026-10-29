import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Clock, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { blogs } from "@/data/blogs";

export const metadata = {
  title: "Accountancy Blog & Exam Tips | RD Classes",
  description:
    "Expert tips, working notes strategies, and chapter guides by Ronak Sir to help CBSE Class 11 & 12 Accountancy students score 95+.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pb-14 overflow-x-clip">
      {/* 1. HERO SECTION (Exact 24px desktop / 16px mobile top offset) */}
      <section className="w-full relative overflow-hidden bg-[#FBF7F0] border-b border-[#E8ECEF] pt-4 sm:pt-6 pb-7">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          {/* Breadcrumb: 13px */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[13px] text-[#556987]">
              <li className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-[#556987]" />
                <Link
                  href="/"
                  className="font-semibold text-[#556987] hover:text-[#0B1B3D] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
              </li>
              <li className="font-semibold text-[#0B1B3D]">Blog</li>
            </ol>
          </nav>

          {/* Pill */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
              <BookOpen className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>EXAM TIPS &amp; STRATEGY</span>
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-extrabold text-[#0B1B3D] tracking-tight line-clamp-2 max-w-2xl"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            Accountancy Articles &amp;{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10 text-[#0B1B3D]">Board Advice.</span>
              <span
                className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-3.5 sm:h-4 bg-[#FFC93C] -z-0 rounded-xs"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-[620px]">
            Actionable insights, format rules, and chapter breakdowns written personally by Ronak Sir for CBSE Class 11 &amp; 12 students.
          </p>
        </div>
      </section>

      {/* 2. BLOG LISTING GRID (40px desktop / 28px mobile section gap) */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 sm:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <article
              key={b.id || b.slug}
              className="p-6 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#556987]">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FFFBEB] text-[#D97706] font-bold">
                    {b.category}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{b.readTime}</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#0B1B3D] line-clamp-2">
                  {b.title}
                </h2>

                <p className="text-xs text-[#475569] line-clamp-3 leading-relaxed">
                  {b.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <span className="text-[#64748B] flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{b.date}</span>
                </span>
                <span className="font-bold text-[#0066FF] flex items-center gap-1">
                  <span>By {b.author}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

