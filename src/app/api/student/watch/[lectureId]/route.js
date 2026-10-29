import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { getAuthorizedLecture, isLectureFree } from "@/server/services/lectureService.js";

export const instant = false;

export async function GET(request, { params }) {
  const { lectureId } = await params;
  if (!lectureId) {
    return NextResponse.json({ error: "Missing lecture ID" }, { status: 400 });
  }

  await connectDB();
  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture || (!lecture.published && lecture.status !== "published")) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  const allCourseLectures = await Lecture.find({
    courseId: lecture.courseId,
    published: true,
  }).lean();

  const isFree = isLectureFree(lecture, allCourseLectures);
  const auth = await getCurrentUser();

  if (!isFree) {
    if (!auth?.user || auth.user.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden. Please log in with an enrolled student account.", isFree: false, locked: true },
        { status: 403 }
      );
    }

    const now = new Date();
    const enrollment = await Enrollment.findOne({
      userId: auth.user._id,
      courseId: lecture.courseId,
      status: "active",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean();

    if (!enrollment) {
      return NextResponse.json(
        { error: "Forbidden. You are not enrolled in this course.", isFree: false, locked: true },
        { status: 403 }
      );
    }
  }

  const data = await getAuthorizedLecture({
    lectureId,
    studentId: auth?.user?._id || null,
  });

  if (!data) {
    return NextResponse.json(
      { error: "Forbidden. Lecture is locked.", isFree: false, locked: true },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data });
}
