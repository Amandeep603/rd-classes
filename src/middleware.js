import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const fullPath = search ? `${pathname}${search}` : pathname;

  // 1. Admin API protection (check cookie presence at edge)
  if (pathname.startsWith("/api/admin")) {
    const adminSession = request.cookies.get("rd_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Admin Portal Pages protection
  if (pathname.startsWith("/admin") && pathname !== "/admin-login") {
    const adminSession = request.cookies.get("rd_admin_session")?.value;
    if (!adminSession) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("reason", "expired");
      loginUrl.searchParams.set("next", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. Student Portal Pages protection
  if (
    pathname.startsWith("/student") &&
    !pathname.startsWith("/student-login") &&
    !pathname.startsWith("/student/login") &&
    !pathname.startsWith("/student/pending")
  ) {
    const studentSession =
      request.cookies.get("rd_student_session")?.value ||
      request.cookies.get("rd_session")?.value;

    if (!studentSession) {
      const adminSession = request.cookies.get("rd_admin_session")?.value;
      const loginUrl = new URL("/student-login", request.url);
      if (adminSession) {
        loginUrl.searchParams.set("reason", "admin_logged_in");
        loginUrl.searchParams.set("message", "Please log in as a student");
      } else {
        loginUrl.searchParams.set("reason", "expired");
      }
      loginUrl.searchParams.set("next", fullPath);
      return NextResponse.redirect(loginUrl);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/api/admin/:path*",
    "/student/:path*",
    "/student",
  ],
};
