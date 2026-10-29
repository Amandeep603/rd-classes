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
import { cloudinary } from "@/lib/cloudinary";

export async function getStudentDashboardData(userId, selectedCourseId = null) {
  await connectDB();
  const now = new Date();

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : user._id;
  const userStrId = String(user._id || userId);

  // 1. Query enrollments using both ObjectId and string matches
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
    .select("-paymentNote")
    .populate("courseId", "title slug status published thumbnail targetScore rewardTargetText validUntil")
    .lean();

  // Also collect course IDs from user.courses, user.enrolledCourses and user.savedCourses
  const userCourseList = [];
  if (Array.isArray(user.courses)) {
    for (const c of user.courses) {
      if (c) userCourseList.push(c._id ? String(c._id) : String(c));
    }
  }
  if (Array.isArray(user.enrolledCourses)) {
    for (const c of user.enrolledCourses) {
      if (c) userCourseList.push(c._id ? String(c._id) : String(c));
    }
  }
  if (Array.isArray(user.savedCourses)) {
    for (const c of user.savedCourses) {
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
        .select("title slug status published thumbnail targetScore rewardTargetText validUntil")
        .lean();
    }
  }

  // Combine and deduplicate courses using String(a._id) === String(b._id)
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

  // Server-side logging for lecture counts per enrolled course
  for (const c of activeCourses) {
    const count = await Lecture.countDocuments({
      courseId: c._id,
      status: { $ne: "archived" },
    });
    console.log(`[Dashboard] Course "${c.title}" (${c._id}): ${count} lectures found`);
  }

  const activeCourseIds = activeCourses.map((c) => c._id);
  const stringCourseIds = activeCourseIds.map((id) => String(id));

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
  const dismissedIds = (user.dismissedAnnouncementIds || []).map((id) => id.toString());
  const announcement = await Announcement.findOne({
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
      status: { $ne: "archived" },
    })
      .sort({ position: 1, order: 1, createdAt: 1 })
      .populate("bookId", "title position")
      .populate("chapterId", "title position")
      .populate("courseId", "title slug published")
      .lean();

    if (firstLecture) {
      firstLectureId = firstLecture._id.toString();
    }

    const latestProgress = await Progress.findOne({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      courseId: { $in: activeCourseIds },
      completed: false,
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: "lectureId",
        select: "title section chapter order durationSec durationSeconds position status published bookId chapterId",
        populate: [
          { path: "bookId", select: "title position" },
          { path: "chapterId", select: "title position" },
        ],
      })
      .populate("courseId", "title slug published")
      .lean();

    const fallbackProgress = !latestProgress
      ? await Progress.findOne({
          $or: [{ userId: userObjId }, { studentId: userObjId }],
          courseId: { $in: activeCourseIds },
        })
          .sort({ updatedAt: -1 })
          .populate({
            path: "lectureId",
            select: "title section chapter order durationSec durationSeconds position status published bookId chapterId",
            populate: [
              { path: "bookId", select: "title position" },
              { path: "chapterId", select: "title position" },
            ],
          })
          .populate("courseId", "title slug published")
          .lean()
      : null;

    const chosen = latestProgress || fallbackProgress;

    const isLecPublished = (lec) =>
      Boolean(lec && lec.status !== "archived");

    if (chosen?.lectureId && isLecPublished(chosen.lectureId) && (chosen?.courseId?.status !== "archived")) {
      const courseLecturesCount = await Lecture.countDocuments({
        courseId: chosen.courseId._id,
        status: { $ne: "archived" },
      });

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
        chapterPath = `${chosen.courseId.title} · ${lec.section || "Chapter Revision"}`;
      }

      resume = {
        lectureId: lec._id.toString(),
        lectureTitle: lec.title,
        section: lec.chapter || lec.section || "Chapter Revision",
        chapterPath,
        courseId: chosen.courseId._id.toString(),
        courseTitle: chosen.courseId.title,
        courseSlug: chosen.courseId.slug,
        positionSec: pos,
        durationSec: dur,
        percent: pct,
        bookmarked: Boolean(chosen.bookmarked),
        totalCourseLectures: courseLecturesCount,
      };
    } else if (firstLecture && isLecPublished(firstLecture)) {
      const courseLecturesCount = await Lecture.countDocuments({
        courseId: firstLecture.courseId?._id || activeCourseIds[0],
        status: { $ne: "archived" },
      });

      const dur = firstLecture.durationSec || firstLecture.durationSeconds || 2520;
      let chapterPath = "";
      if (firstLecture.bookId?.title && firstLecture.chapterId?.title) {
        chapterPath = `Book ${firstLecture.bookId.position || 1}: ${firstLecture.bookId.title} · Chapter ${firstLecture.chapterId.position || 1}: ${firstLecture.chapterId.title}`;
      } else if (firstLecture.book || firstLecture.chapter) {
        chapterPath = `${firstLecture.book ? (firstLecture.book.toLowerCase().startsWith("book") ? firstLecture.book : `Book: ${firstLecture.book}`) : "Book"} · ${firstLecture.chapter ? (firstLecture.chapter.toLowerCase().startsWith("chapter") ? firstLecture.chapter : `Chapter: ${firstLecture.chapter}`) : firstLecture.section || "Chapter Revision"}`;
      } else {
        chapterPath = `${firstLecture.courseId?.title || "Accountancy"} · ${firstLecture.section || "Chapter Revision"}`;
      }

      resume = {
        lectureId: firstLecture._id.toString(),
        lectureTitle: firstLecture.title,
        section: firstLecture.chapter || firstLecture.section || "Chapter Revision",
        chapterPath,
        courseId: (firstLecture.courseId?._id || activeCourseIds[0]).toString(),
        courseTitle: firstLecture.courseId?.title || "Comprehensive Accountancy",
        courseSlug: firstLecture.courseId?.slug || "",
        positionSec: 0,
        durationSec: dur,
        percent: 0,
        bookmarked: false,
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
      status: { $ne: "archived" },
    });

    completedLectures = await Progress.countDocuments({
      $or: [{ userId: userObjId }, { studentId: userObjId }],
      courseId: { $in: activeCourseIds },
      completed: true,
    });
  }

  const coveragePercent =
    totalPublishedLectures > 0
      ? Math.min(100, Math.round((completedLectures / totalPublishedLectures) * 100))
      : 0;

  if (activeCourses.length > 0 && totalPublishedLectures === 0 && !resume) {
    const pCourse = activeCourses[0];
    resume = {
      hasNoLectures: true,
      courseId: pCourse ? pCourse._id.toString() : (activeCourseIds[0] ? activeCourseIds[0].toString() : ""),
      courseTitle: pCourse ? pCourse.title : "Comprehensive Accountancy",
      courseSlug: pCourse ? pCourse.slug : "",
      lectureTitle: "No lectures uploaded yet",
      chapterPath: "New lectures will appear here as soon as RD Classes uploads them.",
      positionSec: 0,
      durationSec: 0,
      percent: 0,
      totalCourseLectures: 0,
      bookmarked: false,
    };
  }

  // 6. Test results stats & upcoming tests count
  const testResults = await TestResult.find({
    $or: [{ userId: userObjId }, { studentId: userObjId }],
  }).lean();
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
  // "Valid until" comes from user.validUntil || primaryCourse.validUntil || earliestExpiry. If missing, null.
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
