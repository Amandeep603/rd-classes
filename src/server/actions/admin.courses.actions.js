"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import {
  courseCreateSchema,
  courseUpdateSchema,
} from "../validation/schemas.js";
import {
  createCourse,
  updateCourse,
  deleteCourse,
} from "../services/courseService.js";

export async function createCourseAction(prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || "",
    thumbnail: formData.get("thumbnail") || "",
    published: formData.get("published") === "on",
    order: formData.get("order") || 0,
  };

  const parsed = courseCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    const course = await createCourse(parsed.data, admin.user._id);
    revalidatePath("/admin/courses");
    return { success: true, courseId: course._id.toString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateCourseAction(courseId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    thumbnail: formData.get("thumbnail") || "",
    published: formData.get("published") === "on",
    order: formData.get("order") || 0,
  };

  const parsed = courseUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await updateCourse(courseId, parsed.data, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteCourseAction(courseId) {
  const admin = await requireAdmin();
  try {
    await deleteCourse(courseId, admin.user._id);
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
