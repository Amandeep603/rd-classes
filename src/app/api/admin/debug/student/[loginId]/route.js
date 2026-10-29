import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { LoginAttempt } from "@/server/db/models/LoginAttempt";

function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request, context) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { loginId } = await context.params;
    const cleanId = (loginId || "").trim();

    await connectDB();

    const user = await User.findOne({
      role: "student",
      $or: [
        { loginId: cleanId.toUpperCase() },
        { loginId: cleanId },
        { loginId: { $regex: new RegExp(`^${escapeRegex(cleanId)}$`, "i") } },
      ],
    }).lean();

    if (!user) {
      return NextResponse.json({
        exists: false,
        status: null,
        hasPasswordHash: false,
        hashValidFormat: false,
        failedAttemptsCount: 0,
        lockedUntil: null,
      });
    }

    const hasPasswordHash = Boolean(user.passwordHash && user.passwordHash.length > 0);
    // Standard bcrypt format: $2a$, $2b$, or $2y$ followed by 2 cost digits and 53 chars
    const hashValidFormat = Boolean(
      user.passwordHash && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.passwordHash)
    );

    // Look up login attempt records matching this student
    const attempts = await LoginAttempt.find({
      key: { $regex: new RegExp(`:${escapeRegex(user.loginId)}$`, "i") },
    }).lean();

    const failedAttemptsCount = attempts.reduce(
      (max, a) => Math.max(max, a.count || 0),
      0
    );

    const now = new Date();
    const lockedAttempt = attempts.find(
      (a) => a.lockedUntil && new Date(a.lockedUntil) > now
    );

    return NextResponse.json({
      exists: true,
      status: user.status,
      hasPasswordHash,
      hashValidFormat,
      failedAttemptsCount,
      lockedUntil: lockedAttempt ? lockedAttempt.lockedUntil : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

