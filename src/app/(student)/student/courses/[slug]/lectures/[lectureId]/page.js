import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import { getAuthorizedLecture } from "@/server/services/lectureService.js";
import VimeoPlayer from "@/components/student/VimeoPlayer";
import { markLectureCompleteAction } from "@/server/actions/student.progress.actions.js";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
} from "lucide-react";

export const instant = false;

export async function generateMetadata({ params }) {
  const { lectureId } = await params;
  return {
    title: "Lecture Video | RD Classes Student Portal",
  };
}

export default async function StudentLecturePlayerPage({ params }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    redirect("/student/login");
  }

  const { slug, lectureId } = await params;

  const data = await getAuthorizedLecture({
    lectureId,
    studentId: auth.user._id,
  });

  if (!data) {
    notFound();
  }

  const { lecture, playerUrl, savedPositionSec, completed, prevLecture, nextLecture } =
    data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Top breadcrumb & course link */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link
          href={`/student/courses/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Course Syllabus</span>
        </Link>

        <span className="text-xs font-semibold text-[#FFB800] bg-[#FFB800]/10 px-2.5 py-1 rounded-full">
          {lecture.section}
        </span>
      </div>

      {/* Responsive Video Canvas with Watermark */}
      <div className="mb-6">
        <VimeoPlayer
          playerUrl={playerUrl}
          lectureId={String(lecture._id)}
          savedPositionSec={savedPositionSec}
          studentName={auth.user.name}
          loginId={auth.user.loginId}
        />
      </div>

      {/* Lecture Details and Navigation Controls */}
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#202026]">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              {lecture.title}
            </h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#FFB800]" />
                {lecture.courseTitle}
              </span>
              {lecture.isPreview && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">Free Preview</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <form action={markLectureCompleteAction.bind(null, String(lecture._id))}>
              <button
                type="submit"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
                  completed
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                    : "bg-[#1E1E24] hover:bg-[#2A2A33] text-gray-300 border border-[#33333D]"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{completed ? "Completed" : "Mark as Complete"}</span>
              </button>
            </form>
          </div>
        </div>

        {lecture.description && (
          <div className="mt-4 text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {lecture.description}
          </div>
        )}

        {/* Previous / Next Lecture Navigation */}
        <div className="mt-6 pt-5 border-t border-[#202026] flex items-center justify-between gap-3">
          {prevLecture ? (
            <Link
              href={`/student/courses/${slug}/lectures/${prevLecture._id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#17171C] hover:bg-[#202026] text-xs font-semibold text-gray-200 rounded-xl border border-[#2D2D35] transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {prevLecture.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextLecture ? (
            <Link
              href={`/student/courses/${slug}/lectures/${nextLecture._id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-xs font-bold text-[#0A0A0B] rounded-xl transition"
            >
              <span className="hidden sm:inline">Next:</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {nextLecture.title}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
