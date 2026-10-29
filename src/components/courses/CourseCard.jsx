import Link from "next/link";
import {
  Video,
  FileText,
  Clock,
  Globe,
  ArrowRight,
  MessageCircle,
  Crown,
} from "lucide-react";
import CourseIllustration from "./illustrations";
import { SITE_CONFIG } from "@/constants/site";
import Rating from "@/components/sections/FeaturedCourses/Rating";

/**
 * 6 Unique Theme Configurations:
 * 1. Blue: Header #DCEBFB to #EAF3FD, button navy #0F2A4A (white text), badge navy #0F2A4A
 * 2. Yellow: Header #FFF1C2 to #FFF7DD, button #FFB800 (dark text), badge yellow #FFB800
 * 3. Orange/Peach: Header #FDD9C8 to #FEE9DF, button #FF6B00 (white text), badge orange #FF6B00
 * 4. Emerald/Mint: Header #D3F1E6 to #E8F8F2, button #0E9F7E (white text), badge dark emerald #0B6B55
 * 5. Violet/Lavender: Header #E4DDFA to #F1EDFD, button #6C4BDB (white text), badge violet #6C4BDB
 * 6. Rose/Pink: Header #FBD3E2 to #FDE8F0, button #E0457B (white text), badge rose #E0457B
 */
const TONE_CONFIG = {
  sky: {
    // 1. Blue (Class 12 Full Year)
    headerGradient: "linear-gradient(180deg, #DCEBFB 0%, #F5FAFE 60%, #FFFFFF 100%)",
    blobColor: "#B3D4F8",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#0F2A4A",
    badgeText: "#FFFFFF",
    btnBg: "#0F2A4A",
    btnHover: "#163A64",
    btnText: "#FFFFFF",
    chatBg: "#0F2A4A",
    chatColor: "#FFFFFF",
    iconBg: "#E0F2FE",
    iconColor: "#0284C7",
    hoverGlow: "rgba(15, 42, 74, 0.16)",
  },
  yellow: {
    // 2. Yellow (Class 11 Foundation)
    headerGradient: "linear-gradient(180deg, #FFF1C2 0%, #FFFDF5 60%, #FFFFFF 100%)",
    blobColor: "#FFE28A",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#FFB800",
    badgeText: "#FFFFFF",
    btnBg: "#FFB800",
    btnHover: "#FFAE00",
    btnText: "#0A0A0A",
    chatBg: "#FFB800",
    chatColor: "#FFFFFF",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    hoverGlow: "rgba(255, 184, 0, 0.22)",
  },
  orange: {
    // 3. Orange/Peach (Class 12 Board Revision)
    headerGradient: "linear-gradient(180deg, #FDD9C8 0%, #FFF8F5 60%, #FFFFFF 100%)",
    blobColor: "#FBAE93",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#FF6B00",
    badgeText: "#FFFFFF",
    btnBg: "#FF6B00",
    btnHover: "#E85F00",
    btnText: "#FFFFFF",
    chatBg: "#FF6B00",
    chatColor: "#FFFFFF",
    iconBg: "#FFEDD5",
    iconColor: "#EA580C",
    hoverGlow: "rgba(255, 107, 0, 0.2)",
  },
  emerald: {
    // 4. Emerald/Mint (Class 12 Recorded)
    headerGradient: "linear-gradient(180deg, #D3F1E6 0%, #F5FCF8 60%, #FFFFFF 100%)",
    blobColor: "#A2E5CB",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#0B6B55",
    badgeText: "#FFFFFF",
    btnBg: "#0B6B55",
    btnHover: "#0C8B6E",
    btnText: "#FFFFFF",
    chatBg: "#0B6B55",
    chatColor: "#FFFFFF",
    iconBg: "#D8F3E5",
    iconColor: "#0E9F7E",
    hoverGlow: "rgba(14, 159, 126, 0.2)",
  },
  green: {
    // Alias to emerald
    headerGradient: "linear-gradient(180deg, #D3F1E6 0%, #F5FCF8 60%, #FFFFFF 100%)",
    blobColor: "#A2E5CB",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#0B6B55",
    badgeText: "#FFFFFF",
    btnBg: "#0B6B55",
    btnHover: "#0C8B6E",
    btnText: "#FFFFFF",
    chatBg: "#0B6B55",
    chatColor: "#FFFFFF",
    iconBg: "#D8F3E5",
    iconColor: "#0E9F7E",
    hoverGlow: "rgba(14, 159, 126, 0.2)",
  },
  violet: {
    // 5. Violet/Lavender (Class 12 Mock Test)
    headerGradient: "linear-gradient(180deg, #E4DDFA 0%, #FAF8FE 60%, #FFFFFF 100%)",
    blobColor: "#C9BBF5",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#6C4BDB",
    badgeText: "#FFFFFF",
    btnBg: "#6C4BDB",
    btnHover: "#5B3CC7",
    btnText: "#FFFFFF",
    chatBg: "#6C4BDB",
    chatColor: "#FFFFFF",
    iconBg: "#EDE8FD",
    iconColor: "#6C4BDB",
    hoverGlow: "rgba(108, 75, 219, 0.2)",
  },
  purple: {
    // Alias to violet
    headerGradient: "linear-gradient(180deg, #E4DDFA 0%, #FAF8FE 60%, #FFFFFF 100%)",
    blobColor: "#C9BBF5",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#6C4BDB",
    badgeText: "#FFFFFF",
    btnBg: "#6C4BDB",
    btnHover: "#5B3CC7",
    btnText: "#FFFFFF",
    chatBg: "#6C4BDB",
    chatColor: "#FFFFFF",
    iconBg: "#EDE8FD",
    iconColor: "#6C4BDB",
    hoverGlow: "rgba(108, 75, 219, 0.2)",
  },
  rose: {
    // 6. Rose/Pink (Class 11 Quick Revision)
    headerGradient: "linear-gradient(180deg, #FBD3E2 0%, #FFF7F7 60%, #FFFFFF 100%)",
    blobColor: "#F7AECB",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#E0457B",
    badgeText: "#FFFFFF",
    btnBg: "#E0457B",
    btnHover: "#CC356A",
    btnText: "#FFFFFF",
    chatBg: "#E0457B",
    chatColor: "#FFFFFF",
    iconBg: "#FCE4EC",
    iconColor: "#E0457B",
    hoverGlow: "rgba(224, 69, 123, 0.2)",
  },
  red: {
    // Alias to rose
    headerGradient: "linear-gradient(180deg, #FBD3E2 0%, #FFF7F7 60%, #FFFFFF 100%)",
    blobColor: "#F7AECB",
    classPillBg: "rgba(255, 255, 255, 0.95)",
    classPillText: "#0F172A",
    badgeBg: "#E0457B",
    badgeText: "#FFFFFF",
    btnBg: "#E0457B",
    btnHover: "#CC356A",
    btnText: "#FFFFFF",
    chatBg: "#E0457B",
    chatColor: "#FFFFFF",
    iconBg: "#FCE4EC",
    iconColor: "#E0457B",
    hoverGlow: "rgba(224, 69, 123, 0.2)",
  },
};

