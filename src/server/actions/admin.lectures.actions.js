"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import {
  lectureCreateSchema,
  lectureUpdateSchema,
} from "../validation/schemas.js";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
} from "../services/lectureService.js";
import { fetchVimeoMetadata } from "../services/vimeo.js";

export async function createLectureAction(courseId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    courseId,
    section: formData.get("section") || "General",
    title: formData.get("title"),
    vimeoUrl: formData.get("vimeoUrl"),
    durationSec: formData.get("durationSec") || 0,
    description: formData.get("description") || "",
    published: formData.get("published") === "on",
    isPreview: formData.get("isPreview") === "on",
  };

  const parsed = lectureCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await createLecture(parsed.data, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateLectureAction(
  lectureId,
  courseId,
  prevState,
  formData
) {
  const admin = await requireAdmin();

  const raw = {
    section: formData.get("section"),
    title: formData.get("title"),
    vimeoUrl: formData.get("vimeoUrl"),
    durationSec: formData.get("durationSec")
      ? Number(formData.get("durationSec"))
      : undefined,
    description: formData.get("description"),
    published: formData.get("published") === "on",
    isPreview: formData.get("isPreview") === "on",
  };

  const parsed = lectureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await updateLecture(lectureId, parsed.data, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteLectureAction(lectureId, courseId) {
  const admin = await requireAdmin();
  try {
    await deleteLecture(lectureId, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function reorderLecturesAction(courseId, orderedIds) {
  const admin = await requireAdmin();
  try {
    await reorderLectures(courseId, orderedIds, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchVimeoMetadataAction(vimeoId) {
  await requireAdmin();
  return fetchVimeoMetadata(vimeoId);
}
