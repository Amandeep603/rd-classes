import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Progress } from "@/server/db/models/Progress.js";
import { Lecture } from "@/server/db/models/Lecture.js";

export const instant = false;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    return NextResponse.json({
      authenticated: false,
      enrolled: false,
      enrolledCourseIds: [],
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  await connectDB();
  const now = new Date();

  // If slug is omitted, return all active enrolled course IDs for general directories
  if (!slug) {
    const enrollments = await Enrollment.find({
      userId: auth.user._id,
      status: "active",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).select("courseId").lean();

    return NextResponse.json({
      authenticated: true,
      enrolled: enrollments.length > 0,
      enrolledCourseIds: enrollments.map((e) => e.courseId.toString()),
      studentName: auth.user.name,
      role: auth.user.role,
      student: {
        name: auth.user.name,
        loginId: auth.user.loginId,
        phone: auth.user.phone,
      },
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const course = await Course.findOne({ slug: slug.toLowerCase() }).select("_id slug").lean();
  const isSaved = Array.isArray(auth.user.savedCourses) && auth.user.savedCourses.includes(slug.toLowerCase());

  if (!course) {
    return NextResponse.json({
      authenticated: true,
      enrolled: false,
      saved: isSaved,
      student: {
        name: auth.user.name,
        loginId: auth.user.loginId,
        phone: auth.user.phone,
      },
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const enrollment = await Enrollment.findOne({
    userId: auth.user._id,
    courseId: course._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  if (!enrollment) {
    return NextResponse.json({
      authenticated: true,
      enrolled: false,
      saved: isSaved,
      studentName: auth.user.name,
      student: {
        name: auth.user.name,
        loginId: auth.user.loginId,
        phone: auth.user.phone,
      },
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  // Enrolled student: fetch progress and course notes
  const { Note } = await import("@/server/db/models/Note.js");
  const [totalLectures, progressRecords, courseNotes] = await Promise.all([
    Lecture.countDocuments({ courseId: course._id, published: true }),
    Progress.find({ userId: auth.user._id, courseId: course._id }).lean(),
    Note.find({ $or: [{ courseId: course._id }, { courseIds: course._id }], published: true })
      .sort({ order: 1, createdAt: -1 })
      .lean(),
  ]);

  const completedRecords = progressRecords.filter((p) => p.completed);
  const completedIds = completedRecords.map((p) => p.lectureId.toString());
  const percent = totalLectures > 0 ? Math.round((completedIds.length / totalLectures) * 100) : 0;

  // Find last watched lecture
  const lastProgress = progressRecords.sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  )[0];

  const enrolledNotes = (courseNotes || []).map((n) => ({
    _id: n._id.toString(),
    title: n.title,
    kind: n.kind,
    source: n.source,
    section: n.section,
    pageCount: n.pageCount,
    accessUrl: n.source === "link" ? n.externalUrl : `/api/notes/${n._id}/stream`,
  }));

  return NextResponse.json({
    authenticated: true,
    enrolled: true,
    saved: isSaved,
    studentName: auth.user.name,
    student: {
      name: auth.user.name,
      loginId: auth.user.loginId,
      phone: auth.user.phone,
    },
    totalLectures,
    completedLectures: completedIds.length,
    progressPercent: percent,
    completedLectureIds: completedIds,
    lastWatchedLectureId: lastProgress ? lastProgress.lectureId.toString() : null,
    enrolledNotes,
  }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, action } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "Course slug is required" }, { status: 400 });
    }

    await connectDB();
    const { User } = await import("@/server/db/models/User.js");

    const normalizedSlug = slug.toLowerCase().trim();
    if (action === "save") {
      await User.findByIdAndUpdate(auth.user._id, {
        $addToSet: { savedCourses: normalizedSlug },
      });
      return NextResponse.json({ success: true, saved: true });
    } else {
      await User.findByIdAndUpdate(auth.user._id, {
        $pull: { savedCourses: normalizedSlug },
      });
      return NextResponse.json({ success: true, saved: false });
    }
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to update saved courses" }, { status: 500 });
  }
}
