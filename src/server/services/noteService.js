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

  const { createAdminNotification } = await import("./notificationService.js");
  await createAdminNotification({
    type: "note_uploaded",
    title: "Note Uploaded",
    message: `Note "${note.title}" was uploaded`,
    link: "/admin/notes",
    entityId: note._id.toString(),
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
  const notes = await Note.find({
    $or: [{ courseId }, { courseIds: courseId }],
    published: true,
  })
    .select("_id title kind category source pageCount section book chapter isFree")
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(notes));
}

/**
 * Cached function for all published notes in the public /notes directory.
 */
export async function getCachedPublicNotes() {
  "use cache";
  cacheTag("notes");
  cacheLife("max");
  await connectDB();
  const notes = await Note.find({ published: true })
    .populate("courseIds", "title slug theme tone category")
    .select("_id title description category kind book chapter sizeBytes fileSize pageCount isFree section courseIds createdAt")
    .sort({ sortOrder: 1, order: 1, createdAt: -1 })
    .lean();

  const sanitized = notes.map((n) => ({
    _id: n._id.toString(),
    title: n.title,
    description: n.description || "",
    category: n.category || n.kind || "notes",
    kind: n.kind || n.category || "notes",
    book: n.book || "",
    chapter: n.chapter || "",
    fileSize: n.sizeBytes || n.fileSize || 0,
    sizeBytes: n.sizeBytes || n.fileSize || 0,
    pageCount: n.pageCount || 0,
    section: n.section || "General",
    isFree: Boolean(n.isFree),
    courses: Array.isArray(n.courseIds)
      ? n.courseIds
          .filter(Boolean)
          .map((c) => ({
            _id: c._id.toString(),
            title: c.title,
            slug: c.slug,
            theme: c.theme || c.tone || "blue",
            tone: c.tone || c.theme || "blue",
            category: c.category,
          }))
      : [],
    createdAt: n.createdAt ? n.createdAt.toISOString() : null,
  }));

  return JSON.parse(JSON.stringify(sanitized));
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
export async function getStudentAccessibleNotes(userOrId, { courseId = "", kind = "" } = {}) {
  await connectDB();
  const { getStudentCourseAccess } = await import("./studentAccessService.js");
  const access = await getStudentCourseAccess(userOrId);

  if (!access.authenticated || access.enrolledCourseIds.length === 0) {
    return [];
  }

  const query = {
    $or: [
      { courseIds: { $in: access.enrolledCourseIds } },
      { courseId: { $in: access.enrolledCourseIds } },
      { audience: "all" },
    ],
    published: true,
  };

  if (courseId) {
    const isEnrolled = access.isEnrolledInCourse(courseId);
    if (!isEnrolled) {
      return []; // Student is not enrolled in this specific course
    }
    query.$or = [{ courseIds: courseId }, { courseId: courseId }];
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

  if (user?.role === "admin") {
    const note = await Note.findById(noteId).lean();
    if (!note) return { allowed: false, reason: "not_found" };
    return { allowed: true, note };
  }

  const note = await Note.findOne({ _id: noteId, published: true }).lean();
  if (!note) return { allowed: false, reason: "not_found" };

  // Rule 1: Free note is accessible to everyone (including non-logged-in visitors)
  if (note.isFree) {
    return { allowed: true, note };
  }

  // Rule 2: If locked, user must be authenticated
  if (!user) return { allowed: false, reason: "unauthenticated" };

  // Rule 3: Enrolled student in any attached course (courseIds or courseId)
  const { getStudentCourseAccess } = await import("./studentAccessService.js");
  const access = await getStudentCourseAccess(user);

  const allNoteCourseIds = [
    ...(Array.isArray(note.courseIds) ? note.courseIds : []),
    ...(note.courseId ? [note.courseId] : []),
  ].map((c) => (c?._id ? c._id.toString() : c.toString()));

  const hasAccess = allNoteCourseIds.some((cId) => access.isEnrolledInCourse(cId));

  if (!hasAccess) {
    return { allowed: false, reason: "not_enrolled" };
  }

  return { allowed: true, note };
}
