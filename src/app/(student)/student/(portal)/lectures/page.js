import { Suspense } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import Link from "next/link";
import { MessageCircle, Video } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Course } from "@/server/db/models/Course.js";
import { User } from "@/server/db/models/User.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { LectureProgress } from "@/lib/models/LectureProgress";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import CourseSyllabus from "@/components/course/CourseSyllabus";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Lectures | RD Classes Student Portal",
  description: "Structured video lectures for Class 11 and 12 Accountancy.",
};

async function StudentLecturesContent({ searchParams }) {
  await connection();
  const auth = await getCurrentUser();
  if (!auth?.user) return null;

  await connectDB();
  const now = new Date();
  const userId = auth.user._id;

  const resolvedParams = (await searchParams) || {};
  const queryCourse = resolvedParams.course;

  // 1. Fetch user's enrolled courses
  const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
  const userStrId = String(userId);
  const userQueries = [{ userId: userStrId }, { studentId: userStrId }];
  if (userObjId) {
    userQueries.push({ userId: userObjId }, { studentId: userObjId });
  }

  const enrollments = await Enrollment.find({
    $and: [
      { $or: userQueries },
      { status: { $ne: "cancelled" } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  })
    .populate("courseId")
    .lean();

  const dbUser = await User.findById(userId).lean();
  const userCourseList = [];
  if (Array.isArray(dbUser?.courses)) {
    for (const c of dbUser.courses) {
      if (c) userCourseList.push(c._id ? String(c._id) : String(c));
    }
  }
  if (Array.isArray(dbUser?.enrolledCourses)) {
    for (const c of dbUser.enrolledCourses) {
      if (c) userCourseList.push(c._id ? String(c._id) : String(c));
    }
  }
  if (Array.isArray(dbUser?.savedCourses)) {
    for (const c of dbUser.savedCourses) {
      if (c) userCourseList.push(String(c));
    }
  }

  const enrolledFromEnrollments = enrollments.map((e) => e.courseId).filter(Boolean);
  const existingCourseIdStrings = new Set(enrolledFromEnrollments.map((c) => String(c._id)));
  const missingCourseIds = userCourseList.filter((id) => !existingCourseIdStrings.has(String(id)));

  let directCourses = [];
  if (missingCourseIds.length > 0) {
    const validMissingIds = missingCourseIds.filter((id) => mongoose.isValidObjectId(id));
    if (validMissingIds.length > 0) {
      directCourses = await Course.find({ _id: { $in: validMissingIds } }).lean();
    }
  }

  const allCourses = [...enrolledFromEnrollments, ...directCourses];
  const activeCourses = [];
  const seenCourseIds = new Set();
  for (const c of allCourses) {
    const cidStr = String(c._id);
    if (!seenCourseIds.has(cidStr)) {
      seenCourseIds.add(cidStr);
      activeCourses.push(c);
    }
  }

  const setting = await Setting.findOne().lean();
  const whatsappNumber = setting?.whatsappNumber || setting?.whatsapp || "918368545620";
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone || "918368545620"}?text=${encodeURIComponent(
    "Hello Sir, I have logged into the student portal but do not see my course assigned yet."
  )}`;

  // ZERO COURSES STATE
  if (activeCourses.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-xs">
          <Video className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-extrabold text-[#1F2A44]">No course assigned yet</h2>
          <p className="text-sm font-medium text-[#5B6577]">
            Please contact RD Classes on WhatsApp to assign your course batch.
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 h-[48px] rounded-full bg-[#16A34A] hover:bg-[#15803D] px-6 text-sm font-bold text-white shadow-xs transition-all active:scale-98"
        >
          <MessageCircle className="h-4 w-4 fill-white" />
          <span>Contact on WhatsApp</span>
        </a>
      </div>
    );
  }

  // Selected Course selection: query param -> cookie -> activeCourses[0]
  const cookieStore = await cookies();
  const selectedCookie = cookieStore.get("rd_selected_course")?.value || null;
  const targetCourseIdentifier = queryCourse || selectedCookie || null;

  let selectedCourse = activeCourses[0];
  if (targetCourseIdentifier) {
    const target = String(targetCourseIdentifier).toLowerCase();
    const found = activeCourses.find(
      (c) => String(c._id).toLowerCase() === target || (c.slug && c.slug.toLowerCase() === target)
    );
    if (found) {
      selectedCourse = found;
    }
  }

  // Fetch all 67 lectures for the course
  const [lectures, progressList] = await Promise.all([
    Lecture.find({
      courseId: selectedCourse._id,
      status: { $ne: "archived" },
    })
      .sort({ bookNo: 1, chapterNo: 1, lectureNo: 1, position: 1, order: 1, createdAt: 1 })
      .lean(),
    LectureProgress.find({
      $or: [{ studentId: userId }, { userId }],
      courseId: selectedCourse._id,
    }).lean(),
  ]);

  const serializedCourse = JSON.parse(JSON.stringify(selectedCourse));
  const serializedLectures = JSON.parse(JSON.stringify(lectures));
  const serializedProgress = JSON.parse(JSON.stringify(progressList));

  const completedLectureIds = serializedProgress
    .filter((p) => p.isCompleted || p.completed)
    .map((p) => (p.lectureId?._id || p.lectureId).toString());

  const progressMap = {};
  serializedProgress.forEach((p) => {
    const lId = (p.lectureId?._id || p.lectureId).toString();
    const dur = p.durationSeconds || p.durationSec || 0;
    const pos = p.watchedSeconds || p.positionSec || 0;
    const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
    progressMap[lId] = { percent: pct, positionSec: pos, durationSec: dur };
  });

  return (
    <CourseSyllabus
      course={serializedCourse}
      lectures={serializedLectures}
      isEnrolled={true}
      completedLectureIds={completedLectureIds}
      lectureProgressMap={progressMap}
      whatsappNumber={whatsappNumber}
      showCourseHeader={true}
      watchBaseUrl="/student/watch"
    />
  );
}

export default async function StudentLecturesPage({ searchParams }) {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentLecturesContent searchParams={searchParams} />
    </Suspense>
  );
}
