import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { GalleryItem } from "@/lib/models/GalleryItem";
import { cloudinary } from "@/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit.js";

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const item = await GalleryItem.findById(id);
    if (!item) {
      return Response.json({ error: "Gallery item not found." }, { status: 404 });
    }

    if (body.caption !== undefined) item.caption = String(body.caption).trim();
    if (typeof body.position === "number") item.position = body.position;
    await item.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "gallery.updated",
      entity: "GalleryItem",
      entityId: id,
      meta: { caption: item.caption, position: item.position },
    });

    return Response.json({ success: true, item });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to update gallery item." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectDB();
    const item = await GalleryItem.findById(id);
    if (!item) {
      return Response.json({ error: "Gallery item not found." }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (item.publicId) {
      try {
        await cloudinary.uploader.destroy(item.publicId);
      } catch (cErr) {
        // Continue DB deletion even if cloud delete logs warning
      }
    }

    await GalleryItem.findByIdAndDelete(id);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "gallery.deleted",
      entity: "GalleryItem",
      entityId: id,
      meta: { caption: item.caption },
    });

    return Response.json({
      success: true,
      message: "Gallery item and Cloudinary file deleted successfully.",
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to delete gallery item." },
      { status: 500 }
    );
  }
}
