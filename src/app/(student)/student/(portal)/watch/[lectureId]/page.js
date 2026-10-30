import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { User } from "@/server/db/models/User.js";
import { Lecture } from "@/lib/models/Lecture";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Note } from "@/server/db/models/Note.js";
import { LectureProgress } from "@/lib/models/LectureProgress";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import { buildVimeoEmbedUrl } from "@/lib/utils/vimeoParser";
import StudentWatchClient from "@/components/portal/student/StudentWatchClient";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Watch Lecture | RD Classes",
  description: "Watch video lectures and review revision notes.",
};

async function WatchContent({ params }) {
  await connection();
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  const { lectureId } = await params;

  await connectDB();
  const lectureDoc = await Lecture.findById(lectureId).lean();
  if (!lectureDoc || lectureDoc.status === "archived") {
    notFound();
  }

  // Must have a Vimeo link to be visible/playable
  if (!lectureDoc.vimeoId) {
    notFound();
  }

  const course = await Course.findById(lectureDoc.courseId).lean();
  if (!course) {
    notFound();
  }

  // 1. Access Rule (Server-Side Enforced):
  // Can watch if isFree === true OR student is actively enrolled in that course.
  const isFree = Boolean(
    lectureDoc.isFree === true ||
    lectureDoc.isFreePreview === true ||
    lectureDoc.freePreview === true ||
    lectureDoc.isPreview === true
  );

  const now = new Date();
  const userIdObj = mongoose.Types.ObjectId.isValid(auth.user._id)
    ? new mongoose.Types.ObjectId(auth.user._id)
    : auth.user._id;

  const enrollment = await Enrollment.findOne({
    $and: [
      {
        $or: [
          { userId: userIdObj },
          { studentId: userIdObj },
          { userId: auth.user._id },
          { studentId: auth.user._id },
        ],
      },
      { courseId: lectureDoc.courseId },
      { status: { $ne: "cancelled" } },
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
    ],
  }).lean();

  let isEnrolled = !!enrollment;
  if (!isEnrolled) {
    const dbUser = await User.findById(auth.user._id).lean();
    const courseIdStr = String(lectureDoc.courseId);
    const userCourses = [
      ...(Array.isArray(dbUser?.courses) ? dbUser.courses : []),
      ...(Array.isArray(dbUser?.enrolledCourses) ? dbUser.enrolledCourses : []),
    ].map((c) => (c?._id ? String(c._id) : String(c)));
    isEnrolled = userCourses.includes(courseIdStr);
  }

  const isLocked = !isEnrolled && !isFree;

  // 2. Fetch student's progress for this lecture
  const progress = await LectureProgress.findOne({
    $or: [
      { studentId: auth.user._id, lectureId: lectureDoc._id },
      { userId: auth.user._id, lectureId: lectureDoc._id },
    ],
  }).lean();

  // 3. Fetch chapter lectures for sidebar playlist (only live lectures)
  const chapterLectures = await Lecture.find({
    courseId: lectureDoc.courseId,
    chapterId: lectureDoc.chapterId,
    vimeoId: { $exists: true, $ne: "" },
    status: { $ne: "archived" },
  })
    .sort({ position: 1, order: 1, createdAt: 1 })
    .select("_id title durationSeconds durationSec isFree isFreePreview position order lectureNo")
    .lean();

  // 4. Find Prev & Next live lectures
  const currentPos = lectureDoc.position ?? lectureDoc.order ?? 0;
  const [prevLec, nextLec] = await Promise.all([
    Lecture.findOne({
      courseId: lectureDoc.courseId,
      chapterId: lectureDoc.chapterId,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
      position: { $lt: currentPos },
    })
      .sort({ position: -1 })
      .select("_id title")
      .lean(),
    Lecture.findOne({
      courseId: lectureDoc.courseId,
      chapterId: lectureDoc.chapterId,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
      position: { $gt: currentPos },
    })
      .sort({ position: 1 })
      .select("_id title")
      .lean(),
  ]);

  // 5. Fetch related notes
  const notes = await Note.find({
    $or: [{ courseId: lectureDoc.courseId }, { courseIds: lectureDoc.courseId }],
    published: true,
  })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const formattedNotes = notes.map((n) => {
    const sizeBytes = n.sizeBytes || n.fileSize || 0;
    const sizeStr = sizeBytes
      ? sizeBytes < 1024 * 1024
        ? `${Math.round(sizeBytes / 1024)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : "PDF Document";

    return {
      _id: n._id.toString(),
      title: n.title,
      book: n.book || n.section || "Chapter Material",
      size: sizeStr,
      viewUrl: `/api/notes/${n._id}/stream`,
      downloadUrl: `/api/notes/${n._id}/stream?download=1`,
    };
  });

  const setting = await Setting.findOne().lean();
  const whatsappNumber = setting?.whatsappNumber || setting?.whatsapp || "918368545620";

  // CRITICAL SECURITY RULE:
  // If locked, NEVER send vimeoId, vimeoHash, or playerUrl to client!
  const safeVimeoId = isLocked ? null : lectureDoc.vimeoId;
  const safeVimeoHash = isLocked ? null : lectureDoc.vimeoHash;
  const safePlayerUrl = isLocked ? null : buildVimeoEmbedUrl(lectureDoc.vimeoId, lectureDoc.vimeoHash);

  return (
    <StudentWatchClient
      lecture={{
        _id: lectureDoc._id.toString(),
        title: lectureDoc.title,
        chapterTitle: lectureDoc.chapterTitle || lectureDoc.chapter || lectureDoc.section || "",
        courseTitle: course.title,
        durationSeconds: lectureDoc.durationSeconds || lectureDoc.durationSec || 0,
        isFree,
        lectureNo: lectureDoc.lectureNo || lectureDoc.partNumber || 1,
      }}
      playerUrl={safePlayerUrl}
      vimeoId={safeVimeoId}
      vimeoHash={safeVimeoHash}
      savedPositionSec={progress?.watchedSeconds || progress?.positionSec || 0}
      initialCompleted={Boolean(progress?.completed)}
      studentName={auth.user.name}
      loginId={auth.user.loginId}
      prevLecture={prevLec ? { _id: prevLec._id.toString(), title: prevLec.title } : null}
      nextLecture={nextLec ? { _id: nextLec._id.toString(), title: nextLec.title } : null}
      chapterLectures={JSON.parse(JSON.stringify(chapterLectures))}
      notes={formattedNotes}
      isLocked={isLocked}
      whatsappNumber={whatsappNumber}
    />
  );
}

export default async function WatchLecturePage({ params }) {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <WatchContent params={params} />
    </Suspense>
  );
}
