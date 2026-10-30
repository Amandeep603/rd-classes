import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import PortalLecturesView from "@/components/portal/admin/PortalLecturesView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Lectures | RD Classes Admin",
};

async function LecturesContent({ searchParams }) {
  await requireAdmin();
  await connectDB();

  const resolvedParams = (await searchParams) || {};
  const queryCourseSlug = resolvedParams.course;
  const queryCourseId = resolvedParams.courseId;

  const courses = await Course.find()
    .select("title slug")
    .sort({ order: 1, createdAt: 1 })
    .lean();

  if (!courses || courses.length === 0) {
    return (
      <PortalLecturesView
        courses={[]}
        initialBooks={[]}
        initialChapters={[]}
        initialLectures={[]}
        initialCourse={null}
      />
    );
  }

  // Find target course
  let activeCourse = null;
  if (queryCourseSlug) {
    activeCourse = courses.find((c) => c.slug === queryCourseSlug);
  } else if (queryCourseId) {
    activeCourse = courses.find((c) => c._id.toString() === queryCourseId);
  }

  if (!activeCourse) {
    activeCourse =
      courses.find((c) => c.slug === "class-12-accountancy" || c.title?.toLowerCase().includes("class 12")) ||
      courses[0];
  }

  const [books, chapters, lectures] = await Promise.all([
    Book.find({ courseId: activeCourse._id })
      .sort({ position: 1, createdAt: 1 })
      .lean(),
    Chapter.find({ courseId: activeCourse._id })
      .sort({ position: 1, createdAt: 1 })
      .lean(),
    Lecture.find({ courseId: activeCourse._id })
      .sort({ bookNo: 1, chapterNo: 1, lectureNo: 1, position: 1, order: 1, createdAt: 1 })
      .lean(),
  ]);

  const serializedCourses = JSON.parse(JSON.stringify(courses));
  const serializedActiveCourse = JSON.parse(JSON.stringify(activeCourse));
  const serializedBooks = JSON.parse(JSON.stringify(books));
  const serializedChapters = JSON.parse(JSON.stringify(chapters));
  const serializedLectures = JSON.parse(JSON.stringify(lectures));

  return (
    <PortalLecturesView
      courses={serializedCourses}
      initialCourse={serializedActiveCourse}
      initialBooks={serializedBooks}
      initialChapters={serializedChapters}
      initialLectures={serializedLectures}
    />
  );
}

export default async function AdminLecturesPage({ searchParams }) {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <LecturesContent searchParams={searchParams} />
    </Suspense>
  );
}
