import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { LectureProgress } from "@/lib/models/LectureProgress";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import StudentLecturesAccordion from "@/components/portal/student/StudentLecturesAccordion";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Course Lectures | RD Classes",
  description: "View course lectures, book chapters, and study materials.",
};

async function CourseLecturesContent({ params }) {
  await connection();
  const resolvedParams = await params;
  const courseSlug = resolvedParams?.courseSlug;
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();

  // If courseSlug is actually a 24-char lecture ID, redirect to watch page
  if (/^[0-9a-fA-F]{24}$/.test(courseSlug)) {
    const isLec = await Lecture.findById(courseSlug).lean();
    if (isLec) {
      redirect(`/student/watch/${courseSlug}`);
    }
  }

  const course = await Course.findOne({
    slug: courseSlug,
    status: { $ne: "archived" },
  }).lean();

  if (!course) {
    notFound();
  }

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

  const isEnrolled = Boolean(enrollment);

  const setting = await Setting.findOne().lean();
  const whatsappNumber = setting?.whatsappNumber || setting?.whatsapp || "918368545620";

  // Fetch only Live lectures (draft lectures hidden from students)
  const [books, chapters, lectures, progressList] = await Promise.all([
    Book.find({ courseId: course._id, status: { $ne: "archived" } })
      .sort({ position: 1, createdAt: 1 })
      .lean(),
    Chapter.find({ courseId: course._id, status: { $ne: "archived" } })
      .sort({ position: 1, createdAt: 1 })
      .lean(),
    Lecture.find({
      courseId: course._id,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
    })
      .sort({ position: 1, order: 1, createdAt: 1 })
      .lean(),
    LectureProgress.find({
      $or: [{ studentId: auth.user._id }, { userId: auth.user._id }],
      courseId: course._id,
    }).lean(),
  ]);

  const serializedCourse = JSON.parse(JSON.stringify(course));
  const serializedBooks = JSON.parse(JSON.stringify(books));
  const serializedChapters = JSON.parse(JSON.stringify(chapters));
  const serializedLectures = JSON.parse(JSON.stringify(lectures));
  const serializedProgress = JSON.parse(JSON.stringify(progressList));

  return (
    <StudentLecturesAccordion
      course={serializedCourse}
      books={serializedBooks}
      chapters={serializedChapters}
      lectures={serializedLectures}
      progressList={serializedProgress}
      isEnrolled={isEnrolled}
      whatsappNumber={whatsappNumber}
    />
  );
}

export default async function Page({ params }) {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <CourseLecturesContent params={params} />
    </Suspense>
  );
}
