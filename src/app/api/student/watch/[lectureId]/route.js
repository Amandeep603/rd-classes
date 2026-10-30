import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { User } from "@/server/db/models/User.js";
import { getAuthorizedLecture, isLectureFree } from "@/server/services/lectureService.js";

export const instant = false;

export async function GET(request, { params }) {
  const { lectureId } = await params;
  if (!lectureId) {
    return NextResponse.json({ error: "Missing lecture ID" }, { status: 400 });
  }

  await connectDB();
  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture || lecture.status === "archived") {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  const isFree = isLectureFree(lecture);
  const auth = await getCurrentUser();

  let isEnrolled = false;
  if (auth?.user) {
    const now = new Date();
    const enrollment = await Enrollment.findOne({
      $and: [
        {
          $or: [
            { userId: auth.user._id },
            { studentId: auth.user._id },
            { userId: String(auth.user._id) },
            { studentId: String(auth.user._id) },
          ],
        },
        { courseId: lecture.courseId },
        { status: { $ne: "cancelled" } },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    }).lean();

    if (enrollment) {
      isEnrolled = true;
    } else {
      const dbUser = await User.findById(auth.user._id).lean();
      const courseIdStr = String(lecture.courseId);
      const userCourses = [
        ...(Array.isArray(dbUser?.courses) ? dbUser.courses : []),
        ...(Array.isArray(dbUser?.enrolledCourses) ? dbUser.enrolledCourses : []),
      ].map((c) => (c?._id ? String(c._id) : String(c)));
      isEnrolled = userCourses.includes(courseIdStr);
    }
  }

  // ACCESS RULE: Can be watched if isFree === true (anyone) OR enrolled student
  if (!isFree && !isEnrolled) {
    return NextResponse.json(
      { error: "Forbidden. This lecture is for enrolled students.", isFree: false, locked: true },
      { status: 403 }
    );
  }

  if (!lecture.vimeoId || lecture.vimeoId.trim() === "") {
    return NextResponse.json(
      { error: "Video coming soon. No video uploaded yet.", isFree, locked: false, hasVideo: false },
      { status: 404 }
    );
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
