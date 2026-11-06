import { requireAdmin } from "@/server/auth/session.js";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await requireAdmin();

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "rd-classes/gallery";

    // Signed parameters for direct client-to-Cloudinary upload
    const paramsToSign = {
      folder,
      timestamp,
    };

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return Response.json(
        { error: "Cloudinary API secret is not configured on the server." },
        { status: 500 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    return Response.json({
      success: true,
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to generate upload signature." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

