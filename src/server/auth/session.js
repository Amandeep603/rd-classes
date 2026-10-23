import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import connectDB from "../db/connect.js";
import { Session } from "../db/models/Session.js";
import { User } from "../db/models/User.js";
import { Device } from "../db/models/Device.js";
import { getCookie, deleteCookie, COOKIE_NAMES } from "./cookies.js";
import { hashToken } from "./tokens.js";

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Returns current authenticated student or admin user.
 * Memoized per request using React cache.
 */
export const getCurrentUser = cache(async () => {
  await connection();
  const studentToken = await getCookie(COOKIE_NAMES.SESSION);
  const adminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);

  if (!studentToken && !adminToken) {
    return null;
  }

  await connectDB();
  const now = new Date();

  // 1. Check student session cookie
  if (studentToken) {
    const tokenHash = hashToken(studentToken);
    const session = await Session.findOne({ tokenHash }).lean();

    if (!session || new Date(session.expiresAt) <= now) {
      if (session) {
        await Session.deleteOne({ _id: session._id });
      }
      await deleteCookie(COOKIE_NAMES.SESSION);
      return null;
    }

    const user = await User.findById(session.userId).lean();
    if (!user || user.status === "blocked") {
      await Session.deleteOne({ _id: session._id });
      await deleteCookie(COOKIE_NAMES.SESSION);
      return null;
    }

    // Student device check: the device must still be approved
    if (user.role === "student") {
      const deviceExists = await Device.exists({
        userId: user._id,
        deviceId: session.deviceId,
      });

      if (!deviceExists) {
        // Device was removed or reset by admin
        await Session.deleteOne({ _id: session._id });
        await deleteCookie(COOKIE_NAMES.SESSION);
        return null;
      }
    }

    // Throttled lastSeenAt update (at most every 10 minutes)
    if (now.getTime() - new Date(session.lastSeenAt).getTime() > TEN_MINUTES_MS) {
      await Session.updateOne({ _id: session._id }, { lastSeenAt: now });
    }

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        loginId: user.loginId,
        role: user.role,
        status: user.status,
        deviceLimit: user.deviceLimit,
        deviceCount: user.deviceCount,
        mustChangePassword: user.mustChangePassword,
        phone: user.phone || "",
      },
      session: {
        _id: session._id.toString(),
        deviceId: session.deviceId,
      },
    };
  }

  // 2. Check admin session cookie
  if (adminToken) {
    const tokenHash = hashToken(adminToken);
    const session = await Session.findOne({ tokenHash }).lean();

    if (!session || new Date(session.expiresAt) <= now) {
      if (session) {
        await Session.deleteOne({ _id: session._id });
      }
      await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
      return null;
    }

    const user = await User.findById(session.userId).lean();
    if (!user || user.role !== "admin" || user.status === "blocked") {
      await Session.deleteOne({ _id: session._id });
      await deleteCookie(COOKIE_NAMES.ADMIN_SESSION);
      return null;
    }

    if (now.getTime() - new Date(session.lastSeenAt).getTime() > TEN_MINUTES_MS) {
      await Session.updateOne({ _id: session._id }, { lastSeenAt: now });
    }

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        loginId: user.loginId,
        role: user.role,
        status: user.status,
        phone: user.phone || "",
      },
      session: {
        _id: session._id.toString(),
        deviceId: session.deviceId,
      },
    };
  }

  return null;
});

export async function requireStudent() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    throw new Error("UNAUTHORIZED_STUDENT");
  }
  return auth;
}

export async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return auth;
}
