import "server-only";
import { cache } from "react";
import { connection, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import connectDB from "../db/connect.js";
import { Session, User, Device } from "@/lib/models";
import { getCookie, deleteCookie, COOKIE_NAMES, COOKIE_DURATIONS } from "./cookies.js";
import { hashToken } from "./tokens.js";
export { getStudentCourseAccess, getStudentCourseContext } from "../services/studentAccessService.js";

const ONE_HOUR_MS = 60 * 60 * 1000;
const FIVE_MINS_MS = 5 * 60 * 1000;

async function resolveCurrentPath(defaultFallback) {
  try {
    const h = await headers();
    const p = h.get("x-pathname") || h.get("next-url");
    if (p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\")) {
      return p;
    }
  } catch {
    // ignore
  }
  return defaultFallback;
}

/**
 * Returns fresh authenticated admin user from MongoDB.
 * Reads ONLY rd_admin_session cookie.
 * Memoized per request using React cache.
 */
export const getCurrentAdmin = cache(async () => {
  await connection();
  const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
  if (!adminToken) {
    return null;
  }

  await connectDB();
  const now = new Date();
  const tokenHash = hashToken(adminToken);
  const session = await Session.findOne({ tokenHash }).lean();

  if (!session || session.revoked || new Date(session.expiresAt) <= now) {
    if (session) {
      await Session.deleteOne({ _id: session._id }).catch(() => {});
    }
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return null;
  }

  const user = await User.findById(session.userId).lean();
  if (!user || user.role !== "admin" || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return null;
  }

  // Sliding renewal: extend expiresAt at most once per hour on activity
  const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (now.getTime() - lastSeen > ONE_HOUR_MS) {
    const newExpiresAt = new Date(now.getTime() + COOKIE_DURATIONS.ADMIN_SESSION * 1000);
    await Session.updateOne(
      { _id: session._id },
      { $set: { lastSeenAt: now, expiresAt: newExpiresAt } }
    ).catch(() => {});
  }

  return {
    authenticated: true,
    user: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      email: user.email || "",
      role: "admin",
      status: user.status,
      phone: user.phone || "",
    },
    session: {
      _id: session._id.toString(),
      deviceId: session.deviceId,
    },
  };
});

/**
 * Returns fresh authenticated student user from MongoDB.
 * Reads ONLY rd_student_session (falling back to legacy rd_session).
 * Never trusts name, courses, or permissions stored in the token.
 * Memoized per request using React cache.
 */
