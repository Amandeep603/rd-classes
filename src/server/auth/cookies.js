import "server-only";
import { cookies } from "next/headers";

const IS_PROD = process.env.NODE_ENV === "production";

export const COOKIE_NAMES = {
  SESSION: "rd_session",
  ADMIN_SESSION: "rd_admin_session",
  DEVICE: "rd_device",
};

export const COOKIE_DURATIONS = {
  SESSION: 30 * 24 * 60 * 60, // 30 days
  ADMIN_SESSION: 7 * 24 * 60 * 60, // 7 days
  DEVICE: 2 * 365 * 24 * 60 * 60, // 2 years
};

export async function getCookie(name) {
  const cookieStore = await cookies();
  const c = cookieStore.get(name);
  return c ? c.value : null;
}

export async function setCookie(name, value, maxAgeSeconds) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
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
