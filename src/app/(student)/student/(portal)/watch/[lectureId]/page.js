import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Note } from "@/server/db/models/Note.js";
import { getAuthorizedLecture } from "@/server/services/lectureService.js";
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
  const isPublished = lectureDoc?.status ? lectureDoc.status === "published" : lectureDoc?.published;
  if (!lectureDoc || !isPublished) {
    notFound();
  }

  // Strict enrollment check: must be actively enrolled in the course that owns this lecture
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
      { status: "active" },
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
    ],
  }).lean();

  const isFree = Boolean(
    lectureDoc.isFree || lectureDoc.freePreview || lectureDoc.isPreview
  );
  if (!enrollment && !isFree) {
    notFound();
  }

  const data = await getAuthorizedLecture({
    lectureId,
    studentId: auth.user._id,
  });

  if (!data) {
    notFound();
  }

  // Fetch related chapter notes
  const notes = await Note.find({
    $or: [
      { courseId: lectureDoc.courseId },
      { courseIds: lectureDoc.courseId },
    ],
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

  return (
    <StudentWatchClient
      lecture={data.lecture}
      playerUrl={data.playerUrl}
      savedPositionSec={data.savedPositionSec}
      initialCompleted={data.completed}
      studentName={auth.user.name}
      loginId={auth.user.loginId}
      prevLecture={data.prevLecture}
      nextLecture={data.nextLecture}
      notes={formattedNotes}
    />
  );
}

export default function StudentWatchPage(props) {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <WatchContent params={props.params} />
    </Suspense>
  );
}
