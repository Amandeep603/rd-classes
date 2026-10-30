import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Progress } from "@/server/db/models/Progress.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Note } from "@/server/db/models/Note.js";
import { getStudentCourseAccess } from "@/server/services/studentAccessService.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const auth = await getCurrentStudent();
  if (!auth?.user) {
    return NextResponse.json(
      {
        authenticated: false,
        enrolled: false,
        enrolledCourseIds: [],
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  await connectDB();
  const access = await getStudentCourseAccess(auth);

  if (!access.authenticated) {
    return NextResponse.json(
      {
        authenticated: false,
        enrolled: false,
        enrolledCourseIds: [],
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  // If slug is omitted, return all active enrolled course IDs
  if (!slug) {
    return NextResponse.json(
      {
        authenticated: true,
        enrolled: access.enrolledCourseIds.length > 0,
        enrolledCourseIds: access.enrolledCourseIds,
        studentName: access.student.name,
        role: "student",
        student: {
          name: access.student.name,
          loginId: access.student.loginId,
          phone: access.student.phone || "",
        },
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  const trimmedSlug = String(slug).trim();
  const slugLower = trimmedSlug.toLowerCase();
  const queryConditions = [
    { slug: slugLower },
    { slug: trimmedSlug },
  ];
  if (mongoose.isValidObjectId(trimmedSlug)) {
    queryConditions.push({ _id: new mongoose.Types.ObjectId(trimmedSlug) });
  }

  const course = await Course.findOne({
    $or: queryConditions,
    status: { $ne: "archived" },
  })
    .select("_id slug title")
    .lean();

  if (!course) {
    return NextResponse.json(
      {
        authenticated: true,
        enrolled: false,
        student: {
          name: access.student.name,
          loginId: access.student.loginId,
          phone: access.student.phone || "",
        },
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  const isEnrolled =
    access.isEnrolledInCourse(course._id) ||
    access.isEnrolledInCourse(course.slug) ||
    access.isEnrolledInCourse(slugLower);

  if (!isEnrolled) {
    return NextResponse.json(
      {
        authenticated: true,
        enrolled: false,
        studentName: access.student.name,
        student: {
          name: access.student.name,
          loginId: access.student.loginId,
          phone: access.student.phone || "",
        },
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  // Enrolled student: fetch progress and course notes
  const [totalLecturesCount, progressRecords, courseNotes] = await Promise.all([
    Lecture.countDocuments({
      courseId: course._id,
      status: { $ne: "archived" },
    }),
    Progress.find({
      $or: [{ userId: access.student._id }, { studentId: access.student._id }],
      courseId: course._id,
    }).lean(),
    Note.find({
      $or: [{ courseId: course._id }, { courseIds: course._id }],
      published: true,
      status: { $ne: "archived" },
    })
      .sort({ order: 1, createdAt: -1 })
      .lean(),
  ]);

  const completedRecords = progressRecords.filter((p) => p.completed);
  const completedIds = completedRecords.map((p) =>
    (p.lectureId?._id || p.lectureId).toString()
  );

  const progressMap = {};
  progressRecords.forEach((p) => {
    const lId = (p.lectureId?._id || p.lectureId).toString();
    const dur = p.durationSeconds || p.durationSec || 0;
    const pos = p.watchedSeconds || p.positionSec || 0;
    const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
    progressMap[lId] = { percent: pct, positionSec: pos, durationSec: dur };
  });

  const percent =
    totalLecturesCount > 0
      ? Math.min(100, Math.round((completedIds.length / totalLecturesCount) * 100))
      : 0;

  // Find last watched lecture
  const sortedProgress = progressRecords.sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
  const lastWatchedLectureId =
    sortedProgress[0]?.lectureId?.toString() || null;

  return NextResponse.json(
    {
      authenticated: true,
      enrolled: true,
      studentName: access.student.name,
      student: {
        name: access.student.name,
        loginId: access.student.loginId,
        phone: access.student.phone || "",
      },
      enrolledCourseIds: access.enrolledCourseIds,
      totalLectures: totalLecturesCount,
      completedLectures: completedIds.length,
      progressPercent: percent,
      lastWatchedLectureId,
      completedLectureIds: completedIds,
      progressMap,
      enrolledNotes: courseNotes.map((n) => ({
        _id: n._id.toString(),
        title: n.title,
        kind: n.kind,
        category: n.category,
        source: n.source,
        pageCount: n.pageCount,
        section: n.section,
        book: n.book,
        chapter: n.chapter,
        isFree: n.isFree,
      })),
    },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    }
  );
}
