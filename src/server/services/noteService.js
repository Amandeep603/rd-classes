import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import connectDB from "../db/connect.js";
import { Note } from "../db/models/Note.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Course } from "../db/models/Course.js";
import { User } from "../db/models/User.js";
import { logAuditEvent } from "./audit.js";

/**
 * Creates a new note (file or link).
 */
export async function createNote(data, adminId) {
  await connectDB();

  // Determine max order if courseIds provided
  let maxOrder = 0;
  if (Array.isArray(data.courseIds) && data.courseIds.length > 0) {
    const lastNote = await Note.findOne({ courseIds: { $in: data.courseIds } })
      .sort({ order: -1 })
      .lean();
    if (lastNote && typeof lastNote.order === "number") {
      maxOrder = lastNote.order + 1;
    }
  }

  const note = await Note.create({
    title: data.title.trim(),
    kind: data.kind || "notes",
    source: data.source || "file",
    externalUrl: data.source === "link" ? (data.externalUrl || "").trim() : "",
    fileKey: data.source === "file" ? (data.fileKey || "").trim() : "",
    fileUrl: data.source === "file" ? (data.fileUrl || "").trim() : "",
    contentType: data.contentType || "application/pdf",
    fileSize: Number(data.fileSize) || 0,
    pageCount: Number(data.pageCount) || 0,
    section: (data.section || "General").trim(),
    courseIds: Array.isArray(data.courseIds) ? data.courseIds : [],
    order: typeof data.order === "number" ? data.order : maxOrder,
    published: data.published !== false,
    createdBy: adminId || null,
  });

  await logAuditEvent({
    actorId: adminId,
    action: "note.created",
    targetType: "note",
    targetId: note._id.toString(),
    meta: {
      title: note.title,
      kind: note.kind,
      source: note.source,
      courseIds: note.courseIds,
    },
  });

  return note.toObject();
}

/**
 * Updates an existing note.
 */
export async function updateNote(noteId, data, adminId) {
  await connectDB();
  const note = await Note.findById(noteId);
  if (!note) {
    throw new Error("Note not found.");
  }

  if (data.title !== undefined) note.title = data.title.trim();
  if (data.kind !== undefined) note.kind = data.kind;
  if (data.source !== undefined) note.source = data.source;
  if (data.externalUrl !== undefined) note.externalUrl = data.externalUrl.trim();
  if (data.fileKey !== undefined) note.fileKey = data.fileKey.trim();
  if (data.fileUrl !== undefined) note.fileUrl = data.fileUrl.trim();
  if (data.contentType !== undefined) note.contentType = data.contentType;
  if (data.fileSize !== undefined) note.fileSize = Number(data.fileSize) || 0;
  if (data.pageCount !== undefined) note.pageCount = Number(data.pageCount) || 0;
  if (data.section !== undefined) note.section = data.section.trim();
  if (Array.isArray(data.courseIds)) note.courseIds = data.courseIds;
  if (data.order !== undefined) note.order = Number(data.order) || 0;
  if (data.published !== undefined) note.published = !!data.published;

  await note.save();

  await logAuditEvent({
    actorId: adminId,
    action: "note.updated",
    targetType: "note",
    targetId: note._id.toString(),
    meta: { title: note.title, kind: note.kind, source: note.source },
  });

  return note.toObject();
}

/**
 * Deletes a note.
 */
export async function deleteNote(noteId, adminId) {
  await connectDB();
  const note = await Note.findByIdAndDelete(noteId);
  if (!note) {
    throw new Error("Note not found.");
  }

  await logAuditEvent({
    actorId: adminId,
    action: "note.deleted",
    targetType: "note",
    targetId: noteId.toString(),
    meta: { title: note.title },
  });

  return { success: true };
}

/**
 * Attaches a note to a course.
 */
