"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi } from "../auth/session.js";
import { noteCreateSchema, noteUpdateSchema } from "../validation/schemas.js";
import {
  createNote,
  updateNote,
  deleteNote,
  attachNoteToCourse,
  detachNoteFromCourse,
  reorderCourseNotes,
  getNotesList,
} from "../services/noteService.js";
import { Note } from "../db/models/Note.js";
import connectDB from "../db/connect.js";

/**
 * Creates a note from admin panel.
 */
export async function createNoteAction(payload) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  const parsed = noteCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid note data.",
    };
  }

  try {
    const note = await createNote(parsed.data, admin.user._id);
    revalidatePath("/admin/courses");
    revalidatePath("/admin/notes");
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return { success: true, note };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Updates a note.
 */
export async function updateNoteAction(noteId, payload) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  const parsed = noteUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid note data.",
    };
  }

  try {
    const note = await updateNote(noteId, parsed.data, admin.user._id);
    revalidatePath("/admin/courses");
    revalidatePath("/admin/notes");
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return { success: true, note };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Deletes a note.
 */
export async function deleteNoteAction(noteId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    const res = await deleteNote(noteId, admin.user._id);
    revalidatePath("/admin/courses");
    revalidatePath("/admin/notes");
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Attaches an existing note to a course.
 */
export async function attachNoteToCourseAction({ noteId, courseId }) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };

  try {
    const note = await attachNoteToCourse(noteId, courseId);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return { success: true, note };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Detaches a note from a course.
 */
export async function detachNoteFromCourseAction({ noteId, courseId }) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };

  try {
    const note = await detachNoteFromCourse(noteId, courseId);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return { success: true, note };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Reorders notes for a course.
 */
export async function reorderCourseNotesAction({ courseId, orderedNoteIds }) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };

  try {
    const res = await reorderCourseNotes(courseId, orderedNoteIds);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/notes");
    revalidateTag("notes");
    revalidateTag("courses");
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Searches existing notes to attach to a course.
 */
export async function searchNotesForAttachmentAction(query, excludeCourseId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return [];

  await connectDB();

  const filter = {};
  if (query && query.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: "i" } },
      { section: { $regex: query.trim(), $options: "i" } },
    ];
  }

  if (excludeCourseId) {
    filter.courseIds = { $ne: excludeCourseId };
  }

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return JSON.parse(JSON.stringify(notes));
}
