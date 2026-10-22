"use server";

import { requireStudent } from "../auth/session.js";
import { studentPasswordChangeSchema } from "../validation/schemas.js";
import { studentChangePassword } from "../services/studentService.js";

export async function changeStudentPasswordAction(prevState, formData) {
  const auth = await requireStudent();

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  };

  const parsed = studentPasswordChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await studentChangePassword({
      userId: auth.user._id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      currentSessionId: auth.session._id,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
