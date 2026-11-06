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
    if (typeof body.position === "number") {
      item.position = body.position;
      item.order = body.position;
    }
    if (typeof body.order === "number") {
      item.order = body.order;
      item.position = body.order;
    }
    if (typeof body.showOnHome === "boolean") {
      item.showOnHome = body.showOnHome;
    }

    await item.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "gallery.updated",
      entity: "GalleryItem",
      entityId: id,
      meta: {
        caption: item.caption,
        position: item.position,
        showOnHome: item.showOnHome,
      },
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

    // Delete asset from Cloudinary (image or video)
    if (item.publicId) {
      try {
        const resourceType = item.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(item.publicId, { resource_type: resourceType });
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
      meta: { caption: item.caption, type: item.type },
    });

    return Response.json({
      success: true,
      message: "Gallery item and media asset deleted successfully.",
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to delete gallery item." },
      { status: 500 }
    );
  }
}
