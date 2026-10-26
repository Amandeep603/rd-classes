import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Course } from "@/server/db/models/Course.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Progress } from "@/server/db/models/Progress.js";
import StudentLecturesView from "@/components/portal/student/StudentLecturesView.jsx";

export const instant = false;

export const metadata = {
  title: "My Lectures | RD Classes Student Portal",
};

export default async function StudentLecturesPage() {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    redirect("/student/login");
  }

  await connectDB();
  const now = new Date();

  // 1. Get student active enrollments
  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("courseId expiresAt")
    .lean();

  const enrolledCourseIds = enrollments.map((e) => e.courseId).filter(Boolean);

  // 2. Fetch published courses
  const courses = await Course.find({
    _id: { $in: enrolledCourseIds },
    published: true,
  })
    .select("title subtitle slug classLabel tone order")
    .sort({ order: 1 })
    .lean();

  const validCourseMap = {};
  courses.forEach((c) => {
    validCourseMap[c._id.toString()] = c;
  });

  const validCourseIds = courses.map((c) => c._id);

  // 3. Fetch all published lectures for enrolled courses
  const rawLectures = await Lecture.find({
    courseId: { $in: validCourseIds },
    published: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .select("title section durationSec courseId isPreview freePreview order")
    .lean();

  // 4. Fetch student progress records
  const progressList = await Progress.find({
    userId: auth.user._id,
    courseId: { $in: validCourseIds },
  })
    .sort({ updatedAt: -1 })
    .lean();

  const progressMap = {};
  let lastWatchedRecord = null;
  progressList.forEach((p) => {
    const key = p.lectureId.toString();
    progressMap[key] = p;
    if (!lastWatchedRecord && (p.currentTimeSec > 0 || p.completed)) {
      lastWatchedRecord = p;
    }
  });

  // 5. Enrich lectures with course title, slug, and progress
  const lectures = rawLectures.map((l) => {
    const course = validCourseMap[l.courseId.toString()] || {};
    const prog = progressMap[l._id.toString()];
    return {
      _id: l._id.toString(),
      title: l.title,
      section: l.section || "General",
      durationSec: l.durationSec || 0,
      courseId: l.courseId.toString(),
      courseTitle: course.title || "Course",
      courseSlug: course.slug || "",
      classLabel: course.classLabel || "Class 12",
      tone: course.tone || "sky",
      completed: !!prog?.completed,
      currentTimeSec: prog?.currentTimeSec || 0,
    };
  });

  // Identify last watched lecture for Resume button
  let lastWatched = null;
  if (lastWatchedRecord) {
    const found = lectures.find(
      (l) => l._id === lastWatchedRecord.lectureId.toString()
    );
    if (found) {
      lastWatched = found;
    }
  } else if (lectures.length > 0) {
    // Default to first uncompleted or first lecture
    const uncompleted = lectures.find((l) => !l.completed);
    lastWatched = uncompleted || lectures[0];
  }

  return (
    <StudentLecturesView
      courses={JSON.parse(JSON.stringify(courses))}
      lectures={lectures}
      lastWatched={lastWatched}
    />
  );
}
