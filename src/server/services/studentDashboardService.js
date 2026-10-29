import "server-only";
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
import { cloudinary } from "@/lib/cloudinary";

export async function getStudentDashboardData(userId) {
  await connectDB();
  const now = new Date();

  const user = await User.findById(userId).lean();
  if (!user) return null;

  // 1. Active enrollments
  const enrollments = await Enrollment.find({
    userId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("-paymentNote")
    .populate("courseId", "title slug published thumbnail targetScore rewardTargetText validUntil")
    .lean();

  const activeCourses = enrollments
    .map((e) => e.courseId)
    .filter((c) => c && c.published);

  const activeCourseIds = activeCourses.map((c) => c._id);
  const stringCourseIds = activeCourseIds.map((id) => id.toString());

  // Earliest expiry date
  let earliestExpiry = null;
  for (const e of enrollments) {
    if (e.expiresAt) {
      if (!earliestExpiry || new Date(e.expiresAt) < new Date(earliestExpiry)) {
        earliestExpiry = e.expiresAt;
      }
    }
  }

  // 2. Settings (strictly do not invent fake reward text)
  const settings = await Setting.findOne().lean();

  // 3. Announcement (active for all or enrolled courseIds, prioritized by pinned)
  const announcement = await Announcement.findOne({
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
    .sort({ pinned: -1, createdAt: -1, startsAt: -1 })
    .lean();

  // 4. Resume Revision (Latest progress on unfinished lecture or latest watched)
  let resume = null;
  let firstLectureId = null;

  if (activeCourseIds.length > 0) {
    // Check first lecture in case nothing has been watched
    const firstLecture = await Lecture.findOne({
      courseId: { $in: activeCourseIds },
      published: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .select("_id")
      .lean();

    if (firstLecture) {
      firstLectureId = firstLecture._id.toString();
    }

    const latestProgress = await Progress.findOne({
      userId,
      courseId: { $in: activeCourseIds },
      completed: false,
    })
      .sort({ updatedAt: -1 })
      .populate("lectureId", "title section chapter order durationSec published")
      .populate("courseId", "title slug published")
      .lean();

    const fallbackProgress = !latestProgress
      ? await Progress.findOne({
          userId,
          courseId: { $in: activeCourseIds },
        })
          .sort({ updatedAt: -1 })
          .populate("lectureId", "title section chapter order durationSec published")
          .populate("courseId", "title slug published")
          .lean()
      : null;

    const chosen = latestProgress || fallbackProgress;

    if (chosen?.lectureId?.published && chosen?.courseId?.published) {
      const courseLecturesCount = await Lecture.countDocuments({
        courseId: chosen.courseId._id,
        published: true,
      });

      const dur = chosen.durationSec || chosen.lectureId.durationSec || 2520;
      const pos = chosen.positionSec || 0;
      const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
      const chapterLabel =
        chosen.lectureId.chapter || chosen.lectureId.section || "Chapter Revision";

      resume = {
        lectureId: chosen.lectureId._id.toString(),
        lectureTitle: chosen.lectureId.title,
        section: chapterLabel,
        chapterPath: `${chosen.courseId.title} > ${chapterLabel}`,
        courseId: chosen.courseId._id.toString(),
        courseTitle: chosen.courseId.title,
        courseSlug: chosen.courseId.slug,
        positionSec: pos,
        durationSec: dur,
        percent: pct,
        bookmarked: Boolean(chosen.bookmarked),
        totalCourseLectures: courseLecturesCount,
      };
    }
  }

  // 5. Syllabus Coverage across all active courses
  let totalPublishedLectures = 0;
  let completedLectures = 0;
  if (activeCourseIds.length > 0) {
    totalPublishedLectures = await Lecture.countDocuments({
      courseId: { $in: activeCourseIds },
      published: true,
    });

    completedLectures = await Progress.countDocuments({
      userId,
      courseId: { $in: activeCourseIds },
      completed: true,
    });
  }

  const coveragePercent =
    totalPublishedLectures > 0
      ? Math.min(100, Math.round((completedLectures / totalPublishedLectures) * 100))
      : 0;

  // 6. Test results stats & upcoming tests count
  const testResults = await TestResult.find({ userId }).lean();
  let testsCount = testResults.length;
  let avgTestScore = 0;
  if (testsCount > 0) {
    const totalScorePct = testResults.reduce(
      (sum, r) => sum + (r.score / (r.maxScore || 100)) * 100,
      0
    );
    avgTestScore = (totalScorePct / testsCount).toFixed(1);
  }

  const testFilter = {
    published: true,
    startsAt: { $gte: now },
    $or: [
      { courseId: { $in: activeCourseIds } },
      { courseId: { $in: [null, undefined] }, className: { $in: ["All", user.className || "12"] } },
    ],
  };

  const upcomingTestsCount = await Test.countDocuments(testFilter);

  // 7. Next Upcoming Test
  const upcomingTest = await Test.findOne(testFilter)
    .sort({ startsAt: 1 })
    .lean();

  // 8. Recent Notes / Handouts
  let recentNotes = [];
  let totalNotesCount = 0;
  if (activeCourseIds.length > 0) {
    totalNotesCount = await Note.countDocuments({
      $or: [
        { courseId: { $in: activeCourseIds } },
        { courseIds: { $in: activeCourseIds } },
      ],
      published: true,
    });

    const notesDocs = await Note.find({
      $or: [
        { courseId: { $in: activeCourseIds } },
        { courseIds: { $in: activeCourseIds } },
      ],
      published: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentNotes = notesDocs.map((n) => {
      let viewUrl = n.source === "link" && n.externalUrl
        ? n.externalUrl
        : `/api/notes/${n._id}/stream`;
      let downloadUrl = n.source === "link" && n.externalUrl
        ? n.externalUrl
        : `/api/notes/${n._id}/stream?download=1`;

      if (process.env.CLOUDINARY_API_SECRET && n.publicId) {
        try {
          const expiresAt = Math.floor(Date.now() / 1000) + 7200;
          downloadUrl = cloudinary.utils.private_download_url(n.publicId, "pdf", {
            expires_at: expiresAt,
            attachment: true,
          });
          viewUrl = cloudinary.utils.private_download_url(n.publicId, "pdf", {
            expires_at: expiresAt,
            attachment: false,
          });
        } catch {
          // fallback to stream endpoint
        }
      }

      const sizeBytes = n.sizeBytes || n.fileSize || 0;
      const sizeStr = sizeBytes
        ? sizeBytes < 1024 * 1024
          ? `${Math.round(sizeBytes / 1024)} KB`
          : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : "PDF Document";

      return {
        _id: n._id.toString(),
        title: n.title,
        book: n.book || n.section || "Accountancy",
        section: n.section || "Chapter Handout",
        pageCount: n.pageCount,
        fileSize: sizeBytes,
        size: sizeStr,
        viewUrl,
        downloadUrl,
      };
    });
  }

  const primaryCourse = activeCourses[0] || null;
  const courseReward = (primaryCourse?.rewardTargetText && primaryCourse.rewardTargetText.trim()) || null;
  const courseTarget = (primaryCourse?.targetScore && primaryCourse.targetScore.trim()) || null;
  // Strictly only show validUntil if configured on the course by admin; otherwise null
  const courseValidity = primaryCourse?.validUntil
    ? new Date(primaryCourse.validUntil).toISOString()
    : null;

  return {
    student: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      className: user.className || "12",
      phone: user.phone || "",
    },
    activeCourses: activeCourses.map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
    })),
    earliestExpiry: earliestExpiry ? earliestExpiry.toISOString() : null,
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
      courseTitle: primaryCourse?.title || "Board Preparation",
      totalLectures: totalPublishedLectures,
      completedLectures,
      percent: coveragePercent,
      rewardTargetText: courseReward,
      targetScore: courseTarget,
      earliestExpiry: courseValidity,
    },
    stats: {
      lecturesWatched: {
        completed: completedLectures,
        total: totalPublishedLectures,
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
