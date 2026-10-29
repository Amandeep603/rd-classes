import bcrypt from "bcryptjs";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { logAuditEvent } from "@/server/services/audit.js";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Both current and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(admin.user._id);
    if (!user) {
      return Response.json({ error: "Admin account not found." }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "admin.password_changed",
      entity: "User",
      entityId: user._id.toString(),
      meta: { email: user.email },
    });

    return Response.json({ success: true, message: "Admin password updated successfully." });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to change admin password." },
      { status: 500 }
    );
  }
}
