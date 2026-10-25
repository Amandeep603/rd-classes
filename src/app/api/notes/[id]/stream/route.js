import { NextResponse } from "next/server";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { getCurrentUser } from "@/server/auth/session.js";
import { checkNoteAccess } from "@/server/services/noteService.js";

export const instant = false;

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
  }

  const auth = await getCurrentUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const { allowed, reason, note } = await checkNoteAccess(id, auth.user);
  if (!allowed || !note) {
    if (reason === "not_found") {
      return NextResponse.json({ error: "Note not found or unpublished." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Access denied. Active enrollment in the linked course is required." },
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

  // File notes: stream directly without revealing storage key
  const fileUrl = note.fileUrl || "";
  const filename = `${note.title.replace(/[^a-zA-Z0-9_\-\. ]/g, "") || "document"}.pdf`;

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
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
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
          "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (err) {
      return NextResponse.json({ error: err.message || "Failed to stream note." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid note storage path." }, { status: 400 });
}
