import { requireAdmin } from "@/server/auth/session.js";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return Response.json({ error: "No files provided." }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      const mime = file.type || "";
      if (!mime.includes("image") && !file.name.match(/\.(png|webp|jpg|jpeg)$/i)) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "rd-classes/gallery",
            resource_type: "image",
            format: "webp",
            transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto:good" }],
          },
          (error, res) => {
            if (error) reject(error);
            else resolve(res);
          }
        );
        uploadStream.end(buffer);
      });

      uploaded.push({
        imageUrl: result.secure_url,
        publicId: result.public_id,
        caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      });
    }

    return Response.json({ success: true, uploaded });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to upload gallery images." },
      { status: 500 }
    );
  }
}
