import "server-only";
import connectDB from "../db/connect.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Course } from "../db/models/Course.js";
import { Lecture } from "../db/models/Lecture.js";
import { Progress } from "../db/models/Progress.js";
import { Announcement } from "../db/models/Announcement.js";
import { Test } from "../db/models/Test.js";
import { TestResult } from "../db/models/TestResult.js";
import { Settings } from "../db/models/Settings.js";
import { User } from "../db/models/User.js";

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
    .populate("courseId", "title slug published thumbnail")
    .lean();


  const activeCourses = enrollments
    .map((e) => e.courseId)
    .filter((c) => c && c.published);

  const activeCourseIds = activeCourses.map((c) => c._id);

  // Earliest expiry date
  let earliestExpiry = null;
  for (const e of enrollments) {
    if (e.expiresAt) {
      if (!earliestExpiry || new Date(e.expiresAt) < new Date(earliestExpiry)) {
        earliestExpiry = e.expiresAt;
      }
    }
  }

  // 2. Settings
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = {
      workspaceName: "Ronak Sir Workspace",
      whatsappNumber: "+91 99999 99999",
      rewardTargetText: "₹5,100 Cash Reward Target",
    };
  }

  // 3. Announcement (active for all or enrolled courseIds)
  const announcement = await Announcement.findOne({
    active: true,
    startsAt: { $lte: now },
    $and: [
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      {
        $or: [
          { "audience.all": true },
          { "audience.courseIds": { $in: activeCourseIds } },
        ],
      },
    ],
  })
    .sort({ startsAt: -1 })
    .lean();


  // 4. Resume Revision (Latest progress on unfinished lecture or latest watched)
  let resume = null;
  if (activeCourseIds.length > 0) {
    const latestProgress = await Progress.findOne({
      userId,
      courseId: { $in: activeCourseIds },
      completed: false,
    })
      .sort({ updatedAt: -1 })
      .populate("lectureId", "title section order durationSec published")
      .populate("courseId", "title slug published")
      .lean();

    const fallbackProgress = !latestProgress
      ? await Progress.findOne({
          userId,
          courseId: { $in: activeCourseIds },
        })
          .sort({ updatedAt: -1 })
          .populate("lectureId", "title section order durationSec published")
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

      resume = {
        lectureId: chosen.lectureId._id.toString(),
        lectureTitle: chosen.lectureId.title,
        section: chosen.lectureId.section || "Chapter Revision",
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

  // 6. Test results stats
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

  // 7. Next Upcoming Test
  const upcomingTest = await Test.findOne({
    published: true,
    startsAt: { $gte: now },
    $or: [
      { className: "All" },
      { className: user.className || "12" },
      { courseId: { $in: activeCourseIds } },
    ],
  })
    .sort({ startsAt: 1 })
    .lean();

  return {
    student: {
      _id: user._id.toString(),
      name: user.name,
      studentCode: user.studentCode || "",
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
    syllabus: {
      totalLectures: totalPublishedLectures,
      completedLectures,
      percent: coveragePercent,
      rewardTargetText: settings.rewardTargetText || "₹5,100 Cash Reward Target",
      earliestExpiry: earliestExpiry ? earliestExpiry.toISOString() : null,
    },
    stats: {
      lecturesWatched: {
        completed: completedLectures,
        total: totalPublishedLectures,
      },
      tests: {
        count: testsCount,
        avgScore: avgTestScore,
      },
    },
    upcomingTest: upcomingTest
      ? {
          _id: upcomingTest._id.toString(),
          title: upcomingTest.title,
          kind: upcomingTest.kind || "Sunday Mock",
          startsAt: upcomingTest.startsAt.toISOString(),
          durationMin: upcomingTest.durationMin || 180,
          syllabus: upcomingTest.syllabus || "",
          venue: upcomingTest.venue || "RD Classes, Sector 9 Centre",
        }
      : null,
  };
}
