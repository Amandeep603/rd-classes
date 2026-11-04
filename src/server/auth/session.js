import "server-only";
import { cache } from "react";
import crypto from "crypto";
import { connection, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import connectDB from "../db/connect.js";
import { Session, User, Device, DeviceRequest } from "@/lib/models";
import {
  getCookie,
  setCookie,
  deleteCookie,
  COOKIE_NAMES,
  COOKIE_DURATIONS,
} from "./cookies.js";
import { hashToken } from "./tokens.js";
import {
  parseClientHints,
  parseServerSignals,
  computeProfile,
  matchDevice,
} from "./deviceIdentity.js";
export {
  getStudentCourseAccess,
  getStudentCourseContext,
} from "../services/studentAccessService.js";

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

  try {
    await connectDB();
  } catch (err) {
    console.error("[ADMIN_SESSION_ERROR] DB connection error:", err?.message);
    return null;
  }

  const now = new Date();
  const tokenHash = hashToken(adminToken);
  let session = null;
  try {
    session = await Session.findOne({ tokenHash }).lean();
  } catch (err) {
    console.error("[ADMIN_SESSION_ERROR] Session find error:", err?.message);
    return null;
  }

  if (!session || session.revoked || new Date(session.expiresAt) <= now) {
    if (session) {
      await Session.deleteOne({ _id: session._id }).catch(() => {});
    }
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return null;
  }

  let user = null;
  try {
    user = await User.findById(session.userId).lean();
  } catch (err) {
    console.error("[ADMIN_SESSION_ERROR] User find error:", err?.message);
    return null;
  }

  if (!user || user.role !== "admin" || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
    return null;
  }

  // Sliding renewal: extend expiresAt at most once per hour on activity
  const lastSeen = session.lastSeenAt
    ? new Date(session.lastSeenAt).getTime()
    : 0;
  if (now.getTime() - lastSeen > ONE_HOUR_MS) {
    const newExpiresAt = new Date(
      now.getTime() + COOKIE_DURATIONS.ADMIN_SESSION * 1000
    );
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
 * Validates session AND that its device is still approved (one indexed lookup, cached per request).
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

  try {
    await connectDB();
  } catch (err) {
    console.error("[SESSION_ERROR] DB connection error in getCurrentStudent:", err?.message);
    // Transient DB error: NEVER clear cookies or revoke sessions on database connectivity hiccups
    return {
      transientError: true,
      authenticated: false,
    };
  }

  const now = new Date();
  const tokenHash = hashToken(studentToken);
  let session = null;
  try {
    session = await Session.findOne({ tokenHash }).lean();
  } catch (err) {
    console.error("[SESSION_ERROR] Transient DB error querying session:", err?.message);
    return {
      transientError: true,
      authenticated: false,
    };
  }

  if (!session) {
    return null;
  }

  if (session.revoked) {
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  // 30-day sliding cap check
  if (new Date(session.expiresAt) <= now) {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  let user = null;
  try {
    user = await User.findById(session.userId).lean();
  } catch (err) {
    console.error("[SESSION_ERROR] Transient DB error finding student user:", err?.message);
    return {
      transientError: true,
      authenticated: false,
    };
  }

  if (!user || user.role !== "student" || user.status === "blocked") {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  // Strict device validation: session MUST point to an approved, non-revoked device
  if (!session.deviceId) {
    // Session without a valid device binding is rejected (adoption rule removed)
    await Session.updateOne(
      { _id: session._id },
      { $set: { revoked: true, revokedReason: "device_unbound" } }
    ).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  // Verify device is still approved and not revoked
  let approvedDevice = null;
  try {
    approvedDevice = await Device.findOne({
      studentId: user._id,
      $or: [{ deviceId: session.deviceId }, { deviceKey: session.deviceId }],
      status: "approved",
    }).lean();
  } catch (devErr) {
    console.error("[SESSION_ERROR] Transient DB error checking device:", devErr?.message);
    // On transient DB error, fail safe (do NOT kill active session)
    approvedDevice = { deviceId: session.deviceId };
  }

  if (!approvedDevice) {
    // Device was explicitly revoked or replaced by admin
    await Session.updateOne(
      { _id: session._id },
      { $set: { revoked: true, revokedReason: "device_removed" } }
    ).catch(() => {});
    await deleteCookie(COOKIE_NAMES.STUDENT_SESSION);
    await deleteCookie(COOKIE_NAMES.LEGACY_SESSION);
    return null;
  }

  // Update lastSeenAt throttled to once per 5 minutes; sliding renewal extends expiresAt
  const lastSeen = session.lastSeenAt
    ? new Date(session.lastSeenAt).getTime()
    : 0;
  if (now.getTime() - lastSeen > FIVE_MINS_MS) {
    const updateFields = { lastSeenAt: now };
    // Sliding renewal: extend 30-day window
    if (now.getTime() - lastSeen > ONE_HOUR_MS) {
      updateFields.expiresAt = new Date(
        now.getTime() + COOKIE_DURATIONS.SESSION * 1000
      );
    }
    await Session.updateOne({ _id: session._id }, { $set: updateFields }).catch(
      () => {}
    );
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
    return {
      authenticated: false,
      reason: hadCookie ? "session_expired" : "no_session",
      hadCookie,
    };
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
  if (!student || !student.authenticated) {
    if (student?.transientError) {
      return {
        authenticated: false,
        transientError: true,
        reason: "reconnecting",
      };
    }
    const hadCookie = Boolean(
      (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
        (await getCookie(COOKIE_NAMES.LEGACY_SESSION))
    );
    return {
      authenticated: false,
      reason: hadCookie ? "session_expired" : "no_session",
      hadCookie,
    };
  }
  return {
    authenticated: true,
    user: student.user,
    session: student.session,
  };
});

/**
 * Returns current authenticated admin or student user without throwing.
 */
export const getCurrentUser = cache(async () => {
  const student = await getCurrentStudent();
  if (student && student.authenticated) return student;
  const admin = await getCurrentAdmin();
  if (admin && admin.authenticated) return admin;
  return null;
});

/**
 * For page components: verifies admin session.
 * Redirects to /admin-login if unauthenticated.
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
    const target = `/admin-login?reason=expired&next=${encodeURIComponent(
      currentPath
    )}`;
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
 * A transient DB or network error NEVER logs out or redirects; it renders with reconnecting flag.
 */
export async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student || !student.authenticated) {
    // If transient DB error, do NOT redirect to login; allow render to keep student on page
    if (student?.transientError) {
      return {
        authenticated: true,
        transientError: true,
        user: {
          _id: "transient",
          name: "Student",
          loginId: "STUDENT",
          role: "student",
        },
        session: { _id: "transient", deviceId: "" },
      };
    }

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

    const rawStudentToken =
      (await getCookie(COOKIE_NAMES.STUDENT_SESSION)) ||
      (await getCookie(COOKIE_NAMES.LEGACY_SESSION));
    const hadStudentCookie = Boolean(rawStudentToken);

    let specificReason = "login_required";
    if (hadStudentCookie) {
      specificReason = "expired";
      try {
        const tokenHash = hashToken(rawStudentToken);
        const sess = await Session.findOne({ tokenHash }).lean();
        if (sess) {
          if (
            sess.revokedReason === "device_removed" ||
            sess.revokedReason === "device_revoked"
          ) {
            specificReason = "device_removed";
          } else if (sess.revokedReason === "device_pending") {
            specificReason = "device_pending";
          } else if (sess.revoked) {
            specificReason = "logged_in_elsewhere";
          } else if (new Date(sess.expiresAt) <= new Date()) {
            specificReason = "expired";
          }
        }
      } catch {
        specificReason = "expired";
      }
    }

    const target = `/student-login?reason=${specificReason}&next=${encodeURIComponent(
      currentPath
    )}`;
    if (hadStudentCookie) {
      redirect(
        `/api/auth/clear?cookie=student&to=${encodeURIComponent(target)}`
      );
    } else {
      redirect(target);
    }
  }

  return student;
}

/**
 * For API routes and server actions: verifies admin session.
 */
export async function requireAdminApi() {
  const status = await getAdminAuthStatus();
  if (!status.authenticated) {
    const res = NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        reason: status.reason || "unauthorized",
      },
      { status: 401 }
    );
    return { authenticated: false, response: res };
  }
  return { authenticated: true, user: status.user, session: status.session };
}

/**
 * For API routes and server actions: verifies student session.
 */
export async function requireStudentApi() {
  const status = await getStudentAuthStatus();
  if (!status.authenticated) {
    if (status.transientError) {
      const res = NextResponse.json(
        {
          success: false,
          error: "Temporary server reconnecting, please retry",
          reason: "reconnecting",
        },
        { status: 503 }
      );
      return { authenticated: false, response: res };
    }
    const res = NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        reason: status.reason || "unauthorized",
      },
      { status: 401 }
    );
    return { authenticated: false, response: res };
  }
  return { authenticated: true, user: status.user, session: status.session };
}