export async function attachNoteToCourse(noteId, courseId) {
  await connectDB();
  const note = await Note.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const cIdStr = courseId.toString();
  const alreadyAttached = note.courseIds.some((id) => id.toString() === cIdStr);
  if (!alreadyAttached) {
    note.courseIds.push(courseId);
    await note.save();
  }

  return note.toObject();
}

/**
 * Detaches a note from a course.
 */
export async function detachNoteFromCourse(noteId, courseId) {
  await connectDB();
  const note = await Note.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const cIdStr = courseId.toString();
  note.courseIds = note.courseIds.filter((id) => id.toString() !== cIdStr);
  await note.save();

  return note.toObject();
}

/**
 * Reorders notes for a course.
 */
export async function reorderCourseNotes(courseId, orderedNoteIds) {
  await connectDB();
  const ops = orderedNoteIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, courseIds: courseId },
      update: { $set: { order: index } },
    },
  }));

  if (ops.length > 0) {
    await Note.bulkWrite(ops);
  }

  return { success: true };
}

/**
 * Gets all notes linked to a course.
 */
export async function getNotesForCourse(courseId, { publishedOnly = false, kind = "" } = {}) {
  await connectDB();
  const query = { courseIds: courseId };
  if (publishedOnly) query.published = true;
  if (kind && kind !== "all") query.kind = kind;

  const notes = await Note.find(query).sort({ order: 1, createdAt: -1 }).lean();
  return notes;
}

/**
 * Cached function for published course notes in public course detail page.
 */
export async function getCachedNotesForCourse(courseId) {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();
  const notes = await Note.find({ courseIds: courseId, published: true })
    .select("_id title kind source pageCount section")
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(notes));
}

/**
 * Gets notes library list with filters and search for admin.
 */
export async function getNotesList({
  search = "",
  kind = "",
  courseId = "",
  publishedOnly = false,
  page = 1,
  limit = 50,
} = {}) {
  await connectDB();
  const query = {};

  if (publishedOnly) query.published = true;
  if (kind && kind !== "all") query.kind = kind;
  if (courseId) query.courseIds = courseId;

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { section: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    Note.find(query)
      .populate("courseIds", "title slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Note.countDocuments(query),
  ]);

  return {
    notes,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Gets notes accessible to an enrolled student.
 */
export async function getStudentAccessibleNotes(userId, { courseId = "", kind = "" } = {}) {
  await connectDB();
  const now = new Date();

  // Find active enrollments
  const enrollments = await Enrollment.find({
    userId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select("courseId").lean();

  const activeCourseIds = enrollments.map((e) => e.courseId);
  if (activeCourseIds.length === 0) {
    return [];
  }

  const query = {
    courseIds: { $in: activeCourseIds },
    published: true,
  };

  if (courseId) {
    const isEnrolledInCourse = activeCourseIds.some(
      (id) => id.toString() === courseId.toString()
    );
    if (!isEnrolledInCourse) {
      return []; // Student is not enrolled in this specific course
    }
    query.courseIds = courseId;
  }

  if (kind && kind !== "all") {
    query.kind = kind;
  }

  const notes = await Note.find(query)
    .populate("courseIds", "title slug")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return notes;
}

/**
 * Checks whether a user (admin or student) is allowed to access/stream a note.
 */
export async function checkNoteAccess(noteId, user) {
  await connectDB();
  if (!user) return { allowed: false, reason: "unauthenticated" };

  if (user.role === "admin") {
    const note = await Note.findById(noteId).lean();
    if (!note) return { allowed: false, reason: "not_found" };
    return { allowed: true, note };
  }

  const note = await Note.findOne({ _id: noteId, published: true }).lean();
  if (!note) return { allowed: false, reason: "not_found" };

  const now = new Date();
  const activeEnrollment = await Enrollment.findOne({
    userId: user._id,
    courseId: { $in: note.courseIds },
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  if (!activeEnrollment) {
    return { allowed: false, reason: "not_enrolled" };
  }

  return { allowed: true, note };
}
