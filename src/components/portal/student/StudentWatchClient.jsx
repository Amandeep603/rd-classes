"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  MessageCircle,
  Play,
  Clock,
  ToggleLeft,
  ToggleRight,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import VimeoPlayer from "@/components/student/VimeoPlayer";
import { markLectureCompleteAction } from "@/server/actions/student.progress.actions.js";

export default function StudentWatchClient({
  lecture,
  playerUrl,
  vimeoId,
  vimeoHash,
  savedPositionSec = 0,
  initialCompleted = false,
  studentName,
  loginId,
  prevLecture,
  nextLecture,
  chapterLectures = [],
  notes = [],
  isLocked = false,
  notEnrolled = false,
  whatsappNumber = "918368545620",
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isMarking, setIsMarking] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("student_autoplay_next");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleAutoplay = () => {
    const nextVal = !autoplayNext;
    setAutoplayNext(nextVal);
    try {
      localStorage.setItem("student_autoplay_next", String(nextVal));
    } catch {}
  };

  const handleMarkComplete = async () => {
    if (isMarking || isLocked) return;
    setIsMarking(true);
    try {
      await markLectureCompleteAction(lecture._id);
      setCompleted(true);
    } catch {
      // rollback
    } finally {
      setIsMarking(false);
    }
  };

  const handleVideoComplete = () => {
    setCompleted(true);
    if (autoplayNext && nextLecture?._id) {
      setTimeout(() => {
        router.push(`/student/watch/${nextLecture._id}`);
      }, 1500);
    }
  };

  const chapterLabel =
    lecture.chapterTitle || lecture.chapter || lecture.section || "Chapter Revision";
  const courseTitle = lecture.courseTitle || "Class 12 Accountancy";

  const cleanPhone = (whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone || "918368545620"}?text=${encodeURIComponent(
    `Hello Sir, I want to unlock ${courseTitle}.`
  )}`;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/student/lectures`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Lectures</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1 text-xs font-bold text-[#B7791F]">
            {courseTitle}
          </span>
          <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#475467]">
            {chapterLabel}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Column (Player / Lock Screen) + Right Column (Playlist Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Video Player or Locked Screen */}
          {isLocked ? (
            <div className="relative aspect-video w-full rounded-[22px] bg-gradient-to-br from-[#0B2A4A] to-[#041324] border border-[#1E3A5F] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-[#FFC93C]/15 border border-[#FFC93C]/30 text-[#FFC93C] flex items-center justify-center mb-4 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {notEnrolled ? "This lecture is not part of your enrolled courses" : "This lecture is locked"}
              </h2>
              <p className="mt-2 text-sm text-[#94A3B8] max-w-md">
                {notEnrolled
                  ? `You are not enrolled in ${courseTitle}. Contact RD Classes on WhatsApp to add this course.`
                  : `This lecture is part of ${courseTitle}. Contact RD Classes on WhatsApp to enroll and unlock.`}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 h-[42px] rounded-full bg-[#16A34A] hover:bg-[#15803D] px-5 text-xs font-bold text-white shadow-xs transition-all active:scale-98"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Contact RD Classes</span>
              </a>
            </div>
          ) : !vimeoId ? (
            <div className="relative aspect-video w-full rounded-[22px] bg-gradient-to-br from-[#0B2A4A] to-[#041324] border border-[#1E3A5F] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Coming soon</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">
                This lecture video will appear here as soon as RD Classes uploads it.
              </p>
            </div>
          ) : (
            <VimeoPlayer
              playerUrl={playerUrl}
              vimeoId={vimeoId}
              vimeoHash={vimeoHash}
              lectureId={lecture._id}
              savedPositionSec={savedPositionSec}
              durationSeconds={lecture.durationSeconds || lecture.durationSec || 0}
              studentName={studentName}
              loginId={loginId}
              onComplete={handleVideoComplete}
              autoPlay={false}
            />
          )}

          {/* Action Row & Autoplay Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-white p-5 border border-[#E8ECF2] shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#B7791F] uppercase tracking-wider">
                  Part {lecture.lectureNo || lecture.partNumber || 1}
                </span>
                {lecture.isFree && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    FREE PREVIEW
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#1F2A44] leading-snug">
                {lecture.title}
              </h1>
              <p className="mt-0.5 text-xs text-[#5B6577]">
                {courseTitle} • {chapterLabel}
              </p>
            </div>

            {!isLocked && (
              <div className="flex items-center gap-3 shrink-0">
                {/* Autoplay-Next Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  aria-pressed={autoplayNext}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
                    autoplayNext
                      ? "bg-amber-50 text-amber-900 border-amber-200"
                      : "bg-neutral-50 text-[#6B7280] border-gray-200 hover:text-[#111827]"
                  }`}
                >
                  {autoplayNext ? (
                    <ToggleRight className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-[#9CA3AF]" />
                  )}
                  <span>Autoplay Next</span>
                </button>

                {/* Mark as Completed */}
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={isMarking}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-98 ${
                    completed
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-[#FFC93C] text-[#1F2A44] hover:bg-[#FDB813]"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{completed ? "Completed" : "Mark Complete"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Previous / Next Lecture Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            {prevLecture ? (
              <Link
                href={`/student/watch/${prevLecture._id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#374151] border border-[#CBD5E1] hover:bg-neutral-50 shadow-xs transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="truncate max-w-[140px] sm:max-w-xs">
                  {prevLecture.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextLecture ? (
              <Link
                href={`/student/watch/${nextLecture._id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC93C] hover:bg-[#FDB813] px-4 py-2.5 text-xs font-bold text-[#1F2A44] shadow-xs transition-all"
              >
                <span className="truncate max-w-[140px] sm:max-w-xs">
                  {nextLecture.title}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Related Handouts / Notes */}
          {notes && notes.length > 0 && (
            <div className="rounded-[22px] border border-[#E8ECF2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1F2A44] uppercase tracking-wider">
                    Chapter Notes &amp; Revision Handouts
                  </h3>
                  <p className="text-xs text-[#5B6577] mt-0.5">
                    Formula sheets and class problem sets for this chapter.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {notes.length} Handout{notes.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="divide-y divide-[#F1F5F9] pt-1">
                {notes.map((note) => (
                  <div key={note._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1F2A44] truncate">{note.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                          <span>{note.book || note.section || "Chapter Handout"}</span>
                          {note.size && <span>• {note.size}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={note.viewUrl || `/api/notes/${note._id}/stream`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-3 py-1.5 font-bold text-[#334155] hover:bg-gray-50 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                      <a
                        href={note.downloadUrl || `/api/notes/${note._id}/stream?download=1`}
                        download
                        aria-label={`Download ${note.title}`}
                        className="rounded-xl border border-[#CBD5E1] bg-white p-1.5 text-[#334155] hover:text-[#0F172A] shadow-xs inline-flex items-center"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Side playlist of other lectures in this chapter (stacked on mobile) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[22px] border border-[#E8ECF2] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-extrabold text-[#1F2A44]">Chapter Playlist</h3>
                <p className="text-xs text-gray-500">{chapterLabel}</p>
              </div>
              <span className="text-xs font-bold text-[#0B2A4A] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                {chapterLectures.length} Videos
              </span>
            </div>

            {/* Playlist rows */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {chapterLectures.map((item, idx) => {
                const isCurrent = String(item._id) === String(lecture._id);
                const isItemFree = Boolean(item.isFree || item.freePreview);
                const isItemLocked = !isItemFree && isLocked;

                return (
                  <Link
                    key={String(item._id)}
                    href={`/student/watch/${item._id}`}
                    className={`p-3 rounded-xl flex items-start gap-3 transition-all ${
                      isCurrent
                        ? "bg-[#FFF8E6] border border-[#FDE68A] shadow-xs"
                        : "hover:bg-[#F8FAFC] border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent
                          ? "bg-[#FFC93C] text-[#1F2A44]"
                          : isItemLocked
                          ? "bg-slate-100 text-slate-500"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isCurrent ? (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      ) : isItemLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[11px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isCurrent ? "text-[#B7791F]" : "text-[#1F2A44]"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span className="font-mono">
                          {item.durationSeconds ? `${Math.round(item.durationSeconds / 60)}m` : "—"}
                        </span>
                        {isItemFree && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
