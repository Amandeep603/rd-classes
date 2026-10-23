import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { getCourseSyllabusForStudent } from "@/server/services/lectureService.js";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Clock,
  Sparkles,
} from "lucide-react";

export const instant = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const course = await Course.findOne({ slug, published: true }).select("title").lean();
  return {
    title: course ? `${course.title} | RD Classes` : "Course | RD Classes",
  };
}

export default async function StudentCoursePage({ params }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    redirect("/student/login");
  }

  const { slug } = await params;
  await connectDB();

  const course = await Course.findOne({ slug, published: true }).lean();
  if (!course) {
    notFound();
  }

  // Check enrollment
  const now = new Date();
  const enrollment = await Enrollment.findOne({
    userId: auth.user._id,
    courseId: course._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  const sections = await getCourseSyllabusForStudent(course._id, auth.user._id);

  const formatDuration = (sec) => {
    if (!sec) return "0m";
    const m = Math.floor(sec / 60);
    return `${m} min`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/student"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Courses</span>
      </Link>

      {/* Header */}
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-6 sm:p-8 mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFB800] bg-[#FFB800]/10 px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curriculum & Lectures</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-3xl leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {!enrollment ? (
        <div className="bg-[#181313] border border-amber-900/40 rounded-2xl p-8 text-center max-w-md mx-auto">
          <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white">Enrollment Required</h2>
          <p className="text-xs text-gray-300 mt-1 mb-5 leading-relaxed">
            You do not have an active enrollment for this course. If you believe this is an error, please reach out to Ronak Sir.
          </p>
          <Link
            href="/student"
            className="inline-block py-2 px-4 bg-[#FFB800] text-[#0A0A0B] font-bold text-xs rounded-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec, secIdx) => (
            <div
              key={sec.title || secIdx}
              className="bg-[#131316] border border-[#222226] rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-[#17171C] border-b border-[#222226] flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {sec.title}
                </h2>
                <span className="text-xs text-gray-400">
                  {sec.lectures.length} lecture{sec.lectures.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="divide-y divide-[#1D1D23]">
                {sec.lectures.map((lec) => (
                  <Link
                    key={lec._id}
                    href={`/student/courses/${course.slug}/lectures/${lec._id}`}
                    className="px-5 py-4 flex items-center justify-between hover:bg-[#18181E] transition group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      {lec.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <PlayCircle className="w-5 h-5 text-gray-500 group-hover:text-[#FFB800] shrink-0 transition-colors" />
                      )}
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#FFB800] truncate transition-colors">
                          {lec.title}
                        </p>
                        {lec.isPreview && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                            Free Preview
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                      {lec.durationSec > 0 && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lec.durationSec)}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-[#FFB800] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                        Watch →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
