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
  ADMIN_SESSION: 8 * 60 * 60, // 8 hours
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
  const cookieStore = await cookies();
  cookieStore.set(name, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
