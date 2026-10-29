"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "../validation/schemas.js";
import {
  studentLogin,
  adminLogin,
  logoutUser,
} from "../auth/authService.js";

function getSafeRedirectUrl(url, fallback) {
  if (
    typeof url === "string" &&
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("/\\")
  ) {
    return url;
  }
  return fallback;
}

export async function loginStudentAction(prevState, formData) {
  const raw = {
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  };
  const nextParam = formData.get("next");

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  let result;
  try {
    result = await studentLogin(parsed.data);
  } catch (err) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred during login.",
    };
  }

  if (!result.success) {
    if (result.pendingApproval) {
      return {
        success: false,
        pendingApproval: true,
        message: result.message,
      };
    }
    return { success: false, error: result.error };
  }

  const destination = getSafeRedirectUrl(nextParam, result.redirectTo || "/student");
  redirect(destination);
}

export async function loginAdminAction(prevState, formData) {
  const raw = {
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  };
  const nextParam = formData.get("next");

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  let result;
  try {
    result = await adminLogin(parsed.data);
  } catch (err) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred during admin login.",
    };
  }

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const destination = getSafeRedirectUrl(nextParam, result.redirectTo || "/admin");
  redirect(destination);
}

export async function logoutStudentAction() {
  await logoutUser("student");
  redirect("/student-login");
}

export async function logoutAdminAction() {
  await logoutUser("admin");
  redirect("/admin-login");
}

export async function updateStudentDeviceNoteAction(requestId, note) {
  if (!requestId || typeof note !== "string") {
    return { success: false, error: "Invalid parameters" };
  }
  const cleanNote = note.trim().slice(0, 140);
  try {
    const connectDB = (await import("../db/connect.js")).default;
    const { DeviceRequest } = await import("../db/models/DeviceRequest.js");
    await connectDB();
    await DeviceRequest.findByIdAndUpdate(requestId, {
      studentNote: cleanNote,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
