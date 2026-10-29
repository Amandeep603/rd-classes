import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { ResultPdf } from "@/lib/models/ResultPdf";
import { cloudinary } from "@/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit.js";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB Cloudinary limit

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const results = await ResultPdf.find().sort({ year: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, results, resultPdfs: results });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch result PDFs." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let classLabel = "Class 12";
    let year = new Date().getFullYear().toString();
    let fileUrl = "";
    let publicId = "";
    let fileSize = 0;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      title = (body.title || "").trim();
      classLabel = (body.classLabel || "Class 12").trim();
      year = String(body.year || new Date().getFullYear()).trim();
      fileUrl = body.fileUrl || "";
      publicId = body.publicId || "";
      fileSize = Number(body.fileSize || 0);

      if (!title) {
        return NextResponse.json({ error: "Result sheet title is required." }, { status: 400 });
      }
      if (!fileUrl) {
        return NextResponse.json({ error: "PDF URL or file is required." }, { status: 400 });
      }
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      title = (formData.get("title") || "").trim();
      classLabel = (formData.get("classLabel") || "Class 12").trim();
      year = (formData.get("year") || new Date().getFullYear().toString()).trim();

      if (!file) {
        return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
      }

      if (!title) {
        return NextResponse.json({ error: "Result sheet title is required." }, { status: 400 });
      }

      // 1. Server-side validation: PDF only
      const mime = file.type || "";
      const isPdf = mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return NextResponse.json(
          { error: "Invalid file format. Only PDF files are allowed." },
          { status: 400 }
        );
      }

      // 2. Server-side validation: Max 10 MB
      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: "File exceeds 10 MB limit (Cloudinary free tier max)." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary folder rd-classes/results with resource_type: "raw", type: "upload" (public)
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "rd-classes/results",
            resource_type: "raw",
            type: "upload",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
      fileSize = file.size;
    }

    await connectDB();
    const resultDoc = await ResultPdf.create({
      title,
      classLabel,
      year,
      fileUrl,
      publicId,
      sizeBytes: fileSize,
      fileSize,
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "result_pdf.uploaded",
      targetType: "ResultPdf",
      targetId: resultDoc._id.toString(),
      meta: { title, classLabel, year, sizeBytes: fileSize },
    });

    return NextResponse.json({ success: true, result: resultDoc, resultPdf: resultDoc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to upload result PDF." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}