export const getCurrentStudent = cache(async () => {
  await connection();
  const studentToken =
    (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
    (await getCookie(COOKIE_NAMES.LEGACY_SESSION));

  if (!studentToken) {
    return null;
  }

  await connectDB();
  const now = new Date();
  const tokenHash = hashToken(studentToken);
  const session = await Session.findOne({ tokenHash }).lean();

  if (!session || session.revoked || new Date(session.expiresAt) <= now) {
    if (session) {
      await Session.deleteOne({ _id: session._id }).catch(() => {});
    }
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  const user = await User.findById(session.userId).lean();
  if (!user || user.role !== "student" || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  const deviceApproved = await Device.exists({
    $or: [{ studentId: user._id }, { userId: user._id }],
    deviceId: session.deviceId,
    status: "approved",
  });

  if (!deviceApproved) {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  // Update lastSeenAt throttled to once per 5 minutes; extend expiresAt if sliding window elapsed
  const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (now.getTime() - lastSeen > FIVE_MINS_MS) {
    const updateFields = { lastSeenAt: now };
    if (now.getTime() - lastSeen > ONE_HOUR_MS) {
      updateFields.expiresAt = new Date(now.getTime() + COOKIE_DURATIONS.SESSION * 1000);
    }
    await Session.updateOne({ _id: session._id }, { $set: updateFields }).catch(() => {});
  }

  return {
    authenticated: true,
    user: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      email: user.email || "",
      role: "student",
      status: user.status,
      phone: user.phone || "",
      className: user.className || "12",
      validUntil: user.validUntil || null,
      courses: user.courses || [],
      enrolledCourses: user.enrolledCourses || [],
      createdAt: user.createdAt,
    },
    session: {
      _id: session._id.toString(),
      deviceId: session.deviceId,
    },
  };
});

/**
 * Returns detailed auth status for admin session.
 * Memoized per request using React cache.
 */
export const getAdminAuthStatus = cache(async () => {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const hadCookie = Boolean(await getCookie(COOKIE_NAMES.ADMIN_SESSION));
    return { authenticated: false, reason: hadCookie ? "session_expired" : "no_session", hadCookie };
  }
  return {
    authenticated: true,
    user: admin.user,
    session: admin.session,
  };
});

/**
 * Returns detailed auth status for student session, including revocation reason.
 * Memoized per request using React cache.
 */
export const getStudentAuthStatus = cache(async () => {
  const student = await getCurrentStudent();
  if (!student) {
    const hadCookie = Boolean(
      (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
      (await getCookie(COOKIE_NAMES.LEGACY_SESSION))
    );
    return { authenticated: false, reason: hadCookie ? "session_expired" : "no_session", hadCookie };
  }
  return {
    authenticated: true,
    user: student.user,
    session: student.session,
  };
});

/**
 * Returns current authenticated admin or student user without throwing.
 * DEPRECATED: Student routes must call getCurrentStudent(); Admin routes must call getCurrentAdmin().
 */
export const getCurrentUser = cache(async () => {
  const student = await getCurrentStudent();
  if (student) return student;
  const admin = await getCurrentAdmin();
  if (admin) return admin;
  return null;
});

/**
 * For page components: verifies admin session.
 * Redirects to /admin-login (or /api/auth/clear) if unauthenticated.
 * NEVER throws an error.
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const currentPath = await resolveCurrentPath("/admin");
    if (currentPath.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", reason: "unauthorized" },
        { status: 401 }
      );
    }
    const target = `/admin-login?reason=expired&next=${encodeURIComponent(currentPath)}`;
    const hadCookie = Boolean(await getCookie(COOKIE_NAMES.ADMIN_SESSION));
    if (hadCookie) {
      redirect(`/api/auth/clear?cookie=admin&to=${encodeURIComponent(target)}`);
    } else {
      redirect(target);
    }
  }

  return admin;
}

/**
 * For page components: verifies student session.
 * If /student/* is opened with only an admin cookie, redirect to student login with "Please log in as a student".
 * NEVER renders student UI using admin data.
 * NEVER throws an error.
 */
export async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student) {
    const currentPath = await resolveCurrentPath("/student");
    if (currentPath.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", reason: "unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is logged in ONLY as admin in this browser
    const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
    if (adminToken) {
      const target = `/student-login?reason=admin_logged_in&message=${encodeURIComponent(
        "Please log in as a student"
      )}&next=${encodeURIComponent(currentPath)}`;
      redirect(target);
    }

    const hadStudentCookie = Boolean(
      (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
      (await getCookie(COOKIE_NAMES.LEGACY_SESSION))
    );

    const target = `/student-login?reason=expired&next=${encodeURIComponent(currentPath)}`;
    if (hadStudentCookie) {
      redirect(`/api/auth/clear?cookie=student&to=${encodeURIComponent(target)}`);
    } else {
      redirect(target);
    }
  }

  return student;
}

/**
 * For API routes and server actions: verifies admin session.
 * Returns 401 response object when unauthorized.
 * NEVER throws an error.
 */
export async function requireAdminApi() {
  const status = await getAdminAuthStatus();
  if (!status.authenticated) {
    const res = NextResponse.json(
      { success: false, error: "Unauthorized", reason: status.reason || "unauthorized" },
      { status: 401 }
    );
    res.authenticated = false;
    res.authorized = false;
    res.ok = false;
    res.user = null;
    res.session = null;
    res.response = res;
    return res;
  }

  return {
    authenticated: true,
    authorized: true,
    ok: true,
    user: status.user,
    session: status.session,
    response: null,
  };
}

/**
 * For API routes and server actions: verifies student session.
 * Returns 401 response object when unauthorized.
 * NEVER throws an error.
 */
export async function requireStudentApi() {
  const student = await getCurrentStudent();
  if (!student) {
    const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
    const reason = adminToken ? "admin_logged_in" : "unauthorized";
    const errorMsg = adminToken ? "Please log in as a student" : "Unauthorized";
    const res = NextResponse.json(
      { success: false, error: errorMsg, reason },
      { status: 401 }
    );
    res.authenticated = false;
    res.authorized = false;
    res.ok = false;
    res.user = null;
    res.session = null;
    res.response = res;
    return res;
  }

  return student;
}
