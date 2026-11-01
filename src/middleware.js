import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const fullPath = search ? `${pathname}${search}` : pathname;

  // 1. Host and Canonical check
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const isVercelPreview = (host.endsWith(".vercel.app") && host !== "rd-classes-sandy.vercel.app") || host.includes("-git-");

  // Apex or non-canonical production host redirect -> https://www.rd-classes.in (308 single hop)
  if (!isLocal && !isVercelPreview && (host === "rd-classes.in" || host === "rd-classes-sandy.vercel.app")) {
    const targetUrl = new URL(`https://www.rd-classes.in${pathname}${search}`);
    return NextResponse.redirect(targetUrl, 308);
  }

  // Determine whether this request should be noindexed
  const isUnknownHost = !isLocal && !isVercelPreview && host !== "www.rd-classes.in";
  const isSearchOrFilter = Boolean(search && search.length > 1);
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/api") ||
    pathname === "/student-login" ||
    pathname === "/student/login" ||
    pathname === "/admin-login";

  const shouldNoindex = isUnknownHost || isSearchOrFilter || isProtectedPath;

  const applyHeaders = (res) => {
    if (shouldNoindex) {
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return res;
  };

  // 2. Admin API protection (check cookie presence at edge)
  if (pathname.startsWith("/api/admin")) {
    const adminSession = request.cookies.get("rd_admin_session")?.value;
    if (!adminSession) {
      return applyHeaders(
        NextResponse.json(
          { success: false, error: "Unauthorized: Admin session required" },
          { status: 401 }
        )
      );
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applyHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // 3. Admin Portal Pages protection
  if (pathname.startsWith("/admin") && pathname !== "/admin-login") {
    const adminSession = request.cookies.get("rd_admin_session")?.value;
    if (!adminSession) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("reason", "expired");
      loginUrl.searchParams.set("next", fullPath);
      return applyHeaders(NextResponse.redirect(loginUrl));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applyHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // 4. Student Portal Pages protection
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
        loginUrl.searchParams.set("reason", "login_required");
      }
      loginUrl.searchParams.set("next", fullPath);
      return applyHeaders(NextResponse.redirect(loginUrl));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return applyHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return applyHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/).*)",
  ],
};
