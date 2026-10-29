import "server-only";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { Book } from "../db/models/Book.js";
import { Chapter } from "../db/models/Chapter.js";
import { Lecture } from "../db/models/Lecture.js";
import { Course } from "../db/models/Course.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Progress } from "../db/models/Progress.js";
import { parseVimeoUrl } from "./vimeo.js";
import { logAuditEvent } from "./audit.js";
import { createAdminNotification } from "./notificationService.js";

/**
 * Server helper to determine if a lecture is free preview.
 * ONLY lectures with isFree === true (or legacy isFreePreview) are free. Default is locked.
 * The old rule "first lecture is free automatically" has been removed.
 */
export function isLectureFree(lecture) {
  if (!lecture) return false;
  return Boolean(
    lecture.isFree === true ||
    lecture.isFreePreview === true ||
    lecture.freePreview === true ||
    lecture.isPreview === true
  );
}

/**
 * Ensures a Book and Chapter exist for a given course and titles,
 * creating them with correct positions if missing.
 */
export async function ensureBookAndChapter(courseId, bookTitle, chapterTitle) {
  await connectDB();
  const cleanBook = (bookTitle || "Book 1").trim();
  const cleanChapter = (chapterTitle || "Chapter 1").trim();

  let book = await Book.findOne({ courseId, title: cleanBook });
  if (!book) {
    const lastBook = await Book.findOne({ courseId }).sort({ position: -1 }).lean();
    book = await Book.create({
      courseId,
      title: cleanBook,
      position: (lastBook?.position ?? -1) + 1,
      status: "published",
    });
  }

  let chapter = await Chapter.findOne({ courseId, bookId: book._id, title: cleanChapter });
  if (!chapter) {
    const lastChap = await Chapter.findOne({ courseId, bookId: book._id }).sort({ position: -1 }).lean();
    chapter = await Chapter.create({
      courseId,
      bookId: book._id,
      title: cleanChapter,
      position: (lastChap?.position ?? -1) + 1,
      status: "published",
    });
  }

  return { book, chapter };
}

/**
 * Safely migrates old string fields `book` and `chapter` into Book and Chapter collections.
 */
export async function migrateLegacyLectures(courseId) {
  await connectDB();
  const query = courseId ? { courseId } : {};
  const lecturesWithoutRefs = await Lecture.find({
    ...query,
    $or: [{ bookId: null }, { chapterId: null }],
  });

  for (const lec of lecturesWithoutRefs) {
    const bookTitle = lec.book || "Book 1";
    const chapterTitle = lec.chapter || lec.section || "Chapter 1";
    const { book, chapter } = await ensureBookAndChapter(lec.courseId, bookTitle, chapterTitle);
    lec.bookId = book._id;
    lec.chapterId = chapter._id;
    lec.book = book.title;
    lec.chapter = chapter.title;
    if (lec.isFree === undefined) {
      lec.isFree = Boolean(lec.isFreePreview || lec.freePreview || lec.isPreview);
    }
    await lec.save();
  }
}

/**
 * Returns all lectures for a course (admin view).
 */
export async function getAdminLecturesByCourse(courseId) {
  await connectDB();
  // Ensure legacy lectures are migrated if any exist
  await migrateLegacyLectures(courseId);

  const lectures = await Lecture.find({ courseId })
    .populate("bookId", "title position status")
    .populate("chapterId", "title position status")
    .sort({ position: 1, order: 1, createdAt: 1 })
    .lean();

  return lectures.map((lec) => ({
    ...lec,
    isFree: isLectureFree(lec),
    isFreePreview: isLectureFree(lec),
    freePreview: isLectureFree(lec),
  }));
}

/**
 * Synchronizes course preview state without automatically marking anything free.
 */
export async function syncCourseFreePreview(courseId) {
  // Auto-marking removed per user specification. Only isFree === true lectures are free.
  return;
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
    .sort({ position: -1, order: -1 })
    .select("position order")
    .lean();
  const nextOrder = (highestOrder?.position ?? highestOrder?.order ?? -1) + 1;

  const isFree = Boolean(data.isFree ?? data.freePreview ?? data.isPreview ?? false);
  const isPublished = data.status === "published" || data.published === true;

  // Resolve Book and Chapter IDs if provided or fallback to strings
  let bookId = data.bookId || null;
  let chapterId = data.chapterId || null;
  if (!bookId || !chapterId) {
    const { book, chapter } = await ensureBookAndChapter(
      data.courseId,
      data.book || data.bookTitle,
      data.chapter || data.chapterTitle || data.section
    );
    bookId = bookId || book._id;
    chapterId = chapterId || chapter._id;
  }

  const lecture = await Lecture.create({
    courseId: data.courseId,
    bookId,
    chapterId,
    book: data.book || "",
    chapter: data.chapter || data.section || "",
    section: (data.section || data.chapter || "General").trim(),
    title: data.title.trim(),
    partNumber: Number(data.partNumber) || 1,
    position: typeof data.position === "number" ? data.position : nextOrder,
    order: typeof data.order === "number" ? data.order : nextOrder,
    videoProvider: data.videoProvider || "vimeo",
    videoUrl: data.videoUrl || "",
    vimeoId: vimeoId || data.vimeoId || "",
    vimeoHash: vimeoHash || data.vimeoHash || "",
    durationSeconds: Number(data.durationSeconds || data.durationSec) || 0,
    durationSec: Number(data.durationSeconds || data.durationSec) || 0,
    description: (data.description || "").trim(),
    status: isPublished ? "published" : "draft",
    published: isPublished,
    isFree,
    freePreview: isFree,
    isPreview: isFree,
    sourceKey: data.sourceKey || null,
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
  const isPublished = lecture?.status ? lecture.status === "published" : lecture?.published;
  if (!lecture || !isPublished) {
    return null;
  }

  // Check enrollment or free preview using isLectureFree
  const allCourseLectures = await Lecture.find({
    courseId: lecture.courseId,
    $or: [{ status: "published" }, { published: true }],
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
