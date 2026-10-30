import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "@/server/auth/cookies.js";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Route handler to clear stale session cookies and redirect.
 * Called from server components when a session cookie exists in headers
 * but has no matching or valid session document in MongoDB.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || "/admin-login";
  const cookieType = searchParams.get("cookie");

  let safeTo = "/admin-login";
  if (to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\")) {
    safeTo = to;
  }

  const cookieStore = await cookies();
  const clearCookieOpts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };

  if (!cookieType || cookieType === "admin") {
    cookieStore.set(COOKIE_NAMES.ADMIN_SESSION, "", clearCookieOpts);
  }
  if (!cookieType || cookieType === "student") {
    cookieStore.set(COOKIE_NAMES.STUDENT_SESSION, "", clearCookieOpts);
    cookieStore.set(COOKIE_NAMES.LEGACY_SESSION, "", clearCookieOpts);
  }

  const redirectUrl = new URL(safeTo, request.url);
  return NextResponse.redirect(redirectUrl);
}
