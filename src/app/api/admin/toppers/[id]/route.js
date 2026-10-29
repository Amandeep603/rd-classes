import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Topper } from "@/lib/models/Topper";
import { cloudinary } from "@/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit.js";

const updateTopperSchema = z.object({
  name: z.string().min(1).optional(),
  school: z.string().min(1).optional(),
  year: z.coerce.string().optional(),
  marks: z.coerce.string().min(1).optional(),
  photoUrl: z.string().optional(),
  publicId: z.string().optional(),
  featured: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateTopperSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid data." },
        { status: 400 }
      );
    }

    await connectDB();
    const topper = await Topper.findById(id);
    if (!topper) {
      return NextResponse.json({ error: "Topper not found." }, { status: 404 });
    }

    // If changing photo and old publicId exists, remove old one from Cloudinary
    if (parsed.data.publicId && topper.publicId && parsed.data.publicId !== topper.publicId) {
      try {
        await cloudinary.uploader.destroy(topper.publicId);
      } catch {
        // Continue update even if old asset removal errors
      }
    }

    Object.assign(topper, parsed.data);
    await topper.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "topper.updated",
      targetType: "Topper",
      targetId: topper._id.toString(),
      meta: { name: topper.name, marks: topper.marks },
    });

    return NextResponse.json({ success: true, topper });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to update topper." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectDB();
    const topper = await Topper.findById(id);
    if (!topper) {
      return NextResponse.json({ error: "Topper not found." }, { status: 404 });
    }

    if (topper.publicId) {
      try {
        await cloudinary.uploader.destroy(topper.publicId);
      } catch {
        // Continue deletion
      }
    }

    await Topper.findByIdAndDelete(id);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "topper.deleted",
      targetType: "Topper",
      targetId: id,
      meta: { name: topper.name, marks: topper.marks },
    });

    return NextResponse.json({ success: true, message: "Topper deleted successfully." });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete topper." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}
