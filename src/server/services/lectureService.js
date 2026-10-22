import "server-only";
import connectDB from "../db/connect.js";
import { Lecture } from "../db/models/Lecture.js";
import { Course } from "../db/models/Course.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Progress } from "../db/models/Progress.js";
import { parseVimeoUrl } from "./vimeo.js";
import { logAuditEvent } from "./audit.js";

/**
 * Returns all lectures for a course (admin view).
 */
export async function getAdminLecturesByCourse(courseId) {
  await connectDB();
  return Lecture.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean();
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

  const lecture = await Lecture.create({
    courseId: data.courseId,
    section: (data.section || "General").trim(),
    title: data.title.trim(),
    order: typeof data.order === "number" ? data.order : nextOrder,
    vimeoId,
    vimeoHash: vimeoHash || data.vimeoHash || "",
    durationSec: Number(data.durationSec) || 0,
    description: (data.description || "").trim(),
    published: typeof data.published === "boolean" ? data.published : true,
    isPreview: !!data.isPreview,
  });

  await logAuditEvent({
    actorId: adminId,
    action: "lecture.created",
    targetType: "lecture",
    targetId: lecture._id.toString(),
    meta: { title: lecture.title, courseId: data.courseId },
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
  if (typeof data.isPreview === "boolean") lecture.isPreview = data.isPreview;
  if (typeof data.order === "number") lecture.order = data.order;

  await lecture.save();

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
  await Progress.deleteMany({ lectureId });
  await Lecture.findByIdAndDelete(lectureId);

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
      isPreview: !!lec.isPreview,
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

  // Check enrollment
  const now = new Date();
  const enrollment = await Enrollment.findOne({
    userId: studentId,
    courseId: lecture.courseId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  if (!enrollment && !lecture.isPreview) {
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
      isPreview: lecture.isPreview,
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
