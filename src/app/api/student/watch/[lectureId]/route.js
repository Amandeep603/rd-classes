import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { getAuthorizedLecture, isLectureFree } from "@/server/services/lectureService.js";
import { getStudentCourseAccess } from "@/server/services/studentAccessService.js";

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
  const auth = await getCurrentStudent();

  let isEnrolled = false;
  let studentMeta = null;

  if (auth?.user) {
    const access = await getStudentCourseAccess(auth);
    isEnrolled = access.isEnrolledInCourse(lecture.courseId);
    if (access.student) {
      studentMeta = {
        name: access.student.name,
        loginId: access.student.loginId,
        phone: access.student.phone || "",
      };
    }
  }

  // ACCESS RULE: Can be watched if isFree === true (anyone) OR enrolled student
  if (!isFree && !isEnrolled) {
    const errorMessage = auth?.user
      ? "This lecture is not part of your enrolled courses"
      : "Forbidden. This lecture is for enrolled students.";
    return NextResponse.json(
      {
        error: errorMessage,
        notEnrolled: Boolean(auth?.user),
        isFree: false,
        locked: true,
      },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  if (!lecture.vimeoId || lecture.vimeoId.trim() === "") {
    return NextResponse.json(
      { error: "Video coming soon. No video uploaded yet.", isFree, locked: false, hasVideo: false },
      {
        status: 404,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  const data = await getAuthorizedLecture({
    lectureId,
    studentId: auth?.user?._id || null,
  });

  if (!data) {
    return NextResponse.json(
      { error: "Forbidden. Lecture is locked.", isFree: false, locked: true },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        ...data,
        student: studentMeta,
      },
    },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    }
  );
}
