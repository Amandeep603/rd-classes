"use server";

import { revalidatePath } from "next/cache";
import { requireAdminApi } from "../auth/session.js";
import {
  courseCreateSchema,
  courseUpdateSchema,
} from "../validation/schemas.js";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourse,
  invalidateCoursesCache,
} from "../services/courseService.js";

function parseCourseFormData(formData) {
  return {
    title: formData.get("title")?.toString().trim() || "",
    subtitle: formData.get("subtitle")?.toString().trim() || "",
    slug: formData.get("slug")?.toString().trim() || "",
    category: formData.get("category")?.toString().trim() || "class12",
    classLabel: formData.get("classLabel")?.toString().trim() || "Class 12",
    badgeText: formData.get("badgeText")?.toString().trim() || "",
    badgeVariant: formData.get("badgeVariant")?.toString().trim() || "crown-navy",
    tone: formData.get("tone")?.toString().trim() || "sky",
    illustration: formData.get("illustration")?.toString().trim() || "books-blue",
    illustrationAssetId: formData.get("illustrationAssetId")?.toString().trim() || null,
    description: formData.get("description")?.toString().trim() || "",
    metaIcon: formData.get("metaIcon")?.toString().trim() || "video",
    metaText: formData.get("metaText")?.toString().trim() || "",
    language: formData.get("language")?.toString().trim() || "Bilingual",
    facultyName: formData.get("facultyName")?.toString().trim() || "Ronak Dugar",
    facultyRole: formData.get("facultyRole")?.toString().trim() || "Lead Accountancy Faculty",
    facultyAvatarAssetId: formData.get("facultyAvatarAssetId")?.toString().trim() || null,
    whatsappText: formData.get("whatsappText")?.toString().trim() || "",
    whatsappMessageNote: formData.get("whatsappMessageNote")?.toString().trim() || formData.get("whatsappText")?.toString().trim() || "",
    titleHighlight: formData.get("titleHighlight")?.toString().trim() || "",
    heroBooks: (() => {
      try {
        const val = formData.get("heroBooks");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    thumbnail: formData.get("thumbnail")?.toString().trim() || "",
    published: formData.get("published") === "true" || formData.get("published") === "on",
    featured: formData.get("featured") === "true" || formData.get("featured") === "on",
    order: formData.get("order") ? Number(formData.get("order")) : undefined,
    about: formData.get("about")?.toString().trim() || "",
    highlights: (() => {
      try {
        const val = formData.get("highlights");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    includes: (() => {
      try {
        const val = formData.get("includes");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    faqs: (() => {
      try {
        const val = formData.get("faqs");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    facultyPoints: (() => {
      try {
        const val = formData.get("facultyPoints");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    facultyBullets: (() => {
      try {
        const val = formData.get("facultyBullets") || formData.get("facultyPoints");
        return val ? JSON.parse(val.toString()) : [];
      } catch {
        return [];
      }
    })(),
    facultyProfileUrl: formData.get("facultyProfileUrl")?.toString().trim() || "",
    heroIllustration: formData.get("heroIllustration")?.toString().trim() || "books-subjects",
  };
}

export async function createCourseAction(prevState, formData) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  const raw = parseCourseFormData(formData);
  const parsed = courseCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid course data.",
    };
  }

  try {
    const course = await createCourse(parsed.data, admin.user._id);
    await invalidateCoursesCache();
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true, courseId: course._id.toString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateCourseAction(courseId, prevState, formData) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  const raw = parseCourseFormData(formData);
  const parsed = courseUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid course data.",
    };
  }

  try {
    await updateCourse(courseId, parsed.data, admin.user._id);
    await invalidateCoursesCache();
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function reorderCourseAction(courseId, direction) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await reorderCourse(courseId, direction, admin.user._id);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function togglePublishCourseAction(courseId, published) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await updateCourse(courseId, { published }, admin.user._id);
    await invalidateCoursesCache();
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteCourseAction(courseId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await deleteCourse(courseId, admin.user._id);
    await invalidateCoursesCache();
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

