import { requireAdmin } from "@/server/auth/session.js";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate image format
    const mime = file.type || "";
    if (!mime.includes("image") && !file.name.match(/\.(png|webp|jpg|jpeg|svg)$/i)) {
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
          folder: "rd-classes/courses",
          resource_type: "image",
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
      { error: err?.message || "Failed to upload illustration." },
      { status: 500 }
    );
  }
}
