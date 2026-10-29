import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Note } from "@/server/db/models/Note.js";
import { Test } from "@/server/db/models/Test.js";

export const instant = false;

export async function GET(request) {
  const auth = await getCurrentUser();
  if (!auth?.user || auth.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ lectures: [], notes: [], tests: [] });
  }

  await connectDB();
  const now = new Date();

  // Find active enrollments
  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select("courseId").lean();

  const activeCourseIds = enrollments.map((e) => e.courseId).filter(Boolean);
  if (activeCourseIds.length === 0) {
    return NextResponse.json({ lectures: [], notes: [], tests: [] });
  }

  const regex = new RegExp(q, "i");

  // 1. Lectures the student can access
  const lectures = await Lecture.find({
    courseId: { $in: activeCourseIds },
    published: true,
    $or: [{ title: regex }, { section: regex }, { chapter: regex }],
  })
    .sort({ order: 1 })
    .limit(6)
    .select("_id title section durationSec courseId")
    .lean();

  // 2. Notes the student can access
  const notes = await Note.find({
    $or: [
      { courseId: { $in: activeCourseIds } },
      { courseIds: { $in: activeCourseIds } },
    ],
    published: true,
    $or: [{ title: regex }, { book: regex }, { section: regex }],
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .select("_id title book section fileSize")
    .lean();

  // 3. Tests the student can access
  const tests = await Test.find({
    published: true,
    $or: [
      { className: "All" },
      { className: auth.user.className || "12" },
      { courseId: { $in: activeCourseIds } },
    ],
    $or: [{ title: regex }, { syllabus: regex }],
  })
    .sort({ startsAt: -1 })
    .limit(4)
    .select("_id title startsAt kind syllabus")
    .lean();

  return NextResponse.json({
    lectures: lectures.map((l) => ({
      _id: l._id.toString(),
      title: l.title,
      section: l.section || l.chapter || "Lecture",
      durationMin: Math.round((l.durationSec || 0) / 60),
      href: `/student/watch/${l._id}`,
    })),
    notes: notes.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      book: n.book || n.section || "Handout",
      href: `/student/notes`,
    })),
    tests: tests.map((t) => ({
      _id: t._id.toString(),
      title: t.title,
      date: t.startsAt ? new Date(t.startsAt).toLocaleDateString("en-IN") : "",
      href: `/student/tests`,
    })),
  });
}
