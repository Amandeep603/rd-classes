import { notFound, forbidden } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import mongoose from "mongoose";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Progress } from "@/server/db/models/Progress.js";
import { Note } from "@/server/db/models/Note.js";
import ProgressBar from "@/components/portal/ui/ProgressBar";
import {
  PlayCircle,
  CheckCircle2,
  ArrowLeft,
  Clock,
  BookOpen,
  FileText,
  Eye,
  Download,
  Video as VideoIcon,
  ChevronDown,
} from "lucide-react";

export const metadata = {
  title: "Course Lectures | RD Classes",
  description: "View course lectures, book chapters, and study materials.",
};

export default async function CourseLecturesContent({ params }) {
  await connection();
  const resolvedParams = await params;
  const courseSlug = resolvedParams?.courseSlug;
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();

  const course = await Course.findOne({ slug: courseSlug, published: true }).lean();
  if (!course) {
    notFound();
  }

  // 1. Verify enrollment: student must have an active enrollment for this course
  const now = new Date();
  const userIdObj = mongoose.Types.ObjectId.isValid(auth.user._id)
    ? new mongoose.Types.ObjectId(auth.user._id)
    : auth.user._id;

  const enrollment = await Enrollment.findOne({
    $or: [
      { userId: userIdObj },
      { studentId: userIdObj },
      { userId: auth.user._id },
      { studentId: auth.user._id },
    ],
    courseId: course._id,
    status: "active",
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
    ],
  }).lean();

  if (!enrollment) {
    forbidden();
  }

  // 2. Fetch published lectures (draft lectures are hidden)
  const lectures = await Lecture.find({
    courseId: course._id,
    published: true,
  })
    .sort({ order: 1, position: 1, createdAt: 1 })
    .lean();

  // 3. Fetch student's progress records
  const progressRecords = await Progress.find({
    $or: [{ userId: userIdObj }, { userId: auth.user._id }],
    courseId: course._id,
  }).lean();

  const progressMap = new Map();
  progressRecords.forEach((p) => {
    progressMap.set(p.lectureId.toString(), {
      completed: Boolean(p.completed),
      positionSec: p.positionSec || 0,
      durationSec: p.durationSec || 0,
    });
  });

  // Calculate course completion stats
  const totalLectures = lectures.length;
  let completedCount = 0;
  lectures.forEach((l) => {
    const prog = progressMap.get(l._id.toString());
    if (prog?.completed) completedCount++;
  });

  const overallPercent =
    totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  // 4. Fetch related study notes for this course
  const notes = await Note.find({
    $or: [{ courseId: course._id }, { courseIds: course._id }],
    published: true,
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  // 5. Group lectures: Book -> Chapter -> Lectures
  // Book map: bookTitle -> Map(chapterTitle -> Array of lectures)
  const booksMap = new Map();

  lectures.forEach((lecture) => {
    const bookTitle = lecture.book || "Book 1: Accountancy";
    const chapterTitle = lecture.chapter || lecture.section || "General Chapter Revision";

    if (!booksMap.has(bookTitle)) {
      booksMap.set(bookTitle, new Map());
    }
    const chaptersMap = booksMap.get(bookTitle);

    if (!chaptersMap.has(chapterTitle)) {
      chaptersMap.set(chapterTitle, []);
    }

    const prog = progressMap.get(lecture._id.toString());
    const dur = lecture.durationSec || prog?.durationSec || 0;
    const pos = prog?.positionSec || 0;
    const isCompleted = Boolean(prog?.completed);
    const percent = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;

    chaptersMap.get(chapterTitle).push({
      _id: lecture._id.toString(),
      title: lecture.title,
      durationSec: dur,
      order: lecture.order || 0,
      completed: isCompleted,
      percent,
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/student/lectures"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Courses</span>
        </Link>

        <div className="text-xs font-semibold text-[#6B7280]">
          <Link href="/student" className="hover:text-[#111827]">
            Dashboard
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/student/lectures" className="hover:text-[#111827]">
            Lectures
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#111827] font-bold">{course.title}</span>
        </div>
      </div>

      {/* Course Hero Banner */}
      <div className="rounded-[28px] border border-black/5 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
                {course.classLabel || "Class 12"}
              </span>
              <span className="text-xs font-medium text-[#6B7280]">
                {totalLectures} Recorded Lectures
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl leading-relaxed">
              {course.subtitle || course.description || "Follow chapters in order. Watch lectures, solve exercises, and download formula sheets."}
            </p>
          </div>

          {/* Progress Box */}
          <div className="rounded-2xl border border-black/5 bg-neutral-50 p-5 w-full lg:w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#6B7280]">Course Completion</span>
              <span className="text-[#D97706] font-extrabold">{overallPercent}%</span>
            </div>

            <ProgressBar
              value={overallPercent}
              max={100}
              tone="yellow"
              height={8}
            />

            <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
              <span>{completedCount} of {totalLectures} completed</span>
              <span className="font-semibold text-emerald-700">Enrolled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Books & Chapters Hierarchy or Clean Empty State */}
      {booksMap.size > 0 ? (
        <div className="space-y-6">
          {Array.from(booksMap.entries()).map(([bookTitle, chaptersMap], bIdx) => (
            <details
              key={bookTitle}
              className="group rounded-[24px] border border-black/6 bg-white shadow-xs overflow-hidden"
              open
            >
              {/* Book Accordion Header Bar */}
              <summary className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-black/6 px-6 py-4 flex items-center justify-between cursor-pointer list-none select-none hover:bg-amber-100/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDB813] text-[#111827] font-black text-sm shadow-2xs">
                    {bIdx + 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309]">
                      BOOK / PART
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-[#111827]">
                      {bookTitle}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#6B7280]">
                    {Array.from(chaptersMap.values()).reduce((sum, list) => sum + list.length, 0)} Lectures
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#6B7280] transition-transform duration-200 group-open:rotate-180" />
                </div>
              </summary>

              {/* Chapters inside this Book */}
              <div className="p-4 sm:p-6 space-y-5">
                {Array.from(chaptersMap.entries()).map(([chapterTitle, chapterLectures]) => (
                  <div
                    key={chapterTitle}
                    className="rounded-2xl border border-black/5 bg-neutral-50/60 overflow-hidden"
                  >
                    {/* Chapter Section Title */}
                    <div className="bg-neutral-100/70 px-4 py-2.5 border-b border-black/4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#6B7280]" />
                        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937]">
                          {chapterTitle}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#6B7280]">
                        {chapterLectures.length} Lectures
                      </span>
                    </div>

                    {/* Lecture rows */}
                    <div className="divide-y divide-black/5">
                      {chapterLectures.map((lecture, lIdx) => (
                        <div
                          key={lecture._id}
                          className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-neutral-50 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-xs font-extrabold text-[#9CA3AF] w-5 text-center shrink-0">
                              {lIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#111827] truncate">
                                {lecture.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] text-[#6B7280] mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{Math.round((lecture.durationSec || 0) / 60)} mins</span>
                                </span>
                                {lecture.completed && (
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Watched</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Link
                              href={`/student/watch/${lecture._id}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FDB813] px-3.5 py-1.5 text-xs font-bold text-[#111827] shadow-2xs hover:bg-[#ffc633] transition-all active:scale-98"
                            >
                              <PlayCircle className="h-3.5 w-3.5 fill-[#111827] text-white" />
                              <span>{lecture.completed ? "Replay" : lecture.percent > 0 ? "Resume" : "Watch"}</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6DA] text-[#D97706] mb-3">
            <VideoIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#111827]">
            Lectures will appear here soon.
          </h3>
          <p className="mt-1 text-xs text-[#6B7280] max-w-sm">
            Recorded lectures and revision classes will be published by Sir as the batch progresses.
          </p>
        </div>
      )}

      {/* Course Notes & Handouts */}
      {notes.length > 0 && (
        <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-[#111827]">
                Course Handouts &amp; Revision Notes
              </h3>
            </div>
            <Link
              href="/student/notes"
              className="text-xs font-bold text-[#D97706] hover:text-[#B45309]"
            >
              All Notes →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.map((note) => (
              <div
                key={note._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-neutral-50 p-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111827] truncate">
                    {note.title}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {note.book || note.section || "Chapter Material"}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/notes/${note._id}/stream`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white border border-black/8 px-2 py-1 text-xs font-bold text-[#374151] hover:bg-neutral-100 shadow-2xs inline-flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </a>
                  <a
                    href={`/api/notes/${note._id}/stream?download=1`}
                    download
                    className="rounded-lg bg-white border border-black/8 p-1 text-[#4B5563] hover:text-[#111827] shadow-2xs inline-flex items-center"
                    aria-label="Download note"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

