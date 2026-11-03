import "server-only";
import { cookies } from "next/headers";

const IS_PROD = process.env.NODE_ENV === "production";

export const COOKIE_NAMES = {
  ADMIN_SESSION: "rd_admin_session",
  STUDENT_SESSION: "rd_student_session",
  SESSION: "rd_student_session",
  LEGACY_SESSION: "rd_session",
  DEVICE: "rd_device",
  BACKUP: "rd_backup",
  BACKUP_SYNC: "rd_backup_sync",
  PENDING: "rd_pending",
  HINTS: "rd_hints",
};

export const COOKIE_DURATIONS = {
  SESSION: 30 * 24 * 60 * 60, // 30 days sliding safety cap
  ADMIN_SESSION: 7 * 24 * 60 * 60, // 7 days
  DEVICE: 400 * 24 * 60 * 60, // 400 days
  PENDING: 30 * 24 * 60 * 60, // 30 days
};

export async function getCookie(name) {
  const cookieStore = await cookies();
  const c = cookieStore.get(name);
  return c ? c.value : null;
}

/**
 * Sets a cookie.
 * If maxAgeSeconds is omitted, null, or undefined, no maxAge/expires is set,
 * creating a standard browser session cookie.
 */
export async function setCookie(name, value, maxAgeSeconds, options = {}) {
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: options.httpOnly !== undefined ? options.httpOnly : true,
    secure: options.secure !== undefined ? options.secure : IS_PROD,
    sameSite: options.sameSite || "lax",
    path: options.path || "/",
    ...options,
  };

  if (typeof maxAgeSeconds === "number" && maxAgeSeconds > 0) {
    cookieOptions.maxAge = maxAgeSeconds;
  }

  cookieStore.set(name, value, cookieOptions);
}

export async function deleteCookie(name) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, "", {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {
    // In Server Components, the cookie store is read-only.
    // The session is already revoked in the database; cookie will be cleared on action or client navigation.
  }
}
