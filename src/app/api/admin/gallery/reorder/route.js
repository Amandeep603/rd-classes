import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { GalleryItem } from "@/lib/models/GalleryItem";

export async function POST(request) {
  try {
    await requireAdmin();
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return Response.json({ error: "Items array required." }, { status: 400 });
    }

    await connectDB();
    await Promise.all(
      items.map((item, idx) =>
        GalleryItem.findByIdAndUpdate(item._id || item.id, { position: idx })
      )
    );

    return Response.json({ success: true, message: "Gallery reordered successfully." });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to reorder gallery." },
      { status: 500 }
    );
  }
}
