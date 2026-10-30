import "server-only";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Course } from "../db/models/Course.js";
import { Lecture } from "../db/models/Lecture.js";
import { Progress } from "../db/models/Progress.js";
import { Announcement } from "../db/models/Announcement.js";
import { Test } from "../db/models/Test.js";
import { TestResult } from "../db/models/TestResult.js";
import { Settings as Setting } from "../db/models/Settings.js";
import { Note } from "../db/models/Note.js";
import { User } from "../db/models/User.js";
import { getStudentCourseAccess } from "./studentAccessService.js";

export async function getStudentDashboardData(userId, selectedCourseId = null) {
  await connectDB();
  const now = new Date();

  // 1. Single source of truth for student course access
  const access = await getStudentCourseAccess(userId);
  if (!access.authenticated || !access.student) return null;

  const user = access.student;
  const userObjId = mongoose.isValidObjectId(user._id) ? new mongoose.Types.ObjectId(user._id) : null;
  const userStrId = String(user._id);

  // Active courses from single source of truth
  const activeCourses = [...access.activeCourses];

  // If a specific course is selected, prioritize it as activeCourses[0]
  if (selectedCourseId && activeCourses.length > 1) {
    const target = String(selectedCourseId).toLowerCase();
    const idx = activeCourses.findIndex(
      (c) => String(c._id).toLowerCase() === target || (c.slug && c.slug.toLowerCase() === target)
    );
    if (idx > 0) {
      const [chosenCourse] = activeCourses.splice(idx, 1);
      activeCourses.unshift(chosenCourse);
    }
  }

  // Selected primary course
  const primaryCourse = activeCourses[0] || null;
  const primaryCourseId = primaryCourse ? primaryCourse._id : null;
  const primaryCourseObjId = primaryCourseId && mongoose.isValidObjectId(primaryCourseId)
    ? new mongoose.Types.ObjectId(primaryCourseId)
    : null;

  // Earliest expiry date from enrollments
  let earliestExpiry = user.validUntil || null;
  if (!earliestExpiry && access.enrolledCourseIds.length > 0) {
    const enr = await Enrollment.findOne({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      status: { $ne: "cancelled" },
      expiresAt: { $ne: null },
    })
      .sort({ expiresAt: 1 })
      .lean();
    if (enr?.expiresAt) earliestExpiry = enr.expiresAt;
  }

  // 2. Settings (strictly do not invent fake reward text)
  const settings = await Setting.findOne().lean();

  // 3. Announcement (active for all or primary course)
  const announcementQuery = {
    _id: { $nin: user.dismissedAnnouncementIds || [] },
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
    ],
  };

  if (primaryCourseId) {
    announcementQuery.$and.push({
      $or: [
        { audience: "all" },
        { "audience.all": true },
        { audience: primaryCourseId },
        { audience: primaryCourseObjId },
        { "audience.courseIds": primaryCourseId },
        { "audience.courseIds": primaryCourseObjId },
      ],
    });
  } else {
    announcementQuery.$and.push({
      $or: [{ audience: "all" }, { "audience.all": true }],
    });
  }

  const announcement = await Announcement.findOne(announcementQuery)
    .sort({ pinned: -1, createdAt: -1, startsAt: -1 })
    .lean();

  // 4. Resume Revision (computed per selected primary course)
  let resume = null;
  let firstLectureId = null;
  let totalCurriculumLectures = 0;

  if (primaryCourseId) {
    totalCurriculumLectures = await Lecture.countDocuments({
      courseId: primaryCourseObjId || primaryCourseId,
      status: { $ne: "archived" },
    });

    // First playable lecture in course (must have video link)
    const firstPlayable = await Lecture.findOne({
      courseId: primaryCourseObjId || primaryCourseId,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
    })
      .sort({ position: 1, order: 1, createdAt: 1 })
      .populate("bookId", "title position")
      .populate("chapterId", "title position")
      .lean();

    if (firstPlayable) {
      firstLectureId = firstPlayable._id.toString();
    }

    // Latest unfinished progress for selected course
    const latestProgress = await Progress.findOne({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      courseId: primaryCourseObjId || primaryCourseId,
      completed: false,
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: "lectureId",
        select: "title section chapter order durationSec durationSeconds position status published bookId chapterId vimeoId",
        populate: [
          { path: "bookId", select: "title position" },
          { path: "chapterId", select: "title position" },
        ],
      })
      .lean();

    const fallbackProgress = !latestProgress
      ? await Progress.findOne({
          $or: [{ userId: userObjId }, { studentId: userObjId }],
          courseId: primaryCourseObjId || primaryCourseId,
        })
          .sort({ updatedAt: -1 })
          .populate({
            path: "lectureId",
            select: "title section chapter order durationSec durationSeconds position status published bookId chapterId vimeoId",
            populate: [
              { path: "bookId", select: "title position" },
              { path: "chapterId", select: "title position" },
            ],
          })
          .lean()
      : null;

    const chosen = latestProgress || fallbackProgress;
    const isLecPublished = (lec) => Boolean(lec && lec.status !== "archived");

    if (chosen?.lectureId && isLecPublished(chosen.lectureId)) {
      const dur = chosen.durationSec || chosen.lectureId.durationSec || chosen.lectureId.durationSeconds || 2520;
      const pos = chosen.positionSec || 0;
      const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
      const lec = chosen.lectureId;

      let chapterPath = "";
      if (lec.bookId?.title && lec.chapterId?.title) {
        chapterPath = `Book ${lec.bookId.position || 1}: ${lec.bookId.title} · Chapter ${lec.chapterId.position || 1}: ${lec.chapterId.title}`;
      } else if (lec.book || lec.chapter) {
        chapterPath = `${lec.book ? (lec.book.toLowerCase().startsWith("book") ? lec.book : `Book: ${lec.book}`) : "Book"} · ${lec.chapter ? (lec.chapter.toLowerCase().startsWith("chapter") ? lec.chapter : `Chapter: ${lec.chapter}`) : lec.section || "Chapter Revision"}`;
      } else {
        chapterPath = `${primaryCourse.title} · ${lec.section || "Chapter Revision"}`;
      }

      resume = {
        lectureId: lec._id.toString(),
        lectureTitle: lec.title,
        section: lec.chapter || lec.section || "Chapter Revision",
        chapterPath,
        courseId: primaryCourse._id,
        courseTitle: primaryCourse.title,
        courseSlug: primaryCourse.slug,
        positionSec: pos,
        durationSec: dur,
        percent: pct,
        bookmarked: Boolean(chosen.bookmarked),
        totalCourseLectures: totalCurriculumLectures,
      };
    } else if (firstPlayable) {
      const dur = firstPlayable.durationSec || firstPlayable.durationSeconds || 2520;
      let chapterPath = "";
      if (firstPlayable.bookId?.title && firstPlayable.chapterId?.title) {
        chapterPath = `Book ${firstPlayable.bookId.position || 1}: ${firstPlayable.bookId.title} · Chapter ${firstPlayable.chapterId.position || 1}: ${firstPlayable.chapterId.title}`;
      } else if (firstPlayable.book || firstPlayable.chapter) {
        chapterPath = `${firstPlayable.book ? (firstPlayable.book.toLowerCase().startsWith("book") ? firstPlayable.book : `Book: ${firstPlayable.book}`) : "Book"} · ${firstPlayable.chapter ? (firstPlayable.chapter.toLowerCase().startsWith("chapter") ? firstPlayable.chapter : `Chapter: ${firstPlayable.chapter}`) : firstPlayable.section || "Chapter Revision"}`;
      } else {
        chapterPath = `${primaryCourse.title} · ${firstPlayable.section || "Chapter Revision"}`;
      }

      resume = {
        lectureId: firstPlayable._id.toString(),
        lectureTitle: firstPlayable.title,
        section: firstPlayable.chapter || firstPlayable.section || "Chapter Revision",
        chapterPath,
        courseId: primaryCourse._id,
        courseTitle: primaryCourse.title,
        courseSlug: primaryCourse.slug,
        positionSec: 0,
        durationSec: dur,
        percent: 0,
        bookmarked: false,
        totalCourseLectures: totalCurriculumLectures,
      };
    }
  }

  // 5. Syllabus Coverage computed PER SELECTED COURSE
  let totalWithVideo = 0;
  let completedLectures = 0;

  if (primaryCourseId) {
    totalWithVideo = await Lecture.countDocuments({
      courseId: primaryCourseObjId || primaryCourseId,
      vimeoId: { $exists: true, $ne: "" },
      status: { $ne: "archived" },
    });

    const completedProgressDocs = await Progress.find({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      courseId: primaryCourseObjId || primaryCourseId,
      completed: true,
    })
      .select("lectureId")
      .lean();

    completedLectures = completedProgressDocs.length;
  }

  // Exclude "Coming soon" (lectures without video) from coverage denominator
  const coveragePercent =
    totalWithVideo > 0
      ? Math.min(100, Math.round((completedLectures / totalWithVideo) * 100))
      : 0;

  // 6. Notes / Handouts count for selected course
  let totalNotesCount = 0;
  let recentNotes = [];

  if (primaryCourseId) {
    totalNotesCount = await Note.countDocuments({
      $or: [
        { courseId: primaryCourseObjId || primaryCourseId },
        { courseIds: primaryCourseObjId || primaryCourseId },
      ],
      published: true,
      status: { $ne: "archived" },
    });

    const rawRecentNotes = await Note.find({
      $or: [
        { courseId: primaryCourseObjId || primaryCourseId },
        { courseIds: primaryCourseObjId || primaryCourseId },
      ],
      published: true,
      status: { $ne: "archived" },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentNotes = rawRecentNotes.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      fileSize: n.fileSize ? `${(n.fileSize / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB",
      bookTitle: n.book || n.section || primaryCourse.title,
      viewUrl: `/student/notes?view=${n._id}`,
      downloadUrl: `/api/student/notes/${n._id}/download`,
    }));
  }

  // 7. Tests & Test Results for selected course
  let testsCount = 0;
  let avgTestScore = null;
  let upcomingTest = null;
  let upcomingTestsCount = 0;

  if (primaryCourseId) {
    const testResults = await TestResult.find({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      courseId: primaryCourseObjId || primaryCourseId,
    })
      .select("score percentage status")
      .lean();

    testsCount = testResults.length;
    if (testsCount > 0) {
      const sum = testResults.reduce((acc, t) => acc + (t.percentage || t.score || 0), 0);
      avgTestScore = (sum / testsCount).toFixed(1);
    }

    upcomingTest = await Test.findOne({
      $or: [
        { courseId: primaryCourseObjId || primaryCourseId },
        { courseIds: primaryCourseObjId || primaryCourseId },
        { audience: "all" },
      ],
      startsAt: { $gte: now },
      published: true,
    })
      .sort({ startsAt: 1 })
      .lean();

    upcomingTestsCount = await Test.countDocuments({
      $or: [
        { courseId: primaryCourseObjId || primaryCourseId },
        { courseIds: primaryCourseObjId || primaryCourseId },
        { audience: "all" },
      ],
      startsAt: { $gte: now },
      published: true,
    });
  }

  const courseReward = (primaryCourse?.rewardTargetText && primaryCourse.rewardTargetText.trim()) || null;
  const courseTarget = (primaryCourse?.targetScore && primaryCourse.targetScore.trim()) || null;
  const rawValidity = user.validUntil || primaryCourse?.validUntil || earliestExpiry || null;
  const courseValidity = rawValidity
    ? new Date(rawValidity).toISOString()
    : null;

  return {
    student: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      className: user.className || "12",
      phone: user.phone || "",
    },
    primaryCourse: primaryCourse
      ? {
          _id: primaryCourse._id.toString(),
          title: primaryCourse.title,
          slug: primaryCourse.slug,
        }
      : null,
    isZeroCourses: activeCourses.length === 0,
    activeCourses: activeCourses.map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
    })),
    earliestExpiry: earliestExpiry ? new Date(earliestExpiry).toISOString() : null,
    announcement: announcement
      ? {
          _id: announcement._id.toString(),
          title: announcement.title,
          body: announcement.body,
          dismissible: announcement.dismissible !== false,
        }
      : null,
    resume,
    firstLectureId,
    syllabus: {
      courseTitle: primaryCourse?.title || "Class 12 Accountancy",
      totalLectures: totalWithVideo,
      completedLectures,
      percent: coveragePercent,
      rewardTargetText: courseReward,
      targetScore: courseTarget,
      earliestExpiry: courseValidity,
    },
    stats: {
      lecturesWatched: {
        completed: completedLectures,
        total: totalWithVideo,
      },
      handouts: {
        count: totalNotesCount,
      },
      tests: {
        count: testsCount > 0 ? testsCount : upcomingTestsCount,
        upcomingCount: upcomingTestsCount,
        completedCount: testsCount,
        avgScore: avgTestScore,
      },
    },
    whatsappNumber: settings?.whatsappNumber || settings?.whatsapp || "918368545620",
    recentNotes,
    upcomingTest: upcomingTest
      ? {
          _id: upcomingTest._id.toString(),
          title: upcomingTest.title,
          kind: upcomingTest.kind || "Sunday Mock",
          startsAt: upcomingTest.startsAt.toISOString(),
          durationMin: upcomingTest.durationMin || 180,
          syllabus: upcomingTest.syllabus || "",
          venue: upcomingTest.venue || "",
        }
      : null,
  };
}
