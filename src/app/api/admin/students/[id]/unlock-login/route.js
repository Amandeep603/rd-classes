import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { LoginAttempt } from "@/server/db/models/LoginAttempt";

function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request, context) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await context.params;
    await connectDB();

    const student = await User.findById(id).lean();
    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const reg = new RegExp(`:${escapeRegex(student.loginId)}$`, "i");
    const result = await LoginAttempt.deleteMany({ key: { $regex: reg } });

    return NextResponse.json({
      success: true,
      message: `Unlocked login for ${student.name} (${student.loginId}). Removed ${result.deletedCount} lockout records.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

