import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { getStorageDriver } from "@/server/storage/index.js";
import { saveLocalFile } from "@/server/storage/localDriver.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;
  const admin = auth;

  const driver = getStorageDriver();

  // If local storage driver is explicitly enabled (dev only)
  if (driver === "local") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const kind = formData.get("kind") || "image";

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const relPath = `${kind}/${year}/${month}/${randomSuffix}-${safeName}`;

      const saved = await saveLocalFile(relPath, buffer);
      return NextResponse.json(saved);
    }
  }

  // Production Vercel Blob client direct upload token generation
  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let kind = "image";
        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload);
            if (parsed.kind === "pdf") kind = "pdf";
          } catch {
            // default to image
          }
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const prefixedPathname = `${kind}/${year}/${month}/${pathname.replace(/^\/+/, "")}`;

        return {
          allowedContentTypes:
            kind === "pdf"
              ? ["application/pdf"]
              : ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: kind === "pdf" ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          pathname: prefixedPathname,
          tokenPayload: JSON.stringify({
            adminId: admin.user._id,
            kind,
          }),
        };
      },
      onUploadCompleted: async () => {
        // As per spec: Do not rely on onUploadCompleted (does not fire on localhost).
        // Assets are registered via registerAsset server action immediately after client upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Upload handler error" },
      { status: 400 }
    );
  }
}
