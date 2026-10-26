import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { getCourseSyllabusForStudent } from "@/server/services/lectureService.js";
import { getNotesForCourse } from "@/server/services/noteService.js";
import ProgressBar from "@/components/portal/ui/ProgressBar";
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Clock,
  Sparkles,
  BookOpen,
  FileText,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";

export const instant = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const course = await Course.findOne({ slug, published: true })
    .select("title")
    .lean();
  return {
    title: course ? `${course.title} | RD Classes` : "Course | RD Classes",
  };
}

export default async function StudentCoursePage({ params }) {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
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
  const courseNotes = await getNotesForCourse(course._id, { publishedOnly: true });

  // Calculate totals
  let totalLectures = 0;
  let completedLectures = 0;
  sections.forEach((sec) => {
    sec.lectures.forEach((lec) => {
      totalLectures += 1;
      if (lec.completed) completedLectures += 1;
    });
  });

  const percent =
    totalLectures > 0
      ? Math.min(100, Math.round((completedLectures / totalLectures) * 100))
      : 0;

  const formatDuration = (sec) => {
    if (!sec) return "0 min";
    const m = Math.floor(sec / 60);
    return `${m} min`;
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Courses</span>
        </Link>
      </div>

      {/* Course Header Card */}
      <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-3 py-1 text-xs font-extrabold text-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Board Syllabus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {course.title}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {course.description || "Detailed conceptual video lectures, practice questions and Sunday test prep."}
            </p>
          </div>

          {/* Course Progress box */}
          <div className="rounded-2xl bg-neutral-50 p-4 border border-black/5 lg:w-72 shrink-0 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#111827]">
                {completedLectures} of {totalLectures} completed
              </span>
              <span className="text-amber-600 font-extrabold">{percent}%</span>
            </div>
            <ProgressBar value={percent} max={100} tone="yellow" height={8} />
            <div className="text-[11px] text-[#6B7280] pt-1">
              {enrollment
                ? enrollment.expiresAt
                  ? `Valid until ${new Date(enrollment.expiresAt).toLocaleDateString("en-IN")}`
                  : "Full access enabled"
                : "Free Preview Mode"}
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div
            key={section.sectionTitle || sIdx}
            className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-xs"
          >
            {/* Section Header */}
            <div className="border-b border-black/5 bg-neutral-50/70 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-neutral-900 font-bold text-xs">
                  {sIdx + 1}
                </div>
                <h2 className="text-base font-bold text-[#111827]">
                  {section.sectionTitle}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#6B7280]">
                {section.lectures.length} {section.lectures.length === 1 ? "Lecture" : "Lectures"}
              </span>
            </div>

            {/* Lecture items */}
            <div className="divide-y divide-black/5">
              {section.lectures.map((lecture, lIdx) => {
                const isFree = Boolean(lecture.freePreview ?? lecture.isPreview);
                const canWatch = enrollment || isFree;

                return (
                  <div
                    key={lecture._id}
                    className="flex items-center justify-between gap-4 p-4 sm:px-6 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {lecture.completed ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 font-bold text-xs shrink-0">
                          {lIdx + 1}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#111827] truncate">
                          {lecture.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(lecture.durationSec)}</span>
                          {isFree && !enrollment && (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              Free
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canWatch ? (
                        <Link
                          href={`/student/courses/${slug}/lectures/${lecture._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-3.5 py-2 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-colors"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>{lecture.completed ? "Replay" : "Watch"}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Course Notes & Handouts */}
      {courseNotes.length > 0 && (
        <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-xs">
          <div className="border-b border-black/5 bg-neutral-50/70 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-neutral-900 font-bold text-xs">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">
                Course Notes & Handouts
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#6B7280]">
              {courseNotes.length} {courseNotes.length === 1 ? "Resource" : "Resources"}
            </span>
          </div>

          <div className="divide-y divide-black/5">
            {courseNotes.map((note) => {
              const isLink = note.source === "link";
              const canAccess = Boolean(enrollment);

              return (
                <div
                  key={note._id}
                  className="flex items-center justify-between gap-4 p-4 sm:px-6 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#111827] truncate">
                        {note.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                        <span>{note.section || "Chapter Handout"}</span>
                        <span>•</span>
                        <span>
                          {isLink
                            ? "External Link"
                            : note.pageCount
                            ? `${note.pageCount} pages`
                            : "PDF File"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {canAccess ? (
                      isLink ? (
                        <a
                          href={note.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-3.5 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/notes/${note._id}/stream`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-[#FFC21A] px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </a>
                          <a
                            href={`/api/notes/${note._id}/stream?download=1`}
                            download
                            title="Download PDF"
                            className="rounded-xl border border-black/10 bg-white p-1.5 text-[#374151] hover:bg-neutral-50 shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Enroll to Access</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
