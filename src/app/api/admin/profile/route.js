import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { logAuditEvent } from "@/server/services/audit.js";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address.").or(z.literal("")),
  phone: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    await connectDB();
    const adminUser = await User.findById(auth.user._id).select("name email phone photoUrl avatarUrl loginId role").lean();
    if (!adminUser) {
      return Response.json({ error: "Admin user not found" }, { status: 404 });
    }
    return Response.json({
      success: true,
      user: {
        _id: adminUser._id.toString(),
        name: adminUser.name || "Ronak Dugar",
        email: adminUser.email || "",
        phone: adminUser.phone || "",
        loginId: adminUser.loginId,
        photoUrl: adminUser.photoUrl || adminUser.avatarUrl || "",
        role: adminUser.role,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin();
    const body = await request.json();

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return Response.json(
        { error: firstIssue?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    await connectDB();
    const adminUser = await User.findById(auth.user._id);
    if (!adminUser) {
      return Response.json({ error: "Admin user not found" }, { status: 404 });
    }

    adminUser.name = parsed.data.name;
    if (parsed.data.email !== undefined) {
      adminUser.email = parsed.data.email.toLowerCase();
    }
    if (parsed.data.phone !== undefined) {
      adminUser.phone = parsed.data.phone;
    }
    if (parsed.data.photoUrl !== undefined) {
      adminUser.photoUrl = parsed.data.photoUrl;
      adminUser.avatarUrl = parsed.data.photoUrl;
    }

    await adminUser.save();

    await logAuditEvent({
      actorId: auth.user._id,
      action: "admin.profile_updated",
      entity: "User",
      entityId: adminUser._id.toString(),
      meta: { name: adminUser.name, email: adminUser.email },
    });

    return Response.json({
      success: true,
      user: {
        _id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        loginId: adminUser.loginId,
        photoUrl: adminUser.photoUrl || adminUser.avatarUrl || "",
      },
    });
  } catch (err) {
    return Response.json({ error: err?.message || "Failed to update profile." }, { status: 500 });
  }
}