TONE_CONFIG.blue = TONE_CONFIG.sky;

const COURSE_3D_ASSETS = {
  books: "/images/courses/books-3d.webp",
  "books-blue": "/images/courses/books-3d.webp",
  "books-3d": "/images/courses/books-3d.webp",
  "open book with pen": "/images/courses/open-book-3d.webp",
  "open-book": "/images/courses/open-book-3d.webp",
  "open-book-3d": "/images/courses/open-book-3d.webp",
  target: "/images/courses/target-3d.webp",
  "target-3d": "/images/courses/target-3d.webp",
  "revision notepad": "/images/courses/revision-plan-3d.webp",
  "revision-notepad": "/images/courses/revision-plan-3d.webp",
  "revision-plan": "/images/courses/revision-plan-3d.webp",
  "revision-plan-3d": "/images/courses/revision-plan-3d.webp",
  laptop: "/images/courses/laptop-play-3d.webp",
  "laptop-play": "/images/courses/laptop-play-3d.webp",
  "laptop-play-3d": "/images/courses/laptop-play-3d.webp",
  "test paper": "/images/courses/test-paper-3d.webp",
  "test-paper": "/images/courses/test-paper-3d.webp",
  "checklist-clock": "/images/courses/test-paper-3d.webp",
  "test-paper-3d": "/images/courses/test-paper-3d.webp",
  textbook: "/images/courses/open-book-orange-3d.webp",
  "notebook-red": "/images/courses/revision-plan-3d.webp",
  "open-book-orange": "/images/courses/open-book-orange-3d.webp",
  "open-book-orange-3d": "/images/courses/open-book-orange-3d.webp",
};

