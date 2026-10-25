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

export default function CourseCard({
  course = {},
  variant = "home", // "home" | "catalog"
  className = "",
}) {
  const {
    title = "Course Title",
    subtitle = "",
    slug = "",
    classLabel = "Class 12",
    badgeText = "",
    badgeVariant = "crown-navy",
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

  const phone = SITE_CONFIG?.contact?.phone || "918368545620";
  const defaultWaText =
    whatsappText || `Hello RD Classes, I want to know more about ${title}.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    defaultWaText
  )}`;

  const MetaIconComponent =
    metaIcon === "clock" ? Clock : metaIcon === "file" ? FileText : Video;

  const isCrown = badgeVariant === "crown-navy";
  const isCatalog = variant === "catalog";

  if (isCatalog) {
    // =========================================================================
    // CATALOG VARIANT (/courses page)
    // =========================================================================
    return (
      <div
        data-course-tone={tone}
        className={`course-card-container group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] course-card ${className}`}
        style={{
          background: "var(--course-tint-gradient)",
        }}
      >
        <div className="p-5 sm:p-6 pb-0 flex-1 flex flex-col">
          {/* Top Pill Row */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-800 shadow-2xs">
              {classLabel}
            </span>

            {badgeText && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-extrabold shadow-2xs"
                style={{
                  backgroundColor: "var(--course-badge-bg)",
                  color: "var(--course-badge-text)",
                }}
              >
                {isCrown && <Crown className="h-3 w-3 fill-current" />}
                <span>{badgeText}</span>
              </span>
            )}
          </div>

          {/* Title & Illustration Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] sm:text-[21px] font-extrabold text-[#0F172A] leading-tight">
                {title}
              </h3>
              {subtitle && (
                <div className="text-[15px] font-semibold text-[#475569] mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>

            {/* Illustration */}
            <div className="w-[105px] h-[85px] shrink-0 course-card-illustration pointer-events-none select-none">
              <CourseIllustration name={illustration} />
            </div>
          </div>

          {/* Description */}
          <p className="text-[13px] leading-relaxed text-[#5B6676] line-clamp-2 mb-4">
            {description}
          </p>

          {/* Meta & Language Row */}
          <div className="mt-auto pt-3 border-t border-black/6 flex items-center justify-between gap-3 text-[12px] font-medium text-[#475569]">
            <div className="flex items-center gap-1.5 truncate">
              <MetaIconComponent className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{metaText}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>{language}</span>
            </div>
          </div>

          {/* Faculty Row */}
          <div className="flex items-center gap-2.5 pt-3 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFC21A] text-[11px] font-black text-slate-900 shadow-2xs shrink-0">
              RD
            </div>
            <div className="truncate">
              <div className="text-[12.5px] font-bold text-[#0F172A] truncate">
                {facultyName}
              </div>
              <div className="text-[10.5px] text-[#64748B] truncate">
                {facultyRole}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex items-center gap-2.5 pt-2">
          <Link
            href={`/courses/${slug}`}
            className="flex-1 flex h-[44px] items-center justify-center gap-2 rounded-full text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: "var(--course-btn-bg)",
              color: "var(--course-btn-text)",
            }}
          >
            <span>View Course</span>
            <ArrowRight className="h-4 w-4 course-btn-arrow" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp about ${title}`}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
            style={{
              backgroundColor: "var(--course-chat-bg-cat)",
              color: "var(--course-chat-color-cat)",
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
      data-course-tone={tone}
      className={`course-card-container group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-black/8 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)] course-card ${className}`}
    >
      {/* Top Banner Area with Tint */}
      <div
        className="relative p-6 sm:p-7 pb-4 overflow-hidden rounded-t-[26px]"
        style={{
          background: "var(--course-tint)",
          minHeight: "172px",
        }}
      >
        {/* Top Pills */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-800 shadow-2xs">
            {classLabel}
          </span>

          {badgeText && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-2xs"
              style={{
                backgroundColor: "var(--course-badge-bg)",
                color: "var(--course-badge-text)",
              }}
            >
              {isCrown && <Crown className="h-3.5 w-3.5 fill-current" />}
              <span>{badgeText}</span>
            </span>
          )}
        </div>

        {/* Title & Overlapping Illustration */}
        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-[22px] sm:text-[24px] font-extrabold text-[#0F172A] leading-tight">
              {title}
            </h3>
            {subtitle && (
              <div className="text-[17px] sm:text-[18px] font-normal text-[#475569] mt-0.5">
                {subtitle}
              </div>
            )}
          </div>

          {/* Right Illustration */}
          <div className="w-[125px] h-[100px] shrink-0 -mr-2 -mb-2 course-card-illustration pointer-events-none select-none">
            <CourseIllustration name={illustration} />
          </div>
        </div>
      </div>

      {/* White Body */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 pt-5 space-y-4 bg-white">
        {/* Description (3 lines clamp) */}
        <p className="text-[14px] leading-relaxed text-[#5B6676] line-clamp-3">
          {description}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100" />

        {/* Meta Row */}
        <div className="flex items-center justify-between gap-4 text-[13px] font-semibold text-[#475569]">
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
              <MetaIconComponent className="h-4 w-4" />
            </div>
            <span className="truncate">{metaText}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-medium">
            <Globe className="h-4 w-4" />
            <span>{language}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100" />

        {/* Faculty Row */}
        <div className="flex items-center gap-3">
          {/* Gold gradient circular avatar ring */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full p-0.5 shadow-xs shrink-0"
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

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/courses/${slug}`}
            className="flex-1 flex h-[48px] items-center justify-center gap-2 rounded-full text-sm font-extrabold shadow-sm transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: "var(--course-btn-bg)",
              color: "var(--course-btn-text)",
            }}
          >
            <span>View Course</span>
            <ArrowRight className="h-4 w-4 course-btn-arrow" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp about ${title}`}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full shadow-2xs transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
            style={{
              backgroundColor: "var(--course-chat-bg-home)",
              color: "var(--course-chat-color-home)",
            }}
          >
            <MessageCircle className="h-5 w-5 fill-current" />
          </a>
        </div>
      </div>
    </div>
  );
}
