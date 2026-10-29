import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { getCookie, COOKIE_NAMES } from "@/server/auth/cookies.js";
import { hashToken } from "@/server/auth/tokens.js";
import { logAuditEvent } from "@/server/services/audit.js";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    const body = await request.json();

    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid password data." },
        { status: 400 }
      );
    }

    await connectDB();
    const adminUser = await User.findById(auth.user._id);
    if (!adminUser) {
      return Response.json({ error: "Admin user not found." }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, adminUser.passwordHash);
    if (!isCurrentValid) {
      return Response.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    // Hash and update password
    adminUser.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await adminUser.save();

    // Log out other admin sessions after the change
    const currentAdminToken = await getCookie(COOKIE_NAMES.ADMIN_SESSION);
    if (currentAdminToken) {
      const currentTokenHash = hashToken(currentAdminToken);
      await Session.deleteMany({
        userId: adminUser._id,
        tokenHash: { $ne: currentTokenHash },
      });
    }

    await logAuditEvent({
      actorId: auth.user._id,
      action: "admin.password_changed",
      entity: "User",
      entityId: adminUser._id.toString(),
      meta: { message: "Password updated and other admin sessions revoked." },
    });

    return Response.json({
      success: true,
      message: "Password changed successfully. Other sessions logged out.",
    });
  } catch (err) {
    return Response.json({ error: err?.message || "Failed to change password." }, { status: 500 });
  }
}
