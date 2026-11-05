"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { loginSchema } from "../validation/schemas.js";
import {
  studentLogin,
  adminLogin,
  logoutUser,
} from "../auth/authService.js";
import { COOKIE_NAMES } from "../auth/cookies.js";
import { formatPublicError } from "@/lib/publicError.js";

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

  // Check cookie presence for browser submissions
  const cookieStore = await cookies();
  const rawTestCookie = cookieStore.get(COOKIE_NAMES.TEST)?.value;
  const rawDeviceCookie = cookieStore.get(COOKIE_NAMES.DEVICE)?.value;
  const rawPendingCookie = cookieStore.get(COOKIE_NAMES.PENDING)?.value;
  const rawHintsCookie = cookieStore.get(COOKIE_NAMES.HINTS)?.value;
  const rawSessionCookie =
    cookieStore.get(COOKIE_NAMES.STUDENT_SESSION)?.value ||
    cookieStore.get(COOKIE_NAMES.LEGACY_SESSION)?.value;

  const hasFirstPartyCookie = Boolean(
    rawTestCookie ||
    rawDeviceCookie ||
    rawPendingCookie ||
    rawHintsCookie ||
    rawSessionCookie
  );

  if (!hasFirstPartyCookie) {
    return {
      success: false,
      error: "Please enable cookies to log in.",
      reason: "cookies_disabled",
    };
  }

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
    const { userMessage, refCode } = formatPublicError(err, { loginId: parsed.data.loginId, route: "/student/login" });
    return {
      success: false,
      error: userMessage,
      ref: refCode,
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
    const { userMessage, refCode } = formatPublicError(result.error, { loginId: parsed.data.loginId, route: "/student/login" });
    return { success: false, error: userMessage, ref: refCode };
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
    const { userMessage, refCode } = formatPublicError(err, { loginId: parsed.data.loginId, route: "/admin/login" });
    return {
      success: false,
      error: userMessage,
      ref: refCode,
    };
  }

  if (!result.success) {
    const { userMessage, refCode } = formatPublicError(result.error, { loginId: parsed.data.loginId, route: "/admin/login" });
    return { success: false, error: userMessage, ref: refCode };
  }

  const destination = getSafeRedirectUrl(nextParam, result.redirectTo || "/admin");
  redirect(destination);
}

export async function logoutStudentAction() {
  await logoutUser("student");
  redirect("/student-login?reason=logged_out");
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
    const { userMessage, refCode } = formatPublicError(err);
    return { success: false, error: userMessage, ref: refCode };
  }
}
