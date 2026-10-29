import { requireAdmin } from "@/server/auth/session.js";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No photo provided." }, { status: 400 });
    }

    // Validate size (max 2MB on server; client compresses under 200KB)
    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: "Photo must be under 2 MB." }, { status: 400 });
    }

    // Validate mime/extension
    const mime = file.type || "";
    if (!mime.includes("image") && !file.name.match(/\.(png|webp|jpg|jpeg)$/i)) {
      return Response.json(
        { error: "Only image files (PNG, WebP, JPG) are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "rd-classes/toppers",
          resource_type: "image",
          format: "webp",
          transformation: [
            { width: 600, height: 600, crop: "fill", gravity: "face" },
            { quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return Response.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to upload topper photo." },
      { status: 500 }
    );
  }
}
