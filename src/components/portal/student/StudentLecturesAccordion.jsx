"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  BookOpen,
  Search,
  MessageCircle,
} from "lucide-react";

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm > 0 ? `${rm}m` : ""}`.trim();
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function StudentLecturesAccordion({
  course,
  books = [],
  chapters = [],
  lectures = [],
  progressList = [],
  isEnrolled = true,
  whatsappNumber = "918368545620",
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Map progress by lectureId
  const progressMap = useMemo(() => {
    const map = new Map();
    for (const p of progressList) {
      if (p.lectureId) {
        const idStr = p.lectureId._id ? String(p.lectureId._id) : String(p.lectureId);
        map.set(idStr, p);
      }
    }
    return map;
  }, [progressList]);

  // Expanded chapters state with localStorage persistence
  const [expandedChapterIds, setExpandedChapterIds] = useState(() => {
    if (typeof window === "undefined") {
      return new Set(chapters.slice(0, 2).map((c) => String(c._id)));
    }
    try {
      const saved = localStorage.getItem(`rd_expanded_chapters_${course?._id}`);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
    // Default expand first chapter
    return new Set(chapters.slice(0, 1).map((c) => String(c._id)));
  });

  const toggleChapter = (cId) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(cId)) next.delete(cId);
      else next.add(cId);
      try {
        localStorage.setItem(
          `rd_expanded_chapters_${course?._id}`,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
  };

  // Filter lectures if search is active
  const filteredLectures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lectures;
    return lectures.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.chapterTitle?.toLowerCase().includes(q) ||
        l.bookTitle?.toLowerCase().includes(q)
    );
  }, [lectures, searchQuery]);

  // Group lectures by book -> chapter
  const structure = useMemo(() => {
    const bookMap = new Map();

    // Default book if none
    const effectiveBooks = books.length > 0 ? books : [{ _id: "b1", title: "Book 1", position: 0 }];
    effectiveBooks.forEach((b) => {
      bookMap.set(String(b._id), {
        book: b,
        chapters: new Map(),
      });
    });

    const effectiveChapters =
      chapters.length > 0
        ? chapters
        : [{ _id: "c1", title: "Chapter 1", bookId: effectiveBooks[0]._id, position: 0 }];

    effectiveChapters.forEach((c) => {
      const bId = c.bookId?._id ? String(c.bookId._id) : String(c.bookId || effectiveBooks[0]._id);
      if (!bookMap.has(bId)) {
        bookMap.set(bId, {
          book: { _id: bId, title: "Book", position: 0 },
          chapters: new Map(),
        });
      }
      bookMap.get(bId).chapters.set(String(c._id), {
        chapter: c,
        lectures: [],
      });
    });

    // Populate lectures
    filteredLectures.forEach((l) => {
      let bId = l.bookId?._id ? String(l.bookId._id) : l.bookId ? String(l.bookId) : String(effectiveBooks[0]._id);
      let cId = l.chapterId?._id ? String(l.chapterId._id) : l.chapterId ? String(l.chapterId) : String(effectiveChapters[0]._id);

      if (!bookMap.has(bId)) {
        bId = String(effectiveBooks[0]._id);
      }
      const bEntry = bookMap.get(bId);
      if (!bEntry.chapters.has(cId)) {
        cId = String(effectiveChapters[0]._id);
      }
      const cEntry = bEntry.chapters.get(cId);
      if (cEntry) {
        cEntry.lectures.push(l);
      }
    });

    return Array.from(bookMap.values()).map((bEntry) => ({
      ...bEntry,
      chapters: Array.from(bEntry.chapters.values()).map((cEntry) => ({
        ...cEntry,
        lectures: cEntry.lectures.sort(
          (a, b) => (a.position ?? a.order ?? 0) - (b.position ?? b.order ?? 0)
        ),
      })),
    }));
  }, [books, chapters, filteredLectures]);

  const cleanPhone = (whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone || "918368545620"}?text=${encodeURIComponent(
    `Hello Sir, I want to enroll and unlock lectures for ${course?.title || "Class 12 Accountancy"}.`
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B7791F] text-xs font-bold uppercase tracking-wider">
                {course?.classLabel || "Class 12"} Syllabus
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {lectures.length} Live Recorded Lectures
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2A44] tracking-tight">
              {course?.title || "Course Lectures"}
            </h1>
            <p className="mt-1 text-sm text-[#5B6577]">
              Watch concept classes, numerical solutions, and board exam revision in structured order.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] text-xs font-medium focus:outline-none focus:border-[#0066FF] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Lectures Accordion List */}
      {lectures.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#1F2A44]">No lectures uploaded yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            New lectures will appear here as soon as RD Classes uploads them.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {structure.map(({ book, chapters: chaps }) => {
            return (
              <div key={String(book._id)} className="space-y-4">
                {/* Book Header */}
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 rounded-full bg-[#FFC93C]" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2A44]">
                    {book.title}
                  </h2>
                </div>

                {/* Chapters in this Book */}
                <div className="space-y-3">
                  {chaps.map(({ chapter, lectures: chapterLecs }) => {
                    const cIdStr = String(chapter._id);
                    const isExpanded = expandedChapterIds.has(cIdStr);

                    // Calculate chapter completion
                    let completedInChap = 0;
                    chapterLecs.forEach((l) => {
                      const prog = progressMap.get(String(l._id));
                      if (prog?.completed) completedInChap++;
                    });
                    const chapPercent =
                      chapterLecs.length > 0
                        ? Math.round((completedInChap / chapterLecs.length) * 100)
                        : 0;

                    return (
                      <div
                        key={cIdStr}
                        className="rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-xs transition-all"
                      >
                        {/* Chapter Header Accordion Toggle */}
                        <div
                          onClick={() => toggleChapter(cIdStr)}
                          className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFCFF] transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-[#0B2A4A]" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-bold text-[#1F2A44] truncate">
                                {chapter.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {chapterLecs.length} lecture{chapterLecs.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          {/* Completion Progress Tag */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-[#1F2A44]">
                              {completedInChap} of {chapterLecs.length} completed
                            </span>
                            {/* Tiny circular or bar badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                chapPercent === 100
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {chapPercent}%
                            </span>
                          </div>
                        </div>

                        {/* Chapter Lectures List */}
                        {isExpanded && (
                          <div className="border-t border-[#F1F5F9] divide-y divide-[#F1F5F9] bg-[#FAFCFF]">
                            {chapterLecs.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-400">
                                No video lectures in this chapter yet.
                              </div>
                            ) : (
                              chapterLecs.map((lec, idx) => {
                                const prog = progressMap.get(String(lec._id));
                                const isCompleted = Boolean(prog?.completed);
                                const watchedSec = prog?.watchedSeconds || prog?.positionSec || 0;
                                const totalSec = lec.durationSeconds || lec.durationSec || 0;
                                const pct =
                                  totalSec > 0
                                    ? Math.min(100, Math.round((watchedSec / totalSec) * 100))
                                    : isCompleted
                                    ? 100
                                    : 0;

                                const isFree = Boolean(
                                  lec.isFree || lec.isFreePreview || lec.freePreview
                                );
                                const isPlayable = isEnrolled || isFree;

                                return (
                                  <div
                                    key={String(lec._id)}
                                    onClick={() => {
                                      router.push(`/student/watch/${lec._id}`);
                                    }}
                                    className={`p-4 sm:p-5 flex flex-col gap-2 transition-all cursor-pointer ${
                                      isPlayable
                                        ? "hover:bg-white hover:shadow-xs active:bg-gray-50"
                                        : "hover:bg-gray-50 opacity-90"
                                    }`}
                                  >
                                    {/* Mobile Friendly Row 1: Title & Access Pill */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3 min-w-0 flex-1">
                                        {/* Play / Lock Icon Pill */}
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                            isCompleted
                                              ? "bg-emerald-100 text-emerald-700"
                                              : isPlayable
                                              ? "bg-[#FFF4D6] text-[#B7791F]"
                                              : "bg-slate-100 text-slate-500"
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          ) : isPlayable ? (
                                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                          ) : (
                                            <Lock className="w-3.5 h-3.5" />
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <h4 className="text-[14px] sm:text-[15px] font-bold text-[#1F2A44] leading-snug">
                                            {lec.title}
                                          </h4>
                                        </div>
                                      </div>

                                      {/* Status Badges on the right */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        {isFree && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            FREE
                                          </span>
                                        )}
                                        {!isPlayable && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0B2A4A] text-white">
                                            <Lock className="w-2.5 h-2.5" />
                                            <span>LOCKED</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Mobile Friendly Row 2: Part No, Duration & Progress Bar UNDERNEATH */}
                                    <div className="pl-11 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                        <span className="font-semibold text-gray-700">
                                          Part {lec.lectureNo || idx + 1}
                                        </span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 font-mono">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          {formatDuration(totalSec)}
                                        </span>
                                        {isCompleted && (
                                          <>
                                            <span>•</span>
                                            <span className="text-emerald-700 font-bold">
                                              Completed
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {/* Progress Bar (if watched > 0) */}
                                      {watchedSec > 0 && !isCompleted && (
                                        <div className="flex items-center gap-2 w-28 sm:w-36 shrink-0">
                                          <div className="h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                                            <div
                                              className="h-full rounded-full bg-[#FFC93C]"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-bold text-gray-600 font-mono">
                                            {pct}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

