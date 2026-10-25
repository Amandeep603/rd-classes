import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Video,
  Globe,
  MessageCircle,
  LogIn,
  Crown,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import connectDB from "@/server/db/connect";
import { Lecture } from "@/server/db/models/Lecture";
import {
  getCachedCourseBySlug,
  getCachedPublicCourses,
} from "@/server/services/courseService";
import CourseIllustration from "@/components/courses/illustrations";
import CourseCard from "@/components/courses/CourseCard";
import { SITE_CONFIG } from "@/constants/site";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await getCachedCourseBySlug(slug);
  if (!course || !course.published) {
    return {
      title: "Course Not Found | RD Classes",
    };
  }

  const title = `${course.title} ${course.subtitle || ""} | RD Classes`;
  return {
    title,
    description: course.description,
    alternates: {
      canonical: `/courses/${course.slug}`,
    },
    openGraph: {
      title,
      description: course.description,
      url: `/courses/${course.slug}`,
    },
  };
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remainingMins}m`;
  return `${mins}m`;
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = await getCachedCourseBySlug(slug);

  if (!course || !course.published) {
    notFound();
  }

  await connectDB();
  // Fetch published lectures with ONLY public fields (title, section, durationSec)
  const lectures = await Lecture.find({
    courseId: course._id,
    published: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .select("title section durationSec")
    .lean();

  // Group lectures by section
  const sectionMap = {};
  lectures.forEach((lec) => {
    const secName = lec.section || "General";
    if (!sectionMap[secName]) sectionMap[secName] = [];
    sectionMap[secName].push(lec);
  });
  const sections = Object.entries(sectionMap);

  // Related courses (up to 3 other courses)
  const allCourses = await getCachedPublicCourses();
  const relatedCourses = allCourses
    .filter((c) => c._id.toString() !== course._id.toString())
    .slice(0, 3);

  const phone = SITE_CONFIG?.contact?.phone || "918368545620";
  const defaultWaText =
    course.whatsappText ||
    `Hello RD Classes, I want to know more about ${course.title}.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    defaultWaText
  )}`;

  const MetaIconComponent =
    course.metaIcon === "clock"
      ? Clock
      : course.metaIcon === "file"
      ? FileText
      : Video;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "EducationalOrganization",
      name: "RD Classes",
      sameAs: "https://rd-classes.in",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pt-24 pb-24 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back button container */}
      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 mb-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </Link>
      </div>

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 space-y-12">
        {/* HERO CARD */}
        <section
          data-course-tone={course.tone || "sky"}
          className="relative overflow-hidden rounded-[32px] border border-black/8 shadow-sm p-6 sm:p-10 lg:p-12"
          style={{
            background: "var(--course-tint-gradient)",
          }}
        >
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12 relative z-10">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              {/* Badges */}
              <div className="flex items-center gap-2.5 mb-5">
                <span className="inline-flex items-center rounded-full bg-white/95 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-800 shadow-2xs">
                  {course.classLabel || "Class 12"}
                </span>

                {course.badgeText && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-2xs"
                    style={{
                      backgroundColor: "var(--course-badge-bg)",
                      color: "var(--course-badge-text)",
                    }}
                  >
                    {course.badgeVariant === "crown-navy" && (
                      <Crown className="h-3.5 w-3.5 fill-current" />
                    )}
                    <span>{course.badgeText}</span>
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="mt-2 text-xl sm:text-2xl font-semibold text-slate-600">
                  {course.subtitle}
                </p>
              )}

              {/* Description */}
              <p className="mt-5 text-sm sm:text-base text-[#5B6676] leading-relaxed">
                {course.description}
              </p>

              {/* Meta pills */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-black/5 shadow-2xs">
                  <MetaIconComponent className="h-4 w-4 text-slate-600" />
                  <span>{course.metaText}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-black/5 shadow-2xs">
                  <Globe className="h-4 w-4 text-slate-600" />
                  <span>{course.language || "Bilingual"}</span>
                </div>
              </div>

              {/* Faculty Info */}
              <div className="mt-8 flex items-center gap-3.5 pt-6 border-t border-black/8">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full p-0.5 shadow-xs shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">
                    RD
                  </div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-[#0F172A]">
                    {course.facultyName || "Ronak Dugar"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {course.facultyRole || "Lead Accountancy Faculty"}
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-extrabold text-white shadow-md hover:brightness-105 transition-all active:scale-98"
                  style={{
                    backgroundColor: "var(--course-btn-bg)",
                  }}
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Enquire on WhatsApp</span>
                </a>

                <Link
                  href="/student/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-slate-800 bg-white border border-[#E2E8F0] shadow-2xs hover:bg-slate-50 transition-all active:scale-98"
                >
                  <LogIn className="w-4 h-4 text-slate-600" />
                  <span>Student Login</span>
                </Link>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="w-full lg:w-[380px] flex items-center justify-center py-4 select-none pointer-events-none shrink-0">
              <div className="w-[240px] sm:w-[280px] h-[200px] sm:h-[240px] drop-shadow-lg">
                <CourseIllustration name={course.illustration || "books-blue"} />
              </div>
            </div>
          </div>
        </section>

        {/* WHAT'S INCLUDED SECTION */}
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>What’s Included in this Course</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Comprehensive Syllabus Coverage
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Full coverage of CBSE chapters with core concepts, ledger accounts, and board-pattern illustrations.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Format & Language
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Taught in {course.language || "Bilingual"} (Hindi + English) with crystal-clear explanations.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Personal Guidance
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Mentored directly by {course.facultyName || "Ronak Dugar"} with personal doubt resolution on WhatsApp.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Dedicated Student Portal
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Secure device-locked student portal access with lecture bookmarks, notes, and progress tracking.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <Video className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Course Material: {course.metaText}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  High-definition chapter modules, practical problem sessions, and board sample paper discussions.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-black/5 flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Board Exam Preparation
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Includes frequent testing, time management drills, and past 10 years question bank revisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CURRICULUM PREVIEW */}
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Curriculum & Chapter Outline</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {lectures.length > 0
                  ? `${lectures.length} published lecture titles across ${sections.length} chapters`
                  : "Detailed chapter outline and lecture modules"}
              </p>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF6EE] rounded-2xl border border-black/5">
              <p className="text-sm text-slate-600 font-medium">
                Curriculum syllabus outline is being finalized for this session. Contact Ronak Sir on WhatsApp for the complete syllabus copy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map(([sectionName, sectionLectures]) => (
                <div
                  key={sectionName}
                  className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-[#FAF6EE]/50"
                >
                  <div className="px-5 py-3.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#0F172A]">
                      {sectionName}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {sectionLectures.length} {sectionLectures.length === 1 ? "lecture" : "lectures"}
                    </span>
                  </div>

                  <div className="divide-y divide-[#E2E8F0]/60">
                    {sectionLectures.map((lec, idx) => {
                      const durStr = formatDuration(lec.durationSec);
                      return (
                        <div
                          key={lec._id}
                          className="px-5 py-3 flex items-center justify-between gap-4 text-xs sm:text-[13px] hover:bg-white/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-[11px] w-5">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-slate-800">
                              {lec.title}
                            </span>
                          </div>

                          {durStr && (
                            <span className="shrink-0 text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                              {durStr}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RELATED COURSES */}
        {relatedCourses.length > 0 && (
          <section className="pt-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-6">
              Other Recommended Offerings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
              {relatedCourses.map((c) => (
                <div key={c._id || c.slug} className="h-full flex flex-col">
                  <CourseCard course={c} variant="catalog" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
