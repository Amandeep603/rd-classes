import "server-only";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { Lecture } from "../db/models/Lecture.js";
import { Course } from "../db/models/Course.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Progress } from "../db/models/Progress.js";
import { parseVimeoUrl } from "./vimeo.js";
import { logAuditEvent } from "./audit.js";
import { createAdminNotification } from "./notificationService.js";

/**
 * Server helper to determine if a lecture is free preview.
 * Rule:
 * 1. If any published lecture in courseLectures is explicitly marked as free (isFreePreview/freePreview/isPreview === true),
 *    then only those explicitly marked lectures are free (the auto rule stops).
 * 2. If NO lecture in courseLectures is marked free, the first published lecture (lowest book, chapter, position/order)
 *    is treated as free automatically.
 */
export function isLectureFree(lecture, courseLectures = []) {
  if (!lecture) return false;

  const isMarkedFree = (l) =>
    Boolean(l.isFreePreview || l.freePreview || l.isPreview);

  const hasAnyExplicitFree = courseLectures.some((l) => isMarkedFree(l));

  if (hasAnyExplicitFree) {
    return isMarkedFree(lecture);
  }

  // Auto-rule: When no free lecture is set, the first published lecture is free automatically
  const published = courseLectures
    .filter((l) => l.published !== false && l.status !== "draft")
    .sort((a, b) => {
      const bookA = (a.book || "").trim();
      const bookB = (b.book || "").trim();
      if (bookA && bookB && bookA !== bookB) {
        return bookA.localeCompare(bookB, undefined, { numeric: true });
      }
      const chapA = (a.chapter || a.section || "").trim();
      const chapB = (b.chapter || b.section || "").trim();
      if (chapA && chapB && chapA !== chapB) {
        return chapA.localeCompare(chapB, undefined, { numeric: true });
      }
      const posA = a.position !== undefined ? a.position : (a.order ?? 0);
      const posB = b.position !== undefined ? b.position : (b.order ?? 0);
      return posA - posB;
    });

  if (published.length > 0) {
    const firstPublished = published[0];
    const lecId = lecture._id ? lecture._id.toString() : lecture.id ? lecture.id.toString() : "";
    const firstId = firstPublished._id ? firstPublished._id.toString() : firstPublished.id ? firstPublished.id.toString() : "";
    if (lecId && firstId && lecId === firstId) {
      return true;
    }
  }

  return isMarkedFree(lecture);
}

/**
 * Returns all lectures for a course (admin view).
 */
export async function getAdminLecturesByCourse(courseId) {
  await connectDB();
  const lectures = await Lecture.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean();
  return lectures.map((lec) => ({
    ...lec,
    isFreePreview: isLectureFree(lec, lectures),
  }));
}

/**
 * Automatically ensures the lowest order published lecture is marked as freePreview,
 * unless overridden by an admin. Also keeps isPreview synchronized.
 */
export async function syncCourseFreePreview(courseId) {
  if (!courseId) return;
  await connectDB();
  const publishedLectures = await Lecture.find({ courseId, published: true })
    .sort({ order: 1, createdAt: 1 });

  if (publishedLectures.length === 0) return;

  const hasFree = publishedLectures.some((lec) => lec.freePreview);

  if (!hasFree) {
    const firstLec = publishedLectures[0];
    firstLec.freePreview = true;
    firstLec.isPreview = true;
    await firstLec.save();
  }
}

/**
 * Creates a lecture inside a course.
 */
