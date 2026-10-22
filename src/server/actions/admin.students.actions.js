"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import {
  studentCreateSchema,
  studentUpdateSchema,
  adminResetPasswordSchema,
} from "../validation/schemas.js";
import {
  createStudent,
  updateStudentProfile,
  blockStudent,
  unblockStudent,
  adminResetPassword,
} from "../services/studentService.js";

export async function createStudentAction(prevState, formData) {
  const admin = await requireAdmin();

  const courseIdsRaw = formData.getAll("courseIds");
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    loginId: formData.get("loginId"),
    password: formData.get("password"),
    deviceLimit: formData.get("deviceLimit") || 1,
    mustChangePassword: formData.get("mustChangePassword") === "on",
    courseIds: courseIdsRaw.filter(Boolean),
  };

  const parsed = studentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    const result = await createStudent(parsed.data, admin.user._id);
    revalidatePath("/admin/students");
    return {
      success: true,
      createdStudent: result.student,
      rawPassword: result.rawPassword,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateStudentProfileAction(studentId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone") || "",
  };

  const parsed = studentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await updateStudentProfile(studentId, parsed.data, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function blockStudentAction(studentId) {
  const admin = await requireAdmin();
  try {
    await blockStudent(studentId, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function unblockStudentAction(studentId) {
  const admin = await requireAdmin();
  try {
    await unblockStudent(studentId, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function resetStudentPasswordAction(studentId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    newPassword: formData.get("newPassword"),
    revokeSessions: formData.get("revokeSessions") === "on",
  };

  const parsed = adminResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid password.",
    };
  }

  try {
    await adminResetPassword(
      studentId,
      parsed.data.newPassword,
      parsed.data.revokeSessions,
      admin.user._id
    );
    revalidatePath(`/admin/students/${studentId}`);
    return { success: true, newPassword: parsed.data.newPassword };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function enrollStudentAction(userId, courseId, expiresAt = null) {
  const admin = await requireAdmin();
  const { enrollStudentInCourse } = await import("../services/enrollmentService.js");
  try {
    await enrollStudentInCourse({
      userId,
      courseId,
      expiresAt,
      assignedBy: admin.user._id,
    });
    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function revokeEnrollmentAction(enrollmentId, userId) {
  const admin = await requireAdmin();
  const { revokeEnrollment } = await import("../services/enrollmentService.js");
  try {
    await revokeEnrollment(enrollmentId, admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

