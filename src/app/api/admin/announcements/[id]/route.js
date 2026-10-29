import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Announcement } from "@/lib/models/Announcement";
import { logAuditEvent } from "@/server/services/audit.js";

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return Response.json({ error: "Announcement not found." }, { status: 404 });
    }

    if (body.title !== undefined) announcement.title = body.title.trim();
    if (body.body !== undefined) announcement.body = body.body.trim();
    if (body.audience !== undefined) {
      announcement.audience = typeof body.audience === "string" ? body.audience.trim() : body.audience;
    }
    if (body.pinned !== undefined) announcement.pinned = Boolean(body.pinned);
    if (body.expiresAt !== undefined) {
      const exp = body.expiresAt ? new Date(body.expiresAt) : null;
      announcement.expiresAt = exp;
      announcement.endsAt = exp;
    }
    if (body.active !== undefined) announcement.active = Boolean(body.active);

    await announcement.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "announcement.updated",
      entity: "Announcement",
      entityId: id,
      meta: { title: announcement.title, pinned: announcement.pinned },
    });

    return Response.json({ success: true, announcement });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to update announcement." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectDB();
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return Response.json({ error: "Announcement not found." }, { status: 404 });
    }

    await logAuditEvent({
      actorId: admin.user._id,
      action: "announcement.deleted",
      entity: "Announcement",
      entityId: id,
      meta: { title: announcement.title },
    });

    return Response.json({ success: true, message: "Announcement deleted successfully." });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to delete announcement." },
      { status: 500 }
    );
  }
}