export async function createLecture(data, adminId) {
  await connectDB();
  const course = await Course.findById(data.courseId);
  if (!course) {
    throw new Error("Course not found.");
  }

  const { vimeoId, vimeoHash } = parseVimeoUrl(data.vimeoUrl || data.vimeoId);

  const highestOrder = await Lecture.findOne({ courseId: data.courseId })
    .sort({ order: -1 })
    .select("order")
    .lean();
  const nextOrder = (highestOrder?.order ?? -1) + 1;

  const hasExplicitFreeToggle =
    typeof data.freePreview === "boolean" || typeof data.isPreview === "boolean";
  const explicitFreeValue =
    typeof data.freePreview === "boolean"
      ? data.freePreview
      : typeof data.isPreview === "boolean"
      ? data.isPreview
      : false;

  const isPublished = typeof data.published === "boolean" ? data.published : true;

  // Auto-mark freePreview: true if this is the first published lecture of the course
  let isFree = hasExplicitFreeToggle ? explicitFreeValue : false;
  if (!hasExplicitFreeToggle && isPublished) {
    const existingCount = await Lecture.countDocuments({
      courseId: data.courseId,
      published: true,
    });
    if (existingCount === 0) {
      isFree = true;
    }
  }

  const lecture = await Lecture.create({
    courseId: data.courseId,
    section: (data.section || "General").trim(),
    title: data.title.trim(),
    order: typeof data.order === "number" ? data.order : nextOrder,
    vimeoId,
    vimeoHash: vimeoHash || data.vimeoHash || "",
    durationSec: Number(data.durationSec) || 0,
    description: (data.description || "").trim(),
    published: isPublished,
    freePreview: isFree,
    freePreviewOverridden: hasExplicitFreeToggle,
    isPreview: isFree,
  });

  await syncCourseFreePreview(data.courseId);

  await logAuditEvent({
    actorId: adminId,
    action: "lecture.created",
    targetType: "lecture",
    targetId: lecture._id.toString(),
    meta: { title: lecture.title, courseId: data.courseId },
  });

  await createAdminNotification({
    type: "lecture_added",
    title: "Lecture Added",
    message: `Lecture "${lecture.title}" added to "${course.title}"`,
    link: `/admin/courses/${course._id}`,
    entityId: lecture._id.toString(),
  });

  return lecture;
}

/**
 * Updates an existing lecture.
 */
export async function updateLecture(lectureId, data, adminId) {
  await connectDB();
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new Error("Lecture not found.");
  }

  if (data.title) lecture.title = data.title.trim();
  if (data.section) lecture.section = data.section.trim();
  if (data.vimeoUrl || data.vimeoId) {
    const { vimeoId, vimeoHash } = parseVimeoUrl(data.vimeoUrl || data.vimeoId);
    lecture.vimeoId = vimeoId;
    if (vimeoHash) lecture.vimeoHash = vimeoHash;
  }
  if (typeof data.vimeoHash === "string") lecture.vimeoHash = data.vimeoHash.trim();
  if (typeof data.durationSec === "number") lecture.durationSec = data.durationSec;
  if (typeof data.description === "string") lecture.description = data.description.trim();
  if (typeof data.published === "boolean") lecture.published = data.published;
  if (typeof data.freePreview === "boolean") {
    lecture.freePreview = data.freePreview;
    lecture.freePreviewOverridden = true;
    lecture.isPreview = data.freePreview;
  } else if (typeof data.isPreview === "boolean") {
    lecture.freePreview = data.isPreview;
    lecture.freePreviewOverridden = true;
    lecture.isPreview = data.isPreview;
  }
  if (typeof data.order === "number") lecture.order = data.order;

  await lecture.save();
  await syncCourseFreePreview(lecture.courseId);

  await logAuditEvent({
    actorId: adminId,
    action: "lecture.updated",
    targetType: "lecture",
    targetId: lectureId.toString(),
    meta: { title: lecture.title },
  });

  return lecture;
}

/**
 * Deletes a lecture and its progress entries.
 */
export async function deleteLecture(lectureId, adminId) {
  await connectDB();
  const lecture = await Lecture.findById(lectureId);
  const courseId = lecture?.courseId;
  await Progress.deleteMany({ lectureId });
  await Lecture.findByIdAndDelete(lectureId);

  if (courseId) {
    await syncCourseFreePreview(courseId);
  }

  await logAuditEvent({
    actorId: adminId,
    action: "lecture.deleted",
    targetType: "lecture",
    targetId: lectureId.toString(),
    meta: {},
  });

  return { success: true };
}

/**
 * Batch reorders lectures for a course.
 */
export async function reorderLectures(courseId, orderedIds, adminId) {
  await connectDB();
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, courseId },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Lecture.bulkWrite(bulkOps);
    await syncCourseFreePreview(courseId);
  }

  await logAuditEvent({
    actorId: adminId,
    action: "lectures.reordered",
    targetType: "course",
    targetId: courseId.toString(),
    meta: { count: orderedIds.length },
  });

  return { success: true };
}

