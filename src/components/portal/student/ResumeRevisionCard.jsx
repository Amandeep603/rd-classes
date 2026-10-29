"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Bookmark, ArrowRight, MessageCircle } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";
import { toggleBookmarkAction } from "@/server/actions/student.progress.actions.js";

export default function ResumeRevisionCard({
  resume,
  firstLectureId,
  hasCourses = true,
  whatsappNumber = "",
  totalLectures = 0,
}) {
  const [isBookmarked, setIsBookmarked] = useState(resume?.bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleToggleBookmark = async () => {
    if (!resume?.lectureId || bookmarking) return;
    setBookmarking(true);
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      await toggleBookmarkAction(resume.lectureId);
    } catch {
      setIsBookmarked(!nextState); // rollback
    } finally {
      setBookmarking(false);
    }
  };

  const cleanPhone = (whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone || "918368545620"}?text=${encodeURIComponent(
    "Hello Sir, I have logged into the student portal but do not see my course assigned yet."
  )}`;

  // Determine display values based on real data or graceful filled empty states
  let title = "Start your first lecture";
  let subtitle = "Pick a lecture from your course to begin.";
  let positionMin = 0;
  let durationMin = 0;
  let percent = 0;
  let watchUrl = firstLectureId ? `/student/watch/${firstLectureId}` : "/student/lectures";
  let buttonText = "Start Learning";
  let showBookmark = true;
  let isNoCourse = !hasCourses;

  if (isNoCourse) {
    title = "No course assigned yet";
    subtitle = "Please contact RD Classes on WhatsApp to assign your course.";
    buttonText = "Contact on WhatsApp";
    watchUrl = whatsappUrl;
    showBookmark = false;
  } else if (resume) {
    title = resume.lectureTitle || "Continue your lecture";
    subtitle =
      resume.chapterPath ||
      (resume.section ? `${resume.section}` : "Chapter Revision");
    durationMin = Math.round((resume.durationSec || 0) / 60);
    positionMin = Math.round((resume.positionSec || 0) / 60);
    percent = resume.percent || 0;
    watchUrl = `/student/watch/${resume.lectureId}`;
    buttonText = "Resume Lecture";
  }

  const allLecturesCount =
    (resume?.totalCourseLectures) || totalLectures || 0;
  const allLecturesUrl = resume?.courseSlug
    ? `/student/lectures/${resume.courseSlug}`
    : "/student/lectures";

  return (
    <div className="relative flex min-h-[300px] h-full flex-col justify-between rounded-[24px] border border-[#E8ECF2] bg-white p-7 sm:p-[28px] shadow-sm overflow-hidden">
      {/* Soft yellow curve/glow behind books illustration on the right */}
      <div
        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#FFFBF0] opacity-80 blur-2xl -z-0 select-none"
        aria-hidden="true"
      />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#B7791F]">
            RESUME YOUR REVISION
          </span>
          <h2 className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#1F2A44] leading-[1.25] line-clamp-2 max-w-[500px]">
            {title}
          </h2>
          <p className="mt-1 text-[15px] font-medium text-[#5B6577] truncate max-w-[500px]">
            {subtitle}
          </p>
        </div>

        {/* Bookmark circle button (44px, light blue-gray) */}
        {showBookmark ? (
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarking || !resume?.lectureId}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lecture"}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-black/6 bg-[#F4F7FA] text-[#4B5563] hover:text-[#1F2A44] hover:bg-[#EAEFF4] transition-colors shrink-0 shadow-2xs cursor-pointer disabled:cursor-default"
          >
            <Bookmark
              className={`h-[18px] w-[18px] ${
                isBookmarked
                  ? "fill-[#FFC93C] text-[#FFC93C]"
                  : "text-[#6B7A99]"
              }`}
            />
          </button>
        ) : (
          <div className="h-[44px] w-[44px] shrink-0" />
        )}
      </div>

      {/* Middle Progress Row & Books Illustration */}
      <div className="relative z-10 flex items-center justify-between gap-6 my-auto py-3">
        <div className="w-full max-w-[480px] space-y-2">
          <div className="flex items-center justify-between text-[15px]">
            <span className="font-semibold text-[#1F2A44]">
              {positionMin} of {durationMin} mins
            </span>
            <span className="font-bold text-[#B7791F]">
              {percent}% Completed
            </span>
          </div>

          {/* 10px rounded progress bar (yellow fill on #ECEFF3 track) */}
          <div className="h-[10px] w-full rounded-full bg-[#ECEFF3] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FFC93C] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </div>

        {/* Stack of light-blue and yellow books illustration on the right */}
        <div className="hidden sm:block absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10">
          <svg
            width="140"
            height="100"
            viewBox="0 0 140 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="select-none"
            aria-hidden="true"
          >
            {/* Soft cream curved shadow hill */}
            <ellipse cx="70" cy="88" rx="55" ry="9" fill="#FFF2D6" />

            {/* Bottom Book (Soft Blue) */}
            <g transform="translate(14, 46)">
              <polygon points="10,20 62,31 114,20 62,9" fill="#BAE6FD" />
              <polygon points="10,20 10,27 62,38 62,31" fill="#7DD3FC" />
              <polygon points="62,31 62,38 114,27 114,20" fill="#0284C7" />
              <polygon points="13,20 62,29 111,20 62,11" fill="#F8FAFC" />
            </g>

            {/* Middle Book (Yellow / Gold) */}
            <g transform="translate(20, 30)">
              <polygon points="10,18 56,27 102,18 56,9" fill="#FDE68A" />
              <polygon points="10,18 10,24 56,33 56,27" fill="#FCD34D" />
              <polygon points="56,27 56,33 102,24 102,18" fill="#F59E0B" />
              <polygon points="13,18 56,25 99,18 56,11" fill="#FFFBEB" />
            </g>

            {/* Top Book (Sky Blue with gold bookmark ribbon) */}
            <g transform="translate(26, 14)">
              <polygon points="10,16 50,24 90,16 50,8" fill="#E0F2FE" />
              <polygon points="10,16 10,21 50,29 50,24" fill="#BAE6FD" />
              <polygon points="50,24 50,29 90,21 90,16" fill="#38BDF8" />
              <polygon points="12,16 50,22 88,16 50,10" fill="#FFFFFF" />
              {/* Gold Ribbon Bookmark */}
              <polygon points="46,14 54,26 48,24 42,26" fill="#F59E0B" />
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className="relative z-10 flex items-center justify-between pt-2">
        <div className="flex items-center gap-6 flex-wrap">
          {isNoCourse ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 h-[48px] rounded-full bg-[#16A34A] hover:bg-[#15803D] px-6 text-[15px] font-bold text-white shadow-sm transition-all active:scale-98"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>Contact on WhatsApp</span>
            </a>
          ) : (
            <Link
              href={watchUrl}
              className="inline-flex items-center gap-2.5 h-[48px] rounded-full bg-[#FFC93C] hover:bg-[#F7BF2E] px-6 text-[15px] font-bold text-[#1F2A44] shadow-[0_4px_14px_rgba(255,201,60,0.35)] transition-all active:scale-98"
            >
              <Play className="h-4 w-4 fill-[#1F2A44]" />
              <span>{buttonText}</span>
            </Link>
          )}

          {!isNoCourse && (
            <Link
              href={allLecturesUrl}
              className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#1F2A44] hover:text-[#0B2A4A] transition-colors"
            >
              <span>
                {allLecturesCount > 0
                  ? `All ${allLecturesCount} Lectures`
                  : "All Lectures"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
