import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import {
  getAuthorizedLecture,
  getCourseSyllabusForStudent,
} from "@/server/services/lectureService.js";
import VimeoPlayer from "@/components/student/VimeoPlayer";
import { markLectureCompleteAction } from "@/server/actions/student.progress.actions.js";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export const instant = false;

export async function generateMetadata({ params }) {
  return {
    title: "Lecture Video | RD Classes Student Portal",
  };
}

export default async function StudentLecturePlayerPage({ params }) {
  const auth = await getCurrentUser();
  const { slug, lectureId } = await params;

  const data = await getAuthorizedLecture({
    lectureId,
    studentId: auth.user._id,
  });

  if (!data) {
    notFound();
  }

  const {
    lecture,
    playerUrl,
    savedPositionSec,
    completed,
    prevLecture,
    nextLecture,
  } = data;

  const syllabus = await getCourseSyllabusForStudent(
    lecture.courseId,
    auth.user._id
  );

  return (
    <div className="space-y-6">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/student/courses/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {lecture.courseTitle || "Course Syllabus"}</span>
        </Link>

        <span className="rounded-full bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-800">
          {lecture.section}
        </span>
      </div>

      {/* Main Grid: Player on Left, Playlist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player + Title + Controls */}
        <div className="lg:col-span-8 space-y-5">
          {/* 16:9 Video Player Card */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-black shadow-2xl border border-black/10">
            {playerUrl ? (
              <VimeoPlayer
                playerUrl={playerUrl}
                lectureId={lecture._id}
                savedPositionSec={savedPositionSec}
                studentName={auth.user.name}
                loginId={auth.user.studentCode || auth.user.loginId}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/50 text-sm">
                Video player unavailable
              </div>
            )}
          </div>

          {/* Action Row & Mark Complete */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-black/5 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                {lecture.title}
              </h1>
              <p className="mt-1 text-xs text-[#6B7280]">
                {lecture.courseTitle} • {lecture.section}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <form action={markLectureCompleteAction.bind(null, lecture._id)}>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    completed
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-[#FFC21A] text-neutral-900 shadow-sm hover:bg-[#ffd54a]"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{completed ? "Completed" : "Mark as Complete"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Prev / Next Controls */}
          <div className="flex items-center justify-between gap-4">
            {prevLecture ? (
              <Link
                href={`/student/courses/${slug}/lectures/${prevLecture._id}`}
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
                href={`/student/courses/${slug}/lectures/${nextLecture._id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-all"
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
              <h3 className="text-sm font-extrabold text-[#111827] uppercase tracking-wider mb-2">
                About this Lecture
              </h3>
              <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
                {lecture.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Course Playlist */}
        <div className="lg:col-span-4 rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
          <div className="mb-4 pb-3 border-b border-black/5">
            <h2 className="text-base font-extrabold text-[#111827]">
              Course Syllabus
            </h2>
            <p className="text-xs text-[#6B7280]">
              Click any lecture to jump to video
            </p>
          </div>

          <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            {syllabus.map((sec, idx) => (
              <div key={sec.title || idx} className="space-y-1.5">
                <div className="text-xs font-black uppercase tracking-wider text-[#9CA3AF] px-2 pt-1">
                  {sec.title}
                </div>
                <div className="space-y-1">
                  {sec.lectures.map((lec) => {
                    const isCurrent = lec._id === lecture._id;
                    return (
                      <Link
                        key={lec._id}
                        href={`/student/courses/${slug}/lectures/${lec._id}`}
                        className={`flex items-center justify-between gap-2.5 rounded-xl p-2.5 text-xs transition-all ${
                          isCurrent
                            ? "bg-amber-100 font-bold text-neutral-900 shadow-2xs"
                            : "text-[#374151] hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {lec.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                          )}
                          <span className="truncate">{lec.title}</span>
                        </div>
                        <span className="text-[11px] text-[#6B7280] shrink-0">
                          {Math.round((lec.durationSec || 0) / 60)}m
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
