import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  BookOpen,
  Globe,
  Award,
  CheckCircle2,
  Infinity as InfinityIcon,
} from "lucide-react";
import connectDB from "@/server/db/connect";
import { Course } from "@/server/db/models/Course";
import {
  getCachedCourseBySlug,
  getCachedCourseLectures,
  getCachedRelatedCourses,
} from "@/server/services/courseService";
import CourseIllustration from "@/components/courses/illustrations";
import CourseDetailClient from "@/components/courses/CourseDetailClient";
import { SITE_CONFIG } from "@/constants/site";

export async function generateStaticParams() {
  try {
    await connectDB();
    const courses = await Course.find({ published: true }).select("slug").lean();
    if (courses && courses.length > 0) {
      return courses.map((c) => ({ slug: c.slug }));
    }
  } catch {
    // Return fallback slug for build validation
  }
  return [{ slug: "course-preview" }];
}

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

function renderHighlightIcon(iconKey) {
  switch (iconKey) {
    case "video":
      return <Video className="w-4 h-4 text-[#0066FF] flex-shrink-0" />;
    case "notes":
    case "papers":
    case "file":
      return <FileText className="w-4 h-4 text-[#D97706] flex-shrink-0" />;
    case "practice":
      return <BookOpen className="w-4 h-4 text-[#16A34A] flex-shrink-0" />;
    case "tests":
      return <Award className="w-4 h-4 text-[#9333EA] flex-shrink-0" />;
    case "globe":
      return <Globe className="w-4 h-4 text-[#0B2545] flex-shrink-0" />;
    case "infinity":
      return <InfinityIcon className="w-4 h-4 text-[#EA580C] flex-shrink-0" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />;
  }
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = await getCachedCourseBySlug(slug);

  if (!course || !course.published) {
    notFound();
  }

  // Published lectures with sanitized fields (vimeoId only present for preview lectures)
  const lectures = await getCachedCourseLectures(course._id);

  // Published notes for this course (sanitized metadata for public shell)
  const { getCachedNotesForCourse } = await import("@/server/services/noteService");
  const rawNotes = await getCachedNotesForCourse(course._id);
  const notes = (rawNotes || []).map((n) => ({
    _id: n._id.toString(),
    title: n.title,
    kind: n.kind,
    source: n.source,
    pageCount: n.pageCount,
    section: n.section,
  }));

  // Up to 3 related courses (same category first, then others)
  const relatedCourses = await getCachedRelatedCourses(course._id, course.category);

  const phone = SITE_CONFIG?.contact?.phone || "918368545620";

  const heroIllustrationName =
    course.heroIllustration ||
    (course.slug.includes("foundation") || course.classLabel === "Class 11"
      ? "books-light"
      : "books-subjects");

  const defaultHighlights = [
    { icon: "video", text: `${lectures.length || 136} HD Lectures` },
    { icon: "notes", text: "Chapter-wise Notes" },
    { icon: "practice", text: "Practice Questions" },
    { icon: "globe", text: course.language ? `${course.language} (Hindi + English)` : "Bilingual (Hindi + English)" },
  ];

  const highlights =
    course.highlights && course.highlights.length > 0
      ? course.highlights.slice(0, 4)
      : defaultHighlights;

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
    <div className="min-h-screen w-full bg-[#FCFBF8] text-[#0F172A] pt-20 sm:pt-24 pb-20 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO WRAPPER WITH CREAM/BLUE GRADIENT */}
      <div
        className="w-full border-b border-[#E8ECEF] relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #FFFDF9 0%, #F9FAFC 60%, #F0F5FD 100%)",
        }}
      >
        {/* Soft decorative background circles */}
        <div
          className="absolute -right-20 -top-20 w-[480px] h-[480px] rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #D8E6FF 0%, rgba(216, 230, 255, 0) 70%)",
          }}
        />
        <div
          className="absolute right-1/4 top-1/2 w-[320px] h-[320px] rounded-full pointer-events-none opacity-30 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, #FFEFC7 0%, rgba(255, 239, 199, 0) 70%)",
          }}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pb-16 relative z-10">
          {/* Breadcrumb: Courses > <title> <subtitle> */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs sm:text-[13px] text-[#556987]">
              <li className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-[#94A3B8]" />
                <Link
                  href="/courses"
                  className="font-semibold text-[#556987] hover:text-[#0B1B3D] transition-colors"
                >
                  Courses
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
              </li>
              <li className="font-semibold text-[#0B1B3D] truncate max-w-[280px] sm:max-w-md">
                {course.title} {course.subtitle || ""}
              </li>
            </ol>
          </nav>

          {/* Hero Row: Left text + Right illustration */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              {/* Class Pill */}
              <div className="mb-3.5">
                <span className="inline-flex items-center rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
                  {course.classLabel || "Class 12"}
                </span>
              </div>

              {/* H1 with warm yellow marker highlight on subtitle */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.2]">
                <span>{course.title}</span>{" "}
                {course.subtitle && (
                  <span className="relative inline-block whitespace-nowrap ml-1">
                    <span className="relative z-10 text-[#0B1B3D]">
                      {course.subtitle}
                    </span>
                    <span
                      className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-3 sm:h-3.5 bg-[#FFD84D] -z-0 rounded-xs"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </h1>

              {/* Description (3 lines max) */}
              <p className="mt-4 text-sm sm:text-base text-[#475569] leading-relaxed line-clamp-3 max-w-xl">
                {course.description}
              </p>

              {/* Hero highlights row (up to 4 icon+text items) */}
              <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-semibold text-[#334155]">
                {highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && (
                      <span className="text-[#CBD5E1] hidden sm:inline mr-2">|</span>
                    )}
                    <span className="p-1 rounded-md bg-white border border-[#E2E8F0] shadow-2xs">
                      {renderHighlightIcon(item.icon)}
                    </span>
                    <span className="text-[#1E293B]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero Illustration */}
            <div className="w-full lg:w-[380px] flex items-center justify-center lg:justify-end py-2 shrink-0 select-none">
              <div className="w-[280px] sm:w-[340px] h-[190px] sm:h-[230px] drop-shadow-md">
                <CourseIllustration
                  name={heroIllustrationName}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER WITH TABS, ACCORDION & SIDEBAR */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <CourseDetailClient
          course={course}
          lectures={lectures}
          initialNotes={notes}
          relatedCourses={relatedCourses}
          siteWhatsapp={phone}
        />
      </main>
    </div>
  );
}
