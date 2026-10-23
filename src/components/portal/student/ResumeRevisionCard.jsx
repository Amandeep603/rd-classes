"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Bookmark, ArrowRight, Video } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";
import { BookStackIllustration } from "../illustrations/PortalIllustrations";
import { toggleBookmarkAction } from "@/server/actions/student.progress.actions.js";

export default function ResumeRevisionCard({ resume }) {
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

  if (!resume) {
    return (
      <div className="flex h-[327px] flex-col items-center justify-center rounded-[22px] border border-black/5 bg-white p-8 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 shadow-2xs">
          <Video className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-[#111827]">Start Your First Lecture</h3>
        <p className="mt-1 max-w-sm text-sm text-[#6B7280]">
          Pick any enrolled course and begin your accountancy learning journey today.
        </p>
        <Link
          href="/student/courses"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-5 py-2.5 text-sm font-bold text-neutral-900 shadow-md hover:shadow-lg transition-all"
        >
          <span>Explore Enrolled Courses</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const durationMin = Math.round((resume.durationSec || 0) / 60);
  const positionMin = Math.round((resume.positionSec || 0) / 60);

  return (
    <div className="relative flex h-[327px] flex-col justify-between rounded-[22px] border border-black/5 bg-white p-7 sm:p-8 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#B45309]">
            RESUME YOUR REVISION
          </span>
          <h2 className="mt-1 text-xl sm:text-[24px] font-extrabold tracking-tight text-[#111827] leading-snug line-clamp-2 max-w-xl">
            {resume.lectureTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-[14px] text-[#6B7280]">
            {resume.section || resume.courseTitle}
          </p>
        </div>

        {/* Bookmark toggle button */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          disabled={bookmarking}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lecture"}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 bg-neutral-50 text-[#4B5563] hover:text-[#111827] hover:bg-neutral-100 transition-colors shrink-0 shadow-2xs"
        >
          <Bookmark
            className={`h-4 w-4 ${
              isBookmarked
                ? "fill-[#FFC21A] text-[#FFC21A]"
                : "text-[#6B7280]"
            }`}
          />
        </button>
      </div>

      {/* Middle Progress Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
          <span className="text-[#111827]">
            {positionMin} of {durationMin} mins
          </span>
          <span className="text-amber-600 font-extrabold">
            {resume.percent}% Completed
          </span>
        </div>

        <ProgressBar
          value={resume.percent}
          max={100}
          tone="yellow"
          height={8}
          showGlow
        />
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/student/courses/${resume.courseSlug}/lectures/${resume.lectureId}`}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-[#FFC21A] px-6 py-3 font-bold text-neutral-900 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] hover:shadow-[0_6px_20px_rgba(255,194,26,0.45)] transition-all text-sm active:scale-98"
        >
          <Play className="h-4 w-4 fill-neutral-900" />
          <span>Resume Lecture</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={`/student/courses/${resume.courseSlug}`}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4B5563] hover:text-[#111827] transition-colors"
          >
            <span>All {resume.totalCourseLectures || "Course"} Lectures</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="hidden md:block">
            <BookStackIllustration className="h-16 w-24 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
