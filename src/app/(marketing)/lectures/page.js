import Link from "next/link";
import { ChevronLeft, ChevronRight, Video, Play, BookOpen, Clock, Lock, ArrowRight, Sparkles } from "lucide-react";
import { getCachedPublicCourses } from "@/server/services/courseService";
import { SITE_CONFIG } from "@/constants/site";

export const metadata = {
  title: "Recorded Video Lectures | Class 11 & 12 Accountancy | RD Classes",
  description:
    "Explore chapter-wise recorded Accountancy video lectures by Ronak Sir. Watch free preview lectures and structured concept modules for CBSE Class 11 & 12.",
  alternates: {
    canonical: "/lectures",
  },
};

export default async function PublicLecturesPage() {
  const courses = await getCachedPublicCourses();

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
              <li className="font-semibold text-[#0B1B3D]">Lectures</li>
            </ol>
          </nav>

          {/* Pill */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
              <Video className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>RECORDED SYLLABUS</span>
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-extrabold text-[#0B1B3D] tracking-tight line-clamp-2 max-w-2xl"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            HD Video Lectures &amp;{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10 text-[#0B1B3D]">Free Previews.</span>
              <span
                className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-3.5 sm:h-4 bg-[#FFC93C] -z-0 rounded-xs"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-[620px]">
            Comprehensive chapter-wise lecture library for CBSE Accountancy. Each course includes free preview lectures that you can watch immediately.
          </p>
        </div>
      </section>

      {/* 2. COURSES LECTURE MODULES (40px desktop / 28px mobile section gap) */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 sm:pt-10 space-y-7 sm:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id || course.slug}
              className="p-6 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#EBF5FF] text-[#0066FF] text-xs font-bold border border-[#BFDBFE]">
                    {course.classLabel || "Accountancy"}
                  </span>
                  <span className="text-xs text-[#64748B] font-semibold flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>{course.lectureCount || 0} Lectures</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#0B1B3D] line-clamp-2">
                  {course.title}
                </h2>

                <p className="text-xs text-[#556987] line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:underline"
                >
                  <span>Watch Lectures</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/courses/${course.slug}`}
                  className="px-3.5 py-1.5 rounded-full bg-[#0B1B3D] hover:bg-[#152B52] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Free Preview</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

