import { Suspense } from "react";
import mongoose from "mongoose";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { requireStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Course } from "@/server/db/models/Course.js";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import { Announcement } from "@/server/db/models/Announcement.js";
import { Note } from "@/server/db/models/Note.js";
import StudentPortalShell from "@/components/portal/student/StudentPortalShell";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Student Portal | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

async function StudentPortalLayoutContent({ children }) {
  await connection();
  const auth = await requireStudent();

  await connectDB();
  const now = new Date();
  const userId = auth.user._id;

  // 1. Fetch Setting for whatsappNumber
  const setting = await Setting.findOne().lean();
  const whatsappNumber =
    setting?.whatsappNumber || setting?.whatsapp || "918368545620";

  // 2. Fetch Active Enrollments & Main Course
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
    .populate("courseId", "title slug classLabel category status published")
    .lean();

  const userCourseList = [];
  if (Array.isArray(auth.user.courses)) {
    for (const c of auth.user.courses) {
      if (c) userCourseList.push(c._id ? String(c._id) : String(c));
    }
  }
  if (Array.isArray(auth.user.savedCourses)) {
    for (const c of auth.user.savedCourses) {
      if (c) userCourseList.push(String(c));
    }
  }

  const enrolledFromEnrollments = enrollments
    .map((e) => e.courseId)
    .filter(Boolean);

  const existingCourseIdStrings = new Set(
    enrolledFromEnrollments.map((c) => String(c._id))
  );

  const missingCourseIds = userCourseList.filter((id) => !existingCourseIdStrings.has(String(id)));
  let directCourses = [];
  if (missingCourseIds.length > 0) {
    const validMissingIds = missingCourseIds.filter((id) => mongoose.isValidObjectId(id));
    if (validMissingIds.length > 0) {
      directCourses = await Course.find({
        _id: { $in: validMissingIds },
      })
        .select("title slug classLabel category status published")
        .lean();
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

  const cookieStore = await cookies();
  const selectedCourseCookie = cookieStore.get("rd_selected_course")?.value || null;
  if (selectedCourseCookie && activeCourses.length > 1) {
    const target = String(selectedCourseCookie).toLowerCase();
    const idx = activeCourses.findIndex(
      (c) => String(c._id).toLowerCase() === target || (c.slug && c.slug.toLowerCase() === target)
    );
    if (idx > 0) {
      const [chosenCourse] = activeCourses.splice(idx, 1);
      activeCourses.unshift(chosenCourse);
    }
  }

  const mainCourse = activeCourses[0] || null;
  const subtitle = mainCourse
    ? mainCourse.title
    : auth.user.className
      ? `Class ${auth.user.className} Accountancy`
      : "CBSE Accountancy Syllabus";

  const classPill =
    mainCourse?.classLabel ||
    (auth.user.className ? `Class ${auth.user.className}` : "Class 12");

  const activeCourseIds = activeCourses.map((c) => c._id);
  const stringCourseIds = activeCourseIds.map((id) => id.toString());

  // 3. Fetch Notifications (Pinned announcements & Recent notes)
  const [announcements, recentNotes] = await Promise.all([
    Announcement.find({
      active: { $ne: false },
      $and: [
        {
          $or: [
            { startsAt: null },
            { startsAt: { $lte: now } },
            { createdAt: { $lte: now } },
          ],
        },
        {
          $or: [
            { $and: [{ expiresAt: null }, { endsAt: null }] },
            { expiresAt: { $gt: now } },
            { endsAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { audience: "all" },
            { "audience.all": true },
            { audience: { $in: activeCourseIds } },
            { audience: { $in: stringCourseIds } },
            { "audience.courseIds": { $in: activeCourseIds } },
          ],
        },
      ],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(3)
      .select("_id title body")
      .lean(),
    Note.find({
      $or: [
        { courseId: { $in: activeCourseIds } },
        { courseIds: { $in: activeCourseIds } },
      ],
      published: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("_id title book section")
      .lean(),
  ]);

  const notifications = {
    announcements: announcements.map((a) => ({
      _id: a._id.toString(),
      title: a.title,
      body: a.body,
    })),
    notes: recentNotes.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      book: n.book || n.section,
    })),
  };

  return (
    <StudentPortalShell
      student={auth.user}
      subtitle={subtitle}
      classPill={classPill}
      whatsappNumber={whatsappNumber}
      notifications={notifications}
      activeCourses={activeCourses.map((c) => ({
        _id: String(c._id),
        title: c.title,
        slug: c.slug,
      }))}
    >
      <Suspense fallback={<StudentDashboardSkeleton />}>
        {children}
      </Suspense>
    </StudentPortalShell>
  );
}

export default function StudentPortalLayout({ children }) {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentPortalLayoutContent>
        {children}
      </StudentPortalLayoutContent>
    </Suspense>
  );
}
