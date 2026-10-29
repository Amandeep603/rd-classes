import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
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
import { getCachedSettings } from "@/server/services/settingService";
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
  const iconClass = "w-[18px] h-[18px] text-[#1B2B4B] shrink-0";
  switch (iconKey) {
    case "video":
      return <Video className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    case "notes":
    case "papers":
    case "file":
      return <FileText className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    case "practice":
      return <BookOpen className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    case "tests":
      return <Award className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    case "globe":
      return <Globe className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    case "infinity":
      return <InfinityIcon className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return <CheckCircle2 className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
}

function CourseDetailSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const course = await getCachedCourseBySlug(slug);

  if (!course || !course.published) {
    notFound();
  }

  // Published lectures with sanitized fields (videoUrl/provider never leaked for locked lectures)
  const lectures = await getCachedCourseLectures(course._id);

  // Published notes for this course (sanitized metadata for public shell)
  const { getCachedNotesForCourse } = await import("@/server/services/noteService");
  const rawNotes = await getCachedNotesForCourse(course._id);
  const notes = (rawNotes || []).map((n) => ({
    _id: n._id.toString(),
    title: n.title,
    kind: n.kind,
    category: n.category,
    source: n.source,
    pageCount: n.pageCount,
    section: n.section,
    book: n.book,
    chapter: n.chapter,
    isFree: n.isFree,
  }));

  // Related courses
  const relatedCourses = await getCachedRelatedCourses(course._id, course.category);

  // Site settings for WhatsApp and contact
  const settingDoc = await getCachedSettings();
  const phone =
    settingDoc?.whatsapp ||
    settingDoc?.whatsappNumber ||
    settingDoc?.phone ||
    SITE_CONFIG?.contact?.phone ||
    "918368545620";
  const whatsappDefaultMessage = settingDoc?.whatsappDefaultMessage || "";

  // Hero Chips: Only include items from real data, strictly deduplicated
  const chips = [];
  const seenTexts = new Set();

  const addChip = (icon, text) => {
    if (!text) return;
    const normalized = text.trim().toLowerCase();
    if (seenTexts.has(normalized)) return;
    seenTexts.add(normalized);
    chips.push({ icon, text: text.trim() });
  };

  if (lectures.length > 0) {
    addChip("video", `${lectures.length} HD Lectures`);
  }

  if (Array.isArray(course.highlights)) {
    for (const h of course.highlights) {
      const text = typeof h === "string" ? h : h.text || h.label || "";
      let icon = typeof h === "object" ? h.icon : "";
      if (!icon) {
        const lower = text.toLowerCase();
        if (lower.includes("note") || lower.includes("pdf")) icon = "notes";
        else if (lower.includes("practice") || lower.includes("question")) icon = "practice";
        else if (lower.includes("test") || lower.includes("exam")) icon = "tests";
        else if (lower.includes("video") || lower.includes("lecture")) icon = "video";
        else icon = "check";
      }
      // Skip duplicate lecture count if real lectures exist
      if (lectures.length > 0 && /^\d+\s+hd\s+lectures$/i.test(text)) {
        continue;
      }
      addChip(icon, text);
    }
  }

  // Bilingual chip from meta (guaranteed unique via addChip)
  const langText = course.language
    ? `${course.language} (Hindi + English)`
    : "Bilingual (Hindi + English)";
  addChip("globe", langText);

  // Title and highlighter logic
  const highlightCandidate =
    course.titleHighlight ||
    (course.subtitle ? `(${course.subtitle.replace(/^\(|\)$/g, "")})` : "");

  let titleMain = course.title;
  let titleHighlighted = "";

  if (highlightCandidate && course.title.includes(highlightCandidate)) {
    const parts = course.title.split(highlightCandidate);
    titleMain = parts[0].trim();
    titleHighlighted = highlightCandidate;
  } else if (highlightCandidate) {
    titleHighlighted = highlightCandidate;
  }

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
    <div className="min-h-screen w-full bg-[#FCFBF8] text-[#0F172A] pb-20 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO WRAPPER WITH WARM GRADIENT BACKGROUND & COMPACT HEIGHT (min 320px, max 360px) */}
      <div
        className="w-full relative overflow-hidden border-b border-[rgba(20,30,60,0.06)] pt-6 pb-7 min-h-[320px] lg:min-h-[320px] lg:max-h-[360px] max-[640px]:min-h-0 max-[640px]:h-auto"
        style={{
          background: "linear-gradient(180deg, #FFF8EE 0%, #FFF3E2 100%)",
        }}
      >
        {/* Decorative Blobs */}
        {/* Blob A: Large soft peach/yellow circle at the right behind the books (560px, right: -60px, top: -80px) */}
        <div
          className="absolute -right-[60px] -top-[80px] w-[560px] h-[560px] rounded-full pointer-events-none z-0 max-[640px]:w-[336px] max-[640px]:h-[336px]"
          style={{
            background: "radial-gradient(circle, rgba(255,214,150,0.65) 0%, rgba(255,214,150,0) 70%)",
          }}
          aria-hidden="true"
        />

        {/* Blob B: Large soft yellow circle at the bottom-left (420px, left: -140px, bottom: -200px) */}
        <div
          className="absolute -left-[140px] -bottom-[200px] w-[420px] h-[420px] rounded-full pointer-events-none z-0 max-[640px]:w-[252px] max-[640px]:h-[252px]"
          style={{
            backgroundColor: "rgba(255,201,87,0.28)",
            filter: "blur(2px)",
          }}
          aria-hidden="true"
        />

        {/* Blob C: Smaller pale peach circle at the top-center-right (260px, right: 32%, top: -120px) */}
        <div
          className="absolute right-[32%] -top-[120px] w-[260px] h-[260px] rounded-full pointer-events-none z-0 max-[640px]:w-[156px] max-[640px]:h-[156px]"
          style={{
            backgroundColor: "rgba(255,223,190,0.45)",
            filter: "blur(2px)",
          }}
          aria-hidden="true"
        />

        <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 relative z-10">
          {/* Left Content Column (max-width 620px, under 1100px: 56%, under 640px: full) */}
          <div className="w-full max-w-[620px] max-[1100px]:max-w-[56%] max-[640px]:max-w-full z-10">
            {/* Breadcrumb: < Courses > {course.title} (13px, gap below 10px) */}
            <nav aria-label="Breadcrumb" className="mb-2.5 text-[13px] text-[#556987]">
              <ol className="flex items-center gap-1.5">
                <li className="flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5 text-[#556987]" strokeWidth={1.75} />
                  <Link
                    href="/courses"
                    className="font-medium text-[#556987] hover:text-[#0B2A4A] transition-colors"
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <ChevronRight className="w-3 h-3 text-[#CBD5E1]" strokeWidth={1.75} />
                </li>
                <li className="font-medium text-[#556987] truncate max-w-[280px] sm:max-w-md">
                  {course.title} {course.subtitle ? `(${course.subtitle.replace(/^\(|\)$/g, "")})` : ""}
                </li>
              </ol>
            </nav>

            {/* Class Pill (Light Blue, gap below 10px) */}
            <div className="mb-2.5">
              <span className="inline-flex items-center rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
                {course.classLabel || "Class 12"}
              </span>
            </div>

            {/* Big Title (clamp(28px, 3.2vw, 44px), weight 800, line-height 1.06, 2 lines max with thin yellow marker band) */}
            <h1
              className="font-extrabold text-[#0B2A4A] tracking-tight line-clamp-2"
              style={{
                fontSize: "clamp(28px, 3.2vw, 44px)",
                lineHeight: 1.06,
              }}
            >
              <span>{titleMain}</span>{" "}
              {titleHighlighted && (
                <span
                  className="inline-block whitespace-nowrap ml-1 sm:ml-2 text-[#0B2A4A]"
                  style={{
                    backgroundImage: "linear-gradient(transparent 62%, #FFC93C 62%, #FFC93C 92%, transparent 92%)",
                  }}
                >
                  {titleHighlighted}
                </span>
              )}
            </h1>

            {/* Description Paragraph (15px, max 3 lines, gap 10px to title, 12px to chips) */}
            <p className="mt-2.5 text-[15px] text-[#475569] leading-relaxed line-clamp-3 max-w-[600px]">
              {course.description}
            </p>

            {/* Chips row on ONE line on desktop: gap 12px above, 14px text weight 500 navy, navy outline icons 18px, 18px gap between chips */}
            <div className="mt-3 flex flex-wrap min-[900px]:flex-nowrap items-center gap-[18px] text-[14px] font-medium text-[#1B2B4B]">
              {chips.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  {renderHighlightIcon(item.icon)}
                  <span className="text-[#1B2B4B] font-medium text-[14px]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Books Image: /images/courses/hero-books-reference.webp cropped only at right edge and slightly bottom */}
        <div
          className="absolute -right-[50px] -bottom-[48px] w-[clamp(400px,40vw,620px)] h-auto pointer-events-none select-none z-1 hidden min-[640px]:block max-[1100px]:w-[44%] max-[1100px]:-right-[40px] max-[900px]:w-[48%] max-[900px]:opacity-95"
          aria-hidden="true"
        >
          <Image
            src="/images/courses/hero-books-reference.webp"
            alt="Course Textbooks Stack"
            width={1800}
            height={1000}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* MAIN CONTAINER: TABS, ACCORDION & SIDEBAR (Max 1240px) */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<CourseDetailSkeleton />}>
          <CourseDetailClient
            course={course}
            lectures={lectures}
            initialNotes={notes}
            relatedCourses={relatedCourses}
            siteWhatsapp={phone}
            whatsappDefaultMessage={whatsappDefaultMessage}
          />
        </Suspense>
      </main>
    </div>
  );
}
