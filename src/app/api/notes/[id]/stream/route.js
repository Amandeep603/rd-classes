import { NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { getCurrentStudent, getCurrentAdmin } from "@/server/auth/session.js";
import { checkNoteAccess } from "@/server/services/noteService.js";
import { cloudinary } from "@/lib/cloudinary";

export const instant = false;

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
  }

  const studentAuth = await getCurrentStudent();
  const adminAuth = !studentAuth ? await getCurrentAdmin() : null;
  const user = studentAuth?.user || adminAuth?.user || null;

  const { allowed, reason, note } = await checkNoteAccess(id, user);
  if (!allowed || !note) {
    if (reason === "not_found") {
      return NextResponse.json({ error: "Note not found or unpublished." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Access denied. Active enrollment or free preview access is required." },
      { status: 403 }
    );
  }

  // Link notes cannot be streamed
  if (note.source === "link") {
    if (note.externalUrl) {
      return NextResponse.redirect(note.externalUrl);
    }
    return NextResponse.json({ error: "External link URL not available." }, { status: 400 });
  }

  // File notes: stream directly or redirect to signed Cloudinary URL
  const fileUrl = note.fileUrl || "";
  const filename = `${note.title.replace(/[^a-zA-Z0-9_\-\. ]/g, "") || "document"}.pdf`;

  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";
  const disposition = isDownload ? "attachment" : "inline";

  // If publicId is available and Cloudinary is configured, generate a short-lived signed URL
  if (note.publicId && process.env.CLOUDINARY_API_SECRET) {
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      const signedUrl = cloudinary.utils.private_download_url(
        note.publicId,
        "pdf",
        {
          expires_at: expiresAt,
          attachment: isDownload,
        }
      );
      if (signedUrl) {
        return NextResponse.redirect(signedUrl);
      }
    } catch {
      // Fallback to streaming buffer below
    }
  }

  if (fileUrl.startsWith("/api/dev-uploads/")) {
    const relPath = fileUrl.replace(/^\/api\/dev-uploads\//, "");
    const fullPath = path.resolve(process.cwd(), ".local-uploads", relPath);

    if (!fsSync.existsSync(fullPath)) {
      return NextResponse.json({ error: "File asset not found on disk." }, { status: 404 });
    }

    const buffer = await fs.readFile(fullPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": note.contentType || "application/pdf",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    try {
      const upstream = await fetch(fileUrl);
      if (!upstream.ok) {
        return NextResponse.json({ error: "Failed to retrieve file from storage." }, { status: 502 });
      }

      const blob = await upstream.arrayBuffer();
      return new Response(blob, {
        headers: {
          "Content-Type": note.contentType || upstream.headers.get("content-type") || "application/pdf",
          "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch {
      return NextResponse.json({ error: "Storage connection timed out." }, { status: 504 });
    }
  }

  return NextResponse.json({ error: "File not accessible or storage not configured." }, { status: 404 });
}