/**
 * Returns grouped sections with lectures and student progress for a course view.
 */
export async function getCourseSyllabusForStudent(courseId, studentId) {
  await connectDB();
  const lectures = await Lecture.find({
    courseId,
    published: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const progressRecords = await Progress.find({
    userId: studentId,
    courseId,
  }).lean();

  const progressMap = new Map();
  for (const p of progressRecords) {
    progressMap.set(p.lectureId.toString(), p);
  }

  const sectionsMap = new Map();
  for (const lec of lectures) {
    const secName = lec.section || "General";
    if (!sectionsMap.has(secName)) {
      sectionsMap.set(secName, []);
    }
    const prog = progressMap.get(lec._id.toString());
    sectionsMap.get(secName).push({
      _id: lec._id.toString(),
      title: lec.title,
      order: lec.order,
      durationSec: lec.durationSec,
      freePreview: Boolean(lec.freePreview || lec.isPreview),
      isPreview: Boolean(lec.freePreview || lec.isPreview),
      completed: !!prog?.completed,
      positionSec: prog?.positionSec || 0,
    });
  }

  const sections = [];
  for (const [sectionTitle, lecs] of sectionsMap.entries()) {
    sections.push({
      title: sectionTitle,
      lectures: lecs,
    });
  }

  return sections;
}

/**
 * Authorizes and builds player details for a student.
 * Inaccessible lectures return null.
 */
export async function getAuthorizedLecture({ lectureId, studentId }) {
  await connectDB();

  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture || !lecture.published) {
    return null;
  }

  // Check enrollment or free preview using isLectureFree
  const allCourseLectures = await Lecture.find({
    courseId: lecture.courseId,
    published: true,
  }).lean();
  const isFree = isLectureFree(lecture, allCourseLectures);

  let enrollment = null;
  if (studentId) {
    const now = new Date();
    const studentIdObj = mongoose.Types.ObjectId.isValid(studentId)
      ? new mongoose.Types.ObjectId(studentId)
      : studentId;

    enrollment = await Enrollment.findOne({
      $and: [
        {
          $or: [
            { userId: studentIdObj },
            { studentId: studentIdObj },
            { userId: studentId },
            { studentId: studentId },
          ],
        },
        { courseId: lecture.courseId },
        { status: "active" },
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
      ],
    }).lean();
  }

  if (!enrollment && !isFree) {
    return null;
  }

  const course = await Course.findById(lecture.courseId).lean();
  if (!course || !course.published) {
    return null;
  }

  // Retrieve student's saved progress
  const progress = await Progress.findOne({
    userId: studentId,
    lectureId: lecture._id,
  }).lean();

  // Find previous and next published lectures in the same course
  const [prevLec, nextLec] = await Promise.all([
    Lecture.findOne({
      courseId: lecture.courseId,
      published: true,
      order: { $lt: lecture.order },
    })
      .sort({ order: -1 })
      .select("_id title")
      .lean(),
    Lecture.findOne({
      courseId: lecture.courseId,
      published: true,
      order: { $gt: lecture.order },
    })
      .sort({ order: 1 })
      .select("_id title")
      .lean(),
  ]);

  // Construct secure Vimeo iframe URL
  const hashParam = lecture.vimeoHash ? `h=${encodeURIComponent(lecture.vimeoHash)}&` : "";
  const playerUrl = `https://player.vimeo.com/video/${encodeURIComponent(
    lecture.vimeoId
  )}?${hashParam}dnt=1&title=0&byline=0&portrait=0&playsinline=1`;

  return {
    lecture: {
      _id: lecture._id.toString(),
      title: lecture.title,
      section: lecture.section,
      description: lecture.description,
      durationSec: lecture.durationSec,
      freePreview: isFree,
      isPreview: isFree,
      order: lecture.order,
      courseId: lecture.courseId.toString(),
      courseTitle: course.title,
      courseSlug: course.slug,
    },
    playerUrl,
    vimeoId: lecture.vimeoId,
    savedPositionSec: progress?.positionSec || 0,
    completed: !!progress?.completed,
    prevLecture: prevLec ? { _id: prevLec._id.toString(), title: prevLec.title } : null,
    nextLecture: nextLec ? { _id: nextLec._id.toString(), title: nextLec.title } : null,
  };
}
