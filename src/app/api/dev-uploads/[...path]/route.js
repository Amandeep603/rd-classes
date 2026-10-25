import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { path: pathSegments } = await params;
  if (!pathSegments || !Array.isArray(pathSegments)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Prevent path traversal
  const safePath = pathSegments.join("/");
  if (safePath.includes("..") || safePath.includes(":") || safePath.startsWith("/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const fullPath = path.resolve(process.cwd(), ".local-uploads", safePath);
  const uploadsDir = path.resolve(process.cwd(), ".local-uploads");
  if (!fullPath.startsWith(uploadsDir) || !fs.existsSync(fullPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".avif") contentType = "image/avif";
  else if (ext === ".pdf") contentType = "application/pdf";

  const fileStream = fs.createReadStream(fullPath);

  return new NextResponse(fileStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
