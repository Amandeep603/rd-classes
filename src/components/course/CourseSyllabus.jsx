"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  Clock,
  Sparkles,
  Video,
} from "lucide-react";
import VimeoPlayer from "@/components/student/VimeoPlayer";

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTotalTime(sec) {
  if (!sec || isNaN(sec)) return "0h 0m";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function CourseSyllabus({
  course,
  lectures = [],
  isEnrolled = false,
  completedLectureIds = [],
  lectureProgressMap = {},
  whatsappNumber = "918368545620",
  watchBaseUrl = "/student/watch",
  showCourseHeader = true,
  className = "",
}) {
  // Default Chapter 1 open
  const [openChapters, setOpenChapters] = useState({ 1: true });
  // Locked popup state
  const [lockedLecture, setLockedLecture] = useState(null);
  // Free preview video modal for public visitors
  const [freePreviewLecture, setFreePreviewLecture] = useState(null);

  const cleanPhone = (whatsappNumber || "918368545620").replace(/\D/g, "");

  // Organize lectures by Book and Chapter
  const { booksMap, totalLecturesCount, totalDurationSec, totalChaptersCount } = useMemo(() => {
    const books = {};
    let totalDur = 0;
    let chCount = 0;

    for (const lec of lectures) {
      const bNo = lec.bookNo || 1;
      const bTitle = lec.bookTitle || lec.book || "Accounting for Partnership Firms";
      const chNo = lec.chapterNo || 1;
      const chTitle = lec.chapterTitle || lec.chapter || `Chapter ${chNo}`;

      if (!books[bNo]) {
        books[bNo] = {
          bookNo: bNo,
          title: bTitle,
          chapters: {},
        };
      }

      if (!books[bNo].chapters[chNo]) {
        books[bNo].chapters[chNo] = {
          chapterNo: chNo,
          title: chTitle,
          lectures: [],
          totalDuration: 0,
        };
        chCount++;
      }

      const dur = lec.durationSeconds || lec.durationSec || 0;
      totalDur += dur;
      books[bNo].chapters[chNo].totalDuration += dur;
      books[bNo].chapters[chNo].lectures.push(lec);
    }

    // Sort chapters and lectures
    Object.values(books).forEach((b) => {
      Object.values(b.chapters).forEach((ch) => {
        ch.lectures.sort((a, b) => (a.lectureNo || a.order || 0) - (b.lectureNo || b.order || 0));
      });
    });

    return {
      booksMap: books,
      totalLecturesCount: lectures.length,
      totalDurationSec: totalDur,
      totalChaptersCount: chCount,
    };
  }, [lectures]);

  const toggleChapter = (chNo) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chNo]: !prev[chNo],
    }));
  };

  const handleRowClick = (lec) => {
    const hasVideo = Boolean(lec.hasVideo !== false && (lec.hasVideo || (lec.vimeoId && lec.vimeoId.trim() !== "")));
    const canAccess = isEnrolled || lec.isFree;

    if (!canAccess) {
      setLockedLecture(lec);
      return;
    }

    if (!hasVideo) {
      // Coming soon - no action
      return;
    }

    if (isEnrolled) {
      const url = `${watchBaseUrl || "/student/watch"}/${lec._id}`;
      window.location.href = url;
      return;
    }

    // If free preview on public page, open embedded modal
    if (!isEnrolled && lec.isFree) {
      setFreePreviewLecture(lec);
    }
  };

  const booksList = Object.values(booksMap);

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* 1. Header (Course Name + Stats line) */}
      {showCourseHeader && (
        <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#B7791F] block mb-1">
                COURSE SYLLABUS & CURRICULUM
              </span>
              <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[#0B2A4A] tracking-tight">
                {course?.title || "Class 12 Accountancy"}
              </h2>
              <p className="mt-1 text-[14px] sm:text-[15px] font-semibold text-[#5B6577]">
                {booksList.length} Book · {totalChaptersCount} Chapters · {totalLecturesCount} Lectures ·{" "}
                {formatTotalTime(totalDurationSec)} total
              </p>
            </div>

            {!isEnrolled && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello Sir, I want to enrol in ${course?.title || "Class 12 Accountancy"}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-[14px] shadow-sm transition-all hover:scale-[1.02] shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Contact on WhatsApp to enrol</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. Books & Collapsible Chapters */}
      {booksList.length === 0 && (
        <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-8 sm:p-10 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#0B2A4A]">No lectures uploaded yet</h3>
          <p className="text-[14px] font-medium text-[#5B6577] max-w-md mx-auto">
            New lectures will appear here as soon as RD Classes uploads them.
          </p>
        </div>
      )}

      {booksList.map((book) => {
        const chaptersList = Object.values(book.chapters).sort(
          (a, b) => a.chapterNo - b.chapterNo
        );

        return (
          <div key={book.bookNo} className="space-y-4">
            {/* Book Title Banner */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2A4A] text-white font-black text-xs shadow-xs">
                {book.bookNo}
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-extrabold text-[#0B2A4A] tracking-tight">
                Book {book.bookNo}: {book.title}
              </h3>
            </div>

            {/* Chapters Accordions */}
            <div className="space-y-3.5">
              {chaptersList.map((ch) => {
                const isOpen = !!openChapters[ch.chapterNo];
                const chapterTotalDur = formatTotalTime(ch.totalDuration);
                const liveVideosCount = ch.lectures.filter((l) => l.vimeoId).length;

                return (
                  <div
                    key={ch.chapterNo}
                    className="rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-xs transition-all"
                  >
                    {/* Chapter Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleChapter(ch.chapterNo)}
                      className="w-full px-5 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer gap-4"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Number badge */}
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-[#FFF8EE] text-[#E8870E] border border-[rgba(232,135,14,0.25)] flex items-center justify-center font-black text-[16px] sm:text-[17px] shrink-0">
                          {ch.chapterNo}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-[16px] sm:text-[17px] font-bold text-[#0B2A4A] tracking-tight truncate">
                            Chapter {ch.chapterNo} · {ch.title}
                          </h4>
                          <p className="text-[13px] sm:text-[14px] text-[#6B7385] font-medium mt-0.5">
                            {ch.lectures.length} lectures · {chapterTotalDur}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[#475569] shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#64748B]" strokeWidth={2} />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#64748B]" strokeWidth={2} />
                        )}
                      </div>
                    </button>

                    {/* Chapter Lectures Rows */}
                    {isOpen && (
                      <div className="border-t border-[#F1F5F9] bg-[#FAFBFD] p-3 sm:p-4 space-y-2">
                        {ch.lectures.map((lec, idx) => {
                          const hasVideo = Boolean(lec.hasVideo !== false && (lec.hasVideo || (lec.vimeoId && lec.vimeoId.trim() !== "")));
                          const canAccess = isEnrolled || lec.isFree;
                          const isCompleted = completedLectureIds.includes(lec._id?.toString());
                          const progress = lectureProgressMap[lec._id?.toString()];
                          const durationStr = lec.duration_mmss || formatDuration(lec.durationSeconds || lec.durationSec);

                          return (
                            <div
                              key={lec._id?.toString() || idx}
                              onClick={() => handleRowClick(lec)}
                              className={`group relative rounded-[14px] p-3 sm:px-4 sm:py-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${!canAccess
                                  ? "bg-white hover:bg-[#FFFDF9] border-[#EDF2F7] cursor-pointer"
                                  : hasVideo
                                    ? "bg-white hover:border-[#FFC93C] border-[#E8ECF2] shadow-2xs"
                                    : "bg-white/80 border-[#E8ECF2] opacity-85"
                                }`}
                            >
                              {/* Left: Number + Title */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569] font-bold text-[12px] shrink-0 group-hover:bg-[#FFF8EE] group-hover:text-[#B7791F] transition-colors">
                                  {lec.lectureNo || idx + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-[14px] sm:text-[15px] font-semibold leading-snug truncate ${canAccess ? "text-[#0B2A4A]" : "text-[#475569]"
                                        }`}
                                    >
                                      {lec.title}
                                    </span>
                                  </div>

                                  {/* Duration & Progress on mobile */}
                                  <div className="flex items-center gap-2 text-[12px] text-[#6B7385] mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-[#94A3B8]" />
                                      {durationStr}
                                    </span>
                                    {isCompleted && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completed
                                      </span>
                                    )}
                                    {!isCompleted && progress?.percent > 0 && (
                                      <span className="text-[11px] font-semibold text-[#B7791F]">
                                        {progress.percent}% watched
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right Status Badge */}
                              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                {/* STATE 1: FREE + Has Video */}
                                {lec.isFree && hasVideo && (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
                                      <Sparkles className="w-3 h-3" />
                                      FREE
                                    </span>
                                    {isEnrolled ? (
                                      <Link
                                        href={`${watchBaseUrl}/${lec._id}`}
                                        className="h-8 px-3.5 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-[12px] flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                                      >
                                        <Play className="w-3 h-3 fill-[#0B2A4A]" />
                                        <span>Watch</span>
                                      </Link>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFreePreviewLecture(lec);
                                        }}
                                        className="h-8 px-3.5 rounded-full bg-[#0B2A4A] hover:bg-[#152B52] text-white font-bold text-[12px] flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                      >
                                        <Play className="w-3 h-3 fill-white" />
                                        <span>Watch Free</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* STATE 2: Free without video yet */}
                                {lec.isFree && !hasVideo && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                                    FREE · Coming soon
                                  </span>
                                )}

                                {/* STATE 3: Enrolled student + Video exists */}
                                {!lec.isFree && isEnrolled && hasVideo && (
                                  <Link
                                    href={`${watchBaseUrl}/${lec._id}`}
                                    className="h-8 px-3.5 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-[12px] flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95"
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-[#0B2A4A]" />
                                    )}
                                    <span>{isCompleted ? "Rewatch" : progress?.percent > 0 ? "Resume" : "Play"}</span>
                                  </Link>
                                )}

                                {/* STATE 4: Enrolled student + No Video yet */}
                                {!lec.isFree && isEnrolled && !hasVideo && (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 text-[11px] font-medium">
                                    Coming soon
                                  </span>
                                )}

                                {/* STATE 5: Locked for non-enrolled visitor */}
                                {!lec.isFree && !isEnrolled && (
                                  <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-[#B7791F] transition-colors cursor-pointer">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                    <span className="text-[12px] font-semibold text-gray-400 hidden sm:inline">
                                      Locked
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 3. POPUP MODAL FOR LOCKED LECTURE */}
      {lockedLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setLockedLecture(null)}
        >
          <div
            className="w-full max-w-md rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setLockedLecture(null)}
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7791F]">
                LOCKED LECTURE
              </span>
              <h3 className="mt-1 text-[18px] sm:text-[19px] font-bold text-[#0B2A4A] leading-snug">
                {lockedLecture.title}
              </h3>
              <p className="mt-2 text-[14px] text-[#475569] leading-relaxed">
                This lecture is for enrolled students. Contact RD Classes to enrol.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello Sir, I want to enrol in Class 12 Accountancy to access the locked lecture: "${lockedLecture.title}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Contact on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setLockedLecture(null)}
                className="w-full h-10 rounded-full border border-gray-200 text-[#475569] font-semibold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL FOR FREE PREVIEW VIDEO */}
      {freePreviewLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFreePreviewLecture(null)}
        >
          <div
            className="w-full max-w-3xl rounded-[24px] bg-[#0B2A4A] overflow-hidden shadow-2xl border border-white/10 space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 text-white">
              <div className="min-w-0 pr-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC93C] block">
                  FREE PREVIEW
                </span>
                <h3 className="text-[16px] font-bold text-white truncate">
                  {freePreviewLecture.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFreePreviewLecture(null)}
                className="rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black relative">
              <VimeoPlayer
                lectureId={freePreviewLecture._id?.toString()}
                isFreePreview={true}
                durationSeconds={freePreviewLecture.durationSeconds}
                enableProgress={false}
                autoPlay={true}
              />
            </div>

            <div className="p-4 bg-[#081F38] flex items-center justify-between gap-4">
              <span className="text-[13px] text-white/80">
                Enjoyed this preview? Enrol today to unlock all 67 video lectures!
              </span>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello Sir, I watched the free lecture "${freePreviewLecture.title}" and want to enrol in Class 12 Accountancy.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-[12px] flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Enrol via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
