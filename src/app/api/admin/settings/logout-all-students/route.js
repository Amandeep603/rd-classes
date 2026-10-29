import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Session } from "@/lib/models/Session";
import { logAuditEvent } from "@/server/services/audit.js";

export async function POST() {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const studentUsers = await User.find({ role: "student" }).select("_id").lean();
    const studentIds = studentUsers.map((u) => u._id);

    const deleteResult = await Session.deleteMany({
      $or: [
        { role: "student" },
        { userId: { $in: studentIds } },
      ],
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "sessions.revoked_all_students",
      entity: "Session",
      entityId: "all_students",
      meta: { revokedCount: deleteResult.deletedCount },
    });

    return Response.json({
      success: true,
      message: `Successfully logged out all students. ${deleteResult.deletedCount} session(s) revoked.`,
      revokedCount: deleteResult.deletedCount,
      clearedSessionsCount: deleteResult.deletedCount,
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to log out all students." },
      { status: 500 }
    );
  }
}
