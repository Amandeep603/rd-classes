import "server-only";
import { cache } from "react";
import { connection, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import connectDB from "../db/connect.js";
import { Session, User, Device } from "@/lib/models";
import { getCookie, deleteCookie, COOKIE_NAMES, COOKIE_DURATIONS } from "./cookies.js";
import { hashToken } from "./tokens.js";

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
 * Returns detailed auth status for admin session.
 * Memoized per request using React cache.
 */
export const getAdminAuthStatus = cache(async () => {
  await connection();
  const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
  if (!adminToken) {
    return { authenticated: false, reason: "no_session", hadCookie: false };
  }

  await connectDB();
  const now = new Date();
  const tokenHash = hashToken(adminToken);
  const session = await Session.findOne({ tokenHash }).lean();

  if (!session || session.revoked || new Date(session.expiresAt) <= now) {
    if (session) {
      await Session.deleteOne({ _id: session._id });
    }
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return { authenticated: false, reason: "session_expired", hadCookie: true };
  }

  const user = await User.findById(session.userId).lean();
  if (!user || user.role !== "admin" || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id });
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return { authenticated: false, reason: "unauthorized", hadCookie: true };
  }

  // Sliding renewal: extend expiresAt at most once per hour on activity
  const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (now.getTime() - lastSeen > ONE_HOUR_MS) {
    const newExpiresAt = new Date(now.getTime() + COOKIE_DURATIONS.ADMIN_SESSION * 1000);
    await Session.updateOne(
      { _id: session._id },
      { $set: { lastSeenAt: now, expiresAt: newExpiresAt } }
    );
  }

  return {
    authenticated: true,
    user: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      email: user.email || "",
      role: user.role,
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
 * Returns detailed auth status for student session, including revocation reason.
 * Memoized per request using React cache.
 */
export const getStudentAuthStatus = cache(async () => {
  await connection();
  const studentToken = await getCookie(COOKIE_NAMES.SESSION);
  if (!studentToken) {
    return { authenticated: false, reason: "no_session", hadCookie: false };
  }

  await connectDB();
  const now = new Date();
  const tokenHash = hashToken(studentToken);
  const session = await Session.findOne({ tokenHash }).lean();

  if (!session || session.revoked || new Date(session.expiresAt) <= now) {
    if (session) {
      await Session.deleteOne({ _id: session._id });
    }
    await deleteCookie(COOKIE_NAMES.SESSION);
    return { authenticated: false, reason: "session_expired", hadCookie: true };
  }

  const user = await User.findById(session.userId).lean();
  if (!user || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id });
    await deleteCookie(COOKIE_NAMES.SESSION);
    return { authenticated: false, reason: "account_blocked", hadCookie: true };
  }

  const deviceApproved = await Device.exists({
    $or: [{ studentId: user._id }, { userId: user._id }],
    deviceId: session.deviceId,
    status: "approved",
  });

  if (!deviceApproved) {
    await Session.deleteOne({ _id: session._id });
    await deleteCookie(COOKIE_NAMES.SESSION);
    return { authenticated: false, reason: "device_revoked", hadCookie: true };
  }

  // Update lastSeenAt throttled to once per 5 minutes; extend expiresAt if sliding window elapsed
  const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (now.getTime() - lastSeen > FIVE_MINS_MS) {
    const updateFields = { lastSeenAt: now };
    if (now.getTime() - lastSeen > ONE_HOUR_MS) {
      updateFields.expiresAt = new Date(now.getTime() + COOKIE_DURATIONS.SESSION * 1000);
    }
    await Session.updateOne(
      { _id: session._id },
      { $set: updateFields }
    );

    // Delete expired/revoked session records older than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    Session.deleteMany({
      $or: [
        { expiresAt: { $lt: sevenDaysAgo } },
        { revoked: true, updatedAt: { $lt: sevenDaysAgo } },
      ],
    }).catch(() => {});
  }

  return {
    authenticated: true,
    user: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      email: user.email || "",
      role: user.role,
      status: user.status,
      deviceLimit: user.deviceLimit,
      deviceCount: user.deviceCount,
      mustChangePassword: user.mustChangePassword,
      phone: user.phone || "",
      className: user.className || "12",
    },
    session: {
      _id: session._id.toString(),
      deviceId: session.deviceId,
    },
  };
});

/**
 * Returns current authenticated admin or student user without throwing.
 * Checks admin first, then student.
 */
export const getCurrentUser = cache(async () => {
  const adminAuth = await getAdminAuthStatus();
  if (adminAuth.authenticated) {
    return { user: adminAuth.user, session: adminAuth.session };
  }
  const studentAuth = await getStudentAuthStatus();
  if (studentAuth.authenticated) {
    return { user: studentAuth.user, session: studentAuth.session };
  }
  return null;
});

/**
 * For page components: verifies admin session.
 * Redirects to /admin-login (or /api/auth/clear) if unauthenticated.
 * NEVER throws an error.
 */
export async function requireAdmin() {
  const status = await getAdminAuthStatus();
  if (!status.authenticated) {
    const currentPath = await resolveCurrentPath("/admin");
    if (currentPath.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", reason: status.reason || "unauthorized" },
        { status: 401 }
      );
    }
    const target = `/admin-login?reason=expired&next=${encodeURIComponent(currentPath)}`;
    if (status.hadCookie) {
      redirect(`/api/auth/clear?cookie=admin&to=${encodeURIComponent(target)}`);
    } else {
      redirect(target);
    }
  }

  return { user: status.user, session: status.session };
}

/**
 * For page components: verifies student session.
 * Redirects to /student-login (or /api/auth/clear) if unauthenticated.
 * NEVER throws an error.
 */
export async function requireStudent() {
  const status = await getStudentAuthStatus();
  if (!status.authenticated) {
    const currentPath = await resolveCurrentPath("/student");
    if (currentPath.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", reason: status.reason || "unauthorized" },
        { status: 401 }
      );
    }
    let target = `/student-login?reason=expired&next=${encodeURIComponent(currentPath)}`;

    if (status.reason === "device_revoked") {
      target = "/student-login?error=device_revoked";
    } else if (status.reason === "account_blocked") {
      target = "/student-login?error=account_blocked";
    }

    if (status.hadCookie) {
      redirect(`/api/auth/clear?cookie=student&to=${encodeURIComponent(target)}`);
    } else {
      redirect(target);
    }
  }

  return { user: status.user, session: status.session };
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
  const status = await getStudentAuthStatus();
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
