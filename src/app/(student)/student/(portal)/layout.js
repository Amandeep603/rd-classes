import { Suspense } from "react";
import mongoose from "mongoose";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { requireStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Progress } from "@/server/db/models/Progress.js";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import { Announcement } from "@/server/db/models/Announcement.js";
import { Note } from "@/server/db/models/Note.js";
import StudentPortalShell from "@/components/portal/student/StudentPortalShell";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";
import { getStudentCourseAccess, getStudentCourseContext } from "@/server/services/studentAccessService.js";

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

  // 2. Fetch Active Courses and validated selected course from unified context helper
  const cookieStore = await cookies();
  const selectedCourseCookie = cookieStore.get("rd_selected_course")?.value || null;
  const context = await getStudentCourseContext(auth, selectedCourseCookie);
  const activeCourses = [...context.activeCourses];
  const mainCourse = context.selectedCourse;
  const subtitle = mainCourse
    ? mainCourse.title
    : auth.user.className
      ? `Class ${auth.user.className} Accountancy`
      : "CBSE Accountancy Syllabus";

  const classPill =
    mainCourse?.classLabel ||
    (auth.user.className ? `Class ${auth.user.className}` : "Class 12");

  // Compute selected course progress for the sidebar tracker
  let courseProgress = null;
  if (mainCourse) {
    const mainCourseObjId = mongoose.isValidObjectId(mainCourse._id)
      ? new mongoose.Types.ObjectId(mainCourse._id)
      : mainCourse._id;

    const [totalWithVideo, totalCurriculumLectures, completedCount] = await Promise.all([
      Lecture.countDocuments({
        courseId: mainCourseObjId,
        vimeoId: { $exists: true, $ne: "" },
        status: { $ne: "archived" },
      }),
      Lecture.countDocuments({
        courseId: mainCourseObjId,
        status: { $ne: "archived" },
      }),
      Progress.countDocuments({
        $or: [{ userId: auth.user._id }, { studentId: auth.user._id }],
        courseId: mainCourseObjId,
        completed: true,
      }),
    ]);

    const percent =
      totalWithVideo > 0
        ? Math.min(100, Math.round((completedCount / totalWithVideo) * 100))
        : 0;

    courseProgress = {
      courseId: mainCourse._id,
      courseSlug: mainCourse.slug,
      courseTitle: mainCourse.title,
      completedCount,
      totalWithVideo,
      totalCurriculumLectures,
      percent,
    };
  }

  const activeCourseIds = activeCourses.map((c) => c._id);

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
      status: { $ne: "archived" },
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
      courseProgress={courseProgress}
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
