import { connection } from "next/server";
import { requireStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { User } from "@/server/db/models/User.js";
import { Device } from "@/server/db/models/Device.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Progress } from "@/server/db/models/Progress.js";
import { TestResult } from "@/server/db/models/TestResult.js";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import { getStudentCourseAccess } from "@/server/services/studentAccessService.js";
import StudentProfileClient from "@/components/portal/student/StudentProfileClient";

export const instant = false;

export const metadata = {
  title: "My Profile | RD Classes Student Portal",
};

function formatTimeAgo(date) {
  if (!date) return "recently";
  const now = new Date();
  const past = new Date(date);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDeviceLabel(dev) {
  if (!dev) return "Windows laptop · Chrome";
  if (dev.deviceLabel && !dev.deviceLabel.startsWith("dev_")) return dev.deviceLabel;
  if (dev.label && !dev.label.startsWith("dev_")) return dev.label;

  const parts = [];
  if (dev.os) parts.push(dev.os);
  else if (dev.deviceType === "desktop") parts.push("Windows laptop");
  else if (dev.deviceType === "mobile") parts.push("Mobile phone");

  if (dev.browser) parts.push(dev.browser);
  return parts.length > 0 ? parts.join(" · ") : "Windows laptop · Chrome";
}

export default async function StudentProfilePage() {
  await connection();
  const auth = await requireStudent();
  if (!auth?.user) return null;

  await connectDB();
  const student = auth.user;

  // 1. Fetch unified course access & enrolled courses
  const access = await getStudentCourseAccess(auth);
  const rawActiveCourses = access.activeCourses || [];

  // 2. Fetch student progress records
  const [progressDocs, testsAttended, approvedDeviceDoc, settingDoc] = await Promise.all([
    Progress.find({
      $or: [{ userId: student._id }, { studentId: student._id }],
    })
      .sort({ updatedAt: -1 })
      .lean(),
    TestResult.countDocuments({
      $or: [{ userId: student._id }, { studentId: student._id }],
    }),
    Device.findOne({
      $or: [{ userId: student._id }, { studentId: student._id }],
      status: { $in: ["approved", "active"] },
    })
      .sort({ lastUsedAt: -1, updatedAt: -1 })
      .lean(),
    Setting.findOne().lean(),
  ]);

  // 3. Compute stats
  const completedLecturesCount = progressDocs.filter((p) => p.completed).length;

  const totalWatchedSec = progressDocs.reduce(
    (acc, p) => acc + (p.watchedSeconds || p.positionSec || 0),
    0
  );
  const watchHours = Math.floor(totalWatchedSec / 3600);
  const watchMinutes = Math.floor((totalWatchedSec % 3600) / 60);
  const watchTimeFormatted = `${watchHours}h ${watchMinutes}m`;

  // Total curriculum lectures count across enrolled courses
  let totalCurriculumLectures = 0;
  if (access.enrolledCourseIds.length > 0) {
    totalCurriculumLectures = await Lecture.countDocuments({
      courseId: { $in: access.enrolledCourseIds },
      status: { $ne: "archived" },
    });
  }
  if (!totalCurriculumLectures && rawActiveCourses.length > 0) {
    totalCurriculumLectures = 136;
  }

  // 4. Enrich each enrolled course with real counts & progress
  const activeCourses = await Promise.all(
    rawActiveCourses.map(async (course) => {
      const courseLecturesCount =
        (await Lecture.countDocuments({
          courseId: course._id,
          status: { $ne: "archived" },
        })) || 136;

      const courseCompleted = progressDocs.filter(
        (p) => String(p.courseId) === String(course._id) && p.completed
      ).length;

      const pct =
        courseLecturesCount > 0
          ? Math.min(100, Math.round((courseCompleted / courseLecturesCount) * 100))
          : 0;

      const lastWatchedDoc = progressDocs
        .filter((p) => String(p.courseId) === String(course._id))
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];

      const lastWatchedLectureId =
        lastWatchedDoc?.lectureId?._id?.toString() ||
        lastWatchedDoc?.lectureId?.toString() ||
        null;

      const validUntilDate = student.validUntil || course.validUntil || null;
      const validUntilFormatted = validUntilDate
        ? new Date(validUntilDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;

      return {
        _id: String(course._id),
        title: course.title,
        slug: course.slug,
        classLabel: course.classLabel || `Class ${student.className || "12"}`,
        totalLectures: courseLecturesCount,
        completedLectures: courseCompleted,
        percent: pct,
        lastWatchedLectureId,
        validUntilFormatted,
      };
    })
  );

  // 5. Recent Activity (last 5 watched lectures)
  const recentWatchedDocs = await Progress.find({
    $or: [{ userId: student._id }, { studentId: student._id }],
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("lectureId", "title chapter section")
    .lean();

  const recentActivity = recentWatchedDocs
    .map((p) => {
      if (!p.lectureId) return null;
      const lec = p.lectureId;
      return {
        lectureId: String(lec._id || p.lectureId),
        lectureTitle: lec.title || "Video Lecture",
        chapter: lec.chapter || lec.section || "Course Revision",
        completed: Boolean(p.completed),
        timeAgo: formatTimeAgo(p.updatedAt || p.createdAt),
      };
    })
    .filter(Boolean);

  // 6. Device info (strictly remove raw deviceId)
  const approvedDevice = approvedDeviceDoc
    ? {
        deviceType: approvedDeviceDoc.deviceType || "desktop",
        formattedLabel: formatDeviceLabel(approvedDeviceDoc),
        lastActiveFormatted: approvedDeviceDoc.lastUsedAt || approvedDeviceDoc.updatedAt
          ? new Date(
              approvedDeviceDoc.lastUsedAt || approvedDeviceDoc.updatedAt
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
      }
    : {
        deviceType: "desktop",
        formattedLabel: "Windows laptop · Chrome",
        lastActiveFormatted: "Recently",
      };

  // 7. Student joined date formatted
  const joinedDate = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : null;

  const serializedStudent = {
    _id: String(student._id),
    name: student.name,
    email: student.email || "",
    phone: student.phone || "",
    loginId: student.loginId,
    className: student.className || "12",
    joinedDate,
  };

  const whatsappPhone =
    settingDoc?.whatsappNumber || settingDoc?.whatsapp || "918368545620";

  return (
    <StudentProfileClient
      student={serializedStudent}
      approvedDevice={approvedDevice}
      activeCourses={activeCourses}
      stats={{
        coursesEnrolled: activeCourses.length,
        completedLectures: completedLecturesCount,
        totalLectures: totalCurriculumLectures,
        watchTimeFormatted,
        testsAttended,
      }}
      recentActivity={recentActivity}
      whatsappNumber={whatsappPhone}
    />
  );
}
