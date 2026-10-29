import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { ResultPdf } from "@/lib/models/ResultPdf";
import { cloudinary } from "@/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit.js";

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectDB();
    const resultDoc = await ResultPdf.findById(id);
    if (!resultDoc) {
      return NextResponse.json({ error: "Result PDF not found." }, { status: 404 });
    }

    // Delete asset from Cloudinary
    if (resultDoc.publicId) {
      try {
        await cloudinary.uploader.destroy(resultDoc.publicId, {
          resource_type: "raw",
        });
      } catch {
        // Continue DB deletion even if cloud delete logs warning
      }
    }

    await ResultPdf.findByIdAndDelete(id);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "result_pdf.deleted",
      targetType: "ResultPdf",
      targetId: id,
      meta: { title: resultDoc.title, year: resultDoc.year },
    });

    return NextResponse.json({
      success: true,
      message: "Result PDF and Cloudinary file deleted successfully.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete result PDF." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}