export default function CourseCard({
  course = {},
  variant = "home", // "home" | "catalog"
  className = "",
}) {
  const {
    title: initialTitle = "Course Title",
    subtitle: initialSubtitle = "",
    slug = "",
    classLabel = "Class 12",
    badgeText = "",
    tone = "sky",
    illustration = "books-blue",
    description = "",
    metaIcon = "video",
    metaText = "",
    language = "Bilingual",
    facultyName = "Ronak Dugar",
    facultyRole = "Lead Accountancy Faculty",
    whatsappText = "",
  } = course;

  // 1. Resolve theme tone (supports blue, yellow, orange, emerald, violet, rose, and aliases)
  const rawTone = course.theme || course.tone || "blue";
  const toneMapping = {
    blue: "sky",
    sky: "sky",
    yellow: "yellow",
    orange: "orange",
    emerald: "emerald",
    green: "emerald",
    violet: "violet",
    purple: "violet",
    rose: "rose",
    red: "rose",
  };
  const resolvedTone = toneMapping[rawTone] || "sky";
  const currentTone = TONE_CONFIG[resolvedTone] || TONE_CONFIG.sky;

  // 2. Direct database-driven title & subtitle (no hardcoded overrides)
  const effectiveTitle = course.title || initialTitle;
  const effectiveSubtitle = course.subtitle || initialSubtitle;

  // 3. Resolve illustration: custom URL takes priority, then key lookup, then fallback
  let illustrationSrc =
    course.illustrationUrl ||
    COURSE_3D_ASSETS[course.illustrationKey] ||
    COURSE_3D_ASSETS[course.illustration] ||
    null;

  if (!illustrationSrc) {
    if (slug.includes("recorded") || slug.includes("laptop")) {
      illustrationSrc = "/images/courses/laptop-play-3d.webp";
    } else if (slug.includes("test") || slug.includes("paper")) {
      illustrationSrc = "/images/courses/test-paper-3d.webp";
    } else if (
      slug === "class-12-accountancy-crash-course" ||
      (slug.includes("crash") && slug.includes("12")) ||
      resolvedTone === "orange"
    ) {
      illustrationSrc = "/images/courses/target-3d.webp";
    } else if (
      slug === "class-11-accountancy-crash-course" ||
      (slug.includes("crash") && slug.includes("11")) ||
      resolvedTone === "rose"
    ) {
      illustrationSrc = "/images/courses/revision-plan-3d.webp";
    } else if (
      slug.includes("11") &&
      (slug.includes("foundation") || resolvedTone === "yellow")
    ) {
      illustrationSrc = "/images/courses/open-book-3d.webp";
    } else {
      illustrationSrc = "/images/courses/books-3d.webp";
    }
  }

  // 4. Exact badges from database
  const effectiveBadgeText =
    course.badgeText !== undefined && course.badgeText !== ""
      ? course.badgeText
      : badgeText;

  const isCrown =
    Boolean(effectiveBadgeText) &&
    (effectiveBadgeText.toLowerCase().includes("popular") ||
      course.badgeVariant === "crown-navy");

  // 5. Description from database
  const effectiveDescription = course.description || description;

  // 6. Meta text from database (supports metaText, or metaLeft + metaRight)
  let effectiveMetaText = course.metaText || metaText;
  if (!effectiveMetaText) {
    if (course.metaLeft && course.metaRight) {
      effectiveMetaText = `${course.metaLeft} · ${course.metaRight}`;
    } else {
      effectiveMetaText = course.metaLeft || course.metaRight || "";
    }
  }

  // 7. Ratings & Student Counts
  const ratingValue =
    typeof course.rating === "number" && course.rating > 0
      ? course.rating
      : 4.9;
  const hasRating = Boolean(course.rating !== false && ratingValue);

  const studentsCount = course.ratingCount
    ? `${course.ratingCount}+`
    : course.reviewCount
    ? String(course.reviewCount).replace(/[()]/g, "").replace(/\s*students\s*/i, "")
    : "150+";

  const phone = SITE_CONFIG?.contact?.phone || "918368545620";
  const defaultWaText =
    whatsappText || `Hello RD Classes, I want to know more about ${effectiveTitle}.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    defaultWaText
  )}`;

  const MetaIconComponent =
    metaIcon === "clock" ? Clock : metaIcon === "file" ? FileText : Video;

  if (variant === "student") {
    const percent = course.percent !== undefined ? course.percent : 0;
    const completedLectures = course.completedLectures || 0;
    const totalLectures = course.totalLectures || 0;
    const studentLecturesHref = `/student/lectures/${slug}`;

    return (
      <div
        data-course-tone={resolvedTone}
        className={`course-card-container group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.12)] transition-all h-full ${className}`}
        style={{
          "--course-hover-glow": currentTone.hoverGlow,
        }}
      >
        {/* Top Banner Area with Pastel Gradient & 3D Illustration */}
        <Link
          href={studentLecturesHref}
          className="relative p-6 pb-5 rounded-t-[28px] block focus:outline-none"
          style={{
            background: currentTone.headerGradient,
            minHeight: "180px",
          }}
        >
          {/* Decorative Soft Circle Blob */}
          <div className="absolute inset-0 overflow-hidden rounded-t-[28px] pointer-events-none z-0">
            <div
              className="absolute -right-4 -bottom-6 w-[160px] h-[160px] rounded-full blur-[14px]"
              style={{
                backgroundColor: currentTone.blobColor,
                opacity: 0.55,
              }}
              aria-hidden="true"
            />
          </div>

          {/* Top Pills Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-2xs"
              style={{
                backgroundColor: currentTone.classPillBg,
                color: currentTone.classPillText,
              }}
            >
              {classLabel}
            </span>

            {effectiveBadgeText && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-2xs"
                style={{
                  backgroundColor: currentTone.badgeBg,
                  color: currentTone.badgeText,
                }}
              >
                {isCrown && <Crown className="h-3.5 w-3.5 fill-current" />}
                <span>{effectiveBadgeText}</span>
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="relative z-10 max-w-[58%] pr-2 flex flex-col justify-start">
            <h3 className="text-[19px] sm:text-[21px] font-extrabold text-[#0F172A] leading-[1.2] tracking-tight group-hover:text-amber-800 transition-colors">
              {effectiveTitle}
            </h3>
            {effectiveSubtitle && (
              <div className="text-[13px] font-semibold text-[#475569] mt-1 line-clamp-1">
                {effectiveSubtitle}
              </div>
            )}
          </div>

          {/* Polished 3D-Style Illustration */}
          <div
            className="absolute right-2 -bottom-3 w-[40%] max-w-[170px] h-[120px] z-20 pointer-events-none select-none course-3d-illustration flex items-end justify-end"
            style={{
              filter: "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.16))",
            }}
          >
            {illustrationSrc ? (
              <img
                src={illustrationSrc}
                alt=""
                className="w-full h-full object-contain object-bottom-right"
                style={{
                  mixBlendMode: course.illustrationUrl ? "normal" : "multiply",
                }}
                loading="lazy"
              />
            ) : (
              <CourseIllustration name={illustration} />
            )}
          </div>
        </Link>

        {/* White Body Content with Progress Bar */}
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 pt-4 space-y-4 bg-white">
          <p className="text-[12.5px] leading-[19px] text-[#5B6676] line-clamp-2">
            {effectiveDescription || "Comprehensive CBSE Accountancy lectures, chapter notes and practice sets."}
          </p>

          {/* Progress Bar Row */}
          <div className="space-y-2 pt-1 border-t border-black/5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#6B7280]">Course Progress</span>
              <span className="text-[#D97706] font-extrabold">{percent}%</span>
            </div>

            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FDB813] rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>{completedLectures} of {totalLectures} lectures watched</span>
              <span className="font-semibold text-emerald-700">Enrolled</span>
            </div>
          </div>

          {/* Footer Action Button */}
          <div className="pt-2">
            <Link
              href={studentLecturesHref}
              className="w-full flex h-[44px] items-center justify-center gap-2 rounded-full text-xs sm:text-[13px] font-extrabold shadow-sm transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: currentTone.btnBg,
                color: currentTone.btnText,
              }}
            >
              <span>View Chapters &amp; Lectures</span>
              <ArrowRight className="h-4 w-4 course-btn-arrow" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCatalog = variant === "catalog";

  if (isCatalog) {
    // =========================================================================
    // CATALOG VARIANT (/courses page)
    // =========================================================================
    return (
      <div
        data-course-tone={resolvedTone}
        className={`course-card-container group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] course-card ${className}`}
        style={{
          background: "var(--course-tint-gradient)",
          minHeight: "318px",
          "--course-hover-glow": currentTone.hoverGlow,
        }}
      >
        <div className="p-5 pb-0 flex-1 flex flex-col">
          {/* Top Pill Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center h-[30px] rounded-full bg-white px-3.5 text-[12px] font-extrabold uppercase tracking-wide text-slate-800 shadow-2xs">
              {classLabel}
            </span>

            {effectiveBadgeText && (
              <span
                className="inline-flex items-center h-[30px] gap-1.5 rounded-full px-3.5 text-[12px] font-extrabold shadow-2xs"
                style={{
                  backgroundColor: currentTone.badgeBg,
                  color: currentTone.badgeText,
                }}
              >
                {isCrown && <Crown className="h-3 w-3 fill-current" />}
                <span>{effectiveBadgeText}</span>
              </span>
            )}
          </div>

          {/* Title & Illustration Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-[22px] font-extrabold text-[#0F172A] leading-[24px] line-clamp-2">
                {effectiveTitle}
              </h3>
              {effectiveSubtitle && (
                <div className="text-[13px] font-semibold text-[#475569] mt-0.5">
                  {effectiveSubtitle}
                </div>
              )}
            </div>

            <div
              className="w-[120px] h-[90px] shrink-0 course-3d-illustration pointer-events-none select-none -mr-1 -mt-1"
              style={{
                filter: "drop-shadow(0 10px 14px rgba(0, 0, 0, 0.18))",
              }}
            >
              {illustrationSrc ? (
                <img
                  src={illustrationSrc}
                  alt=""
                  className="w-full h-full object-contain"
                  style={{
                    mixBlendMode: course.illustrationUrl ? "normal" : "multiply",
                  }}
                  loading="lazy"
                />
              ) : (
                <CourseIllustration name={illustration} />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-[12.5px] leading-[18px] text-[#5B6676] line-clamp-3 mb-3">
            {effectiveDescription}
          </p>

          {/* Meta & Language Row */}
          <div className="mt-auto pt-2.5 border-t border-black/6 flex items-center justify-between gap-3 text-[13px] font-medium text-[#475569]">
            <div className="flex items-center gap-1.5 truncate">
              <MetaIconComponent className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{effectiveMetaText}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>{language}</span>
            </div>
          </div>

          {/* Faculty Row */}
          <div className="flex items-center gap-3 pt-3 mb-3">
            <div className="w-[40px] h-[40px] rounded-full bg-[#FFC21A] text-slate-900 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              RD
            </div>
            <div className="truncate">
              <div className="text-[13px] font-bold text-[#0F172A] truncate">
                {facultyName}
              </div>
              <div className="text-[11px] text-[#64748B] truncate">
                {facultyRole}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 flex items-center gap-2.5 pt-1 mt-auto">
          <Link
            href={`/courses/${slug}`}
            className="flex-1 flex h-[42px] items-center justify-center gap-2 rounded-full text-[13px] font-extrabold shadow-sm transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: currentTone.btnBg,
              color: currentTone.btnText,
            }}
          >
            <span>View Course</span>
            <ArrowRight className="h-4 w-4 course-btn-arrow" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp about ${effectiveTitle}`}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
            style={{
              backgroundColor: currentTone.chatBg,
              color: currentTone.chatColor,
            }}
          >
            <MessageCircle className="h-5 w-5 fill-current" />
          </a>
        </div>
      </div>
    );
  }

  // =========================================================================
  // HOME VARIANT (Featured Section on Home)
  // =========================================================================
  return (
    <div
      data-course-tone={resolvedTone}
      className={`course-card-container group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] course-card h-full ${className}`}
      style={{
        "--course-hover-glow": currentTone.hoverGlow,
      }}
    >
      {/* Top Banner Area with Pastel Gradient & 3D Illustration */}
      <div
        className="relative p-6 sm:p-7 pb-5 rounded-t-[28px]"
        style={{
          background: currentTone.headerGradient,
          minHeight: "196px",
        }}
      >
        {/* Decorative Soft Circle Blob behind illustration in darker tint of header (not white) */}
        <div className="absolute inset-0 overflow-hidden rounded-t-[28px] pointer-events-none z-0">
          <div
            className="absolute -right-4 -bottom-6 w-[170px] h-[170px] rounded-full blur-[14px]"
            style={{
              backgroundColor: currentTone.blobColor,
              opacity: 0.55,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Top Pills Row */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
          <span
            className="inline-flex items-center rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide shadow-2xs"
            style={{
              backgroundColor: currentTone.classPillBg,
              color: currentTone.classPillText,
            }}
          >
            {classLabel}
          </span>

          {effectiveBadgeText && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-2xs"
              style={{
                backgroundColor: currentTone.badgeBg,
                color: currentTone.badgeText,
              }}
            >
              {isCrown && <Crown className="h-3.5 w-3.5 fill-current" />}
              <span>{effectiveBadgeText}</span>
            </span>
          )}
        </div>

        {/* Title & Subtitle with fixed height so rows stay aligned, max-w-[56%] so illustration never overlaps */}
        <div className="relative z-10 max-w-[56%] pr-2 min-h-[76px] sm:min-h-[80px] flex flex-col justify-start">
          <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-extrabold text-[#0F172A] leading-[1.18] tracking-tight">
            {effectiveTitle}
          </h3>
          {effectiveSubtitle && (
            <div className="text-[14px] sm:text-[15px] font-bold text-[#475569] mt-1">
              {effectiveSubtitle}
            </div>
          )}
        </div>

        {/* Polished 3D-Style Illustration with natural drop-shadow and multiply blend */}
        <div
          className="absolute right-1 sm:right-2 -bottom-4 sm:-bottom-5 w-[40%] md:w-[42%] lg:w-[44%] max-w-[195px] h-[125px] sm:h-[135px] lg:h-[142px] z-20 pointer-events-none select-none course-3d-illustration flex items-end justify-end"
          style={{
            filter: "drop-shadow(0 10px 14px rgba(0, 0, 0, 0.18))",
          }}
        >
          {illustrationSrc ? (
            <img
              src={illustrationSrc}
              alt=""
              className="w-full h-full object-contain object-bottom-right"
              style={{
                mixBlendMode: course.illustrationUrl ? "normal" : "multiply",
              }}
              loading="lazy"
            />
          ) : (
            <CourseIllustration name={illustration} />
          )}
        </div>
      </div>

      {/* White Body Content */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 pt-5 sm:pt-6 space-y-4 bg-white">
        <div>
          {hasRating && (
            <div className="mb-2.5">
              <Rating rating={ratingValue} students={studentsCount} />
            </div>
          )}
          {/* Description */}
          <p className="text-[13px] sm:text-[13px] lg:text-[13.5px] leading-[20px] lg:leading-[21px] text-[#5B6676] line-clamp-3 min-h-[42px] md:min-h-[60px] lg:min-h-[42px]">
            {effectiveDescription}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100" />

        {/* Meta Row: Icon + Text on left, Globe + Language on right */}
        <div className="flex items-center justify-between text-[13px] font-semibold text-[#475569] h-[32px]">
          <div className="flex items-center gap-2 truncate">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
              style={{
                backgroundColor: currentTone.iconBg,
                color: currentTone.iconColor,
              }}
            >
              <MetaIconComponent className="h-4 w-4" />
            </div>
            <span className="truncate">{effectiveMetaText}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-medium">
            <Globe className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{language}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100" />

        {/* Faculty Row */}
        <div className="flex items-center gap-3 h-[42px]">
          {/* Gold circular ring with RD initials */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full p-[2px] shadow-xs shrink-0"
            style={{
              background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">
              RD
            </div>
          </div>
          <div className="truncate">
            <div className="text-sm font-extrabold text-[#0F172A] truncate">
              {facultyName}
            </div>
            <div className="text-xs text-[#64748B] truncate">{facultyRole}</div>
          </div>
        </div>

        {/* Footer Actions: Full-width button + Circular WhatsApp */}
        <div className="mt-auto pt-3 flex items-center gap-2.5 h-[56px]">
          <Link
            href={`/courses/${slug}`}
            className="flex-1 flex h-[46px] items-center justify-center gap-2 rounded-full text-sm font-extrabold shadow-sm transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: currentTone.btnBg,
              color: currentTone.btnText,
            }}
          >
            <span>View Course</span>
            <ArrowRight className="h-4 w-4 course-btn-arrow" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp about ${effectiveTitle}`}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full shadow-2xs transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
            style={{
              backgroundColor: currentTone.chatBg,
              color: currentTone.chatColor,
            }}
          >
            <MessageCircle className="h-5 w-5 fill-current" />
          </a>
        </div>
      </div>
    </div>
  );
}