/**
 * Atomically creates or replaces an existing session for a (userId, deviceId) pair.
 * Uses a single findOneAndUpdate with upsert keyed by { userId, deviceId }.
 * Updates tokenHash, timestamps, expiresAt, and sets revoked: false.
 * Overwriting tokenHash automatically invalidates the old session token.
 * Catches rare duplicate key race (E11000) on simultaneous insert and retries once as an update.
 */
export async function createOrReplaceSession({
  userId,
  deviceId,
  tokenHash,
  expiresAt,
  role = "student",
  ip = "",
  userAgent = "",
  lastSeenAt = new Date(),
}) {
  await connectDB();
  const now = new Date();
  const filter = { userId, deviceId };
  const update = {
    $set: {
      tokenHash,
      expiresAt,
      role,
      ip: ip || "",
      userAgent: userAgent || "",
      lastSeenAt: lastSeenAt || now,
      revoked: false,
      revokedReason: "",
      updatedAt: now,
    },
    $setOnInsert: {
      createdAt: now,
    },
  };
  const options = {
    upsert: true,
    returnDocument: "after",
    setDefaultsOnInsert: true,
  };

  try {
    const doc = await Session.findOneAndUpdate(filter, update, options);
    return doc;
  } catch (err) {
    const isE11000 =
      err &&
      (err.code === 11000 ||
        err.codeName === "DuplicateKey" ||
        String(err.message).includes("E11000") ||
        String(err.message).includes("duplicate key"));
    if (isE11000) {
      const retryDoc = await Session.findOneAndUpdate(filter, update, { returnDocument: "after" });
      if (retryDoc) return retryDoc;
    }
    throw err;
  }
}

