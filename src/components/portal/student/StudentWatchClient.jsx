"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Eye,
  Download,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import VimeoPlayer from "@/components/student/VimeoPlayer";
import { markLectureCompleteAction } from "@/server/actions/student.progress.actions.js";

export default function StudentWatchClient({
  lecture,
  playerUrl,
  savedPositionSec = 0,
  initialCompleted = false,
  studentName,
  loginId,
  prevLecture,
  nextLecture,
  notes = [],
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
    localStorage.setItem("student_autoplay_next", String(nextVal));
  };

  const handleMarkComplete = async () => {
    if (isMarking) return;
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
    lecture.chapter || lecture.section || "Chapter Revision";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/student/lectures/${lecture.courseSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {lecture.courseTitle || "Course Syllabus"}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
            {chapterLabel}
          </span>
        </div>
      </div>

      {/* Main Grid: Player Column & Sidebar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player + Controls + Actions */}
        <div className="lg:col-span-8 space-y-5">
          {/* 16:9 Smooth Video Player Card with Fullscreen Support */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-black shadow-2xl border border-black/10">
            {playerUrl ? (
              <VimeoPlayer
                playerUrl={playerUrl}
                lectureId={lecture._id}
                savedPositionSec={savedPositionSec}
                studentName={studentName}
                loginId={loginId}
                onComplete={handleVideoComplete}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/50 text-sm">
                Video player unavailable
              </div>
            )}
          </div>

          {/* Action Row & Autoplay Toggle & Mark Complete */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-black/5 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                {lecture.title}
              </h1>
              <p className="mt-1 text-xs text-[#6B7280]">
                {lecture.courseTitle} • {chapterLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Autoplay-Next Toggle */}
              <button
                type="button"
                onClick={handleToggleAutoplay}
                aria-pressed={autoplayNext}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
                  autoplayNext
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-neutral-50 text-[#6B7280] border-black/8 hover:text-[#111827]"
                }`}
              >
                {autoplayNext ? (
                  <ToggleRight className="h-4 w-4 text-amber-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-[#9CA3AF]" />
                )}
                <span>Autoplay Next</span>
              </button>

              {/* Mark as Completed Button */}
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={isMarking}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs active:scale-98 ${
                  completed
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-[#FDB813] text-[#111827] hover:bg-[#ffc633]"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{completed ? "Completed" : "Mark as Completed"}</span>
              </button>
            </div>
          </div>

          {/* Previous / Next Lecture Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            {prevLecture ? (
              <Link
                href={`/student/watch/${prevLecture._id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#374151] border border-black/8 hover:bg-neutral-50 shadow-2xs transition-all"
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
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FDB813] px-4 py-2.5 text-xs font-bold text-[#111827] shadow-2xs hover:bg-[#ffc633] transition-all"
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

          {/* Lecture Description */}
          {lecture.description && (
            <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] mb-2">
                About this Lecture
              </h3>
              <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
                {lecture.description}
              </p>
            </div>
          )}

          {/* Related Notes Below */}
          {notes && notes.length > 0 && (
            <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider">
                    Related Chapter Notes &amp; Resources
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Handouts, formulas and board problem sheets for this chapter.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {notes.length} Handout{notes.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="divide-y divide-black/5 pt-1">
                {notes.map((note) => (
                  <div
                    key={note._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#111827] truncate">
                          {note.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-white px-3 py-1.5 font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                      <a
                        href={note.downloadUrl || `/api/notes/${note._id}/stream?download=1`}
                        download
                        aria-label={`Download ${note.title}`}
                        className="rounded-xl border border-black/8 bg-white p-1.5 text-[#4B5563] hover:text-[#111827] shadow-2xs inline-flex items-center"
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

        {/* Right Column: Helpful Tips & Batch Info */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-extrabold text-[#111827] uppercase tracking-wide">
                Revision Tips
              </h3>
            </div>
            <ul className="text-xs text-[#4B5563] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Playback position auto-saves every 15 seconds. You can resume anytime.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Keep your formula sheets open while following Sir&apos;s numerical problems.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Mark lectures as completed to update your board preparation score ring.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
