"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "../validation/schemas.js";
import {
  studentLogin,
  adminLogin,
  logoutUser,
} from "../auth/authService.js";

export async function loginStudentAction(prevState, formData) {
  const raw = {
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    const result = await studentLogin(parsed.data);
    if (!result.success) {
      if (result.redirectTo) {
        redirect(result.redirectTo);
      }
      return { success: false, error: result.error };
    }

    redirect(result.redirectTo || "/student");
  } catch (err) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    return {
      success: false,
      error: err.message || "An unexpected error occurred during login.",
    };
  }
}

export async function loginAdminAction(prevState, formData) {
  const raw = {
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    const result = await adminLogin(parsed.data);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    redirect(result.redirectTo || "/admin");
  } catch (err) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    return {
      success: false,
      error: err.message || "An unexpected error occurred during admin login.",
    };
  }
}

export async function logoutStudentAction() {
  await logoutUser("student");
  redirect("/student/login");
}

export async function logoutAdminAction() {
  await logoutUser("admin");
  redirect("/admin/login");
}
