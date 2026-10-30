import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Progress } from "@/server/db/models/Progress.js";
import { getStudentCourseAccess } from "@/server/services/studentAccessService.js";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  await connectDB();
  const access = await getStudentCourseAccess(auth);
  if (!access.authenticated || access.activeCourses.length === 0) {
    return NextResponse.json(
      {
        courseTitle: "Your Progress",
        completedCount: 0,
        totalWithVideo: 0,
        totalCurriculumLectures: 0,
        percent: 0,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  const cookieStore = await cookies();
  const selectedCookie = cookieStore.get("rd_selected_course")?.value || null;

  let selectedCourse = access.activeCourses[0];
  if (selectedCookie) {
    const target = String(selectedCookie).toLowerCase();
    const found = access.activeCourses.find(
      (c) => String(c._id).toLowerCase() === target || (c.slug && c.slug.toLowerCase() === target)
    );
    if (found) selectedCourse = found;
  }

  const selectedCourseObjId = mongoose.isValidObjectId(selectedCourse._id)
    ? new mongoose.Types.ObjectId(selectedCourse._id)
    : selectedCourse._id;

  const [totalWithVideo, totalCurriculumLectures, completedCount] = await Promise.all([
    Lecture.countDocuments({
      courseId: selectedCourseObjId,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
    }),
    Lecture.countDocuments({
      courseId: selectedCourseObjId,
      status: { $ne: "archived" },
    }),
    Progress.countDocuments({
      $or: [{ userId: auth.user._id }, { studentId: auth.user._id }],
      courseId: selectedCourseObjId,
      completed: true,
    }),
  ]);

  const percent =
    totalWithVideo > 0
      ? Math.min(100, Math.round((completedCount / totalWithVideo) * 100))
      : 0;

  return NextResponse.json(
    {
      courseId: selectedCourse._id,
      courseSlug: selectedCourse.slug,
      courseTitle: selectedCourse.title,
      completedCount,
      totalWithVideo,
      totalCurriculumLectures,
      percent,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
