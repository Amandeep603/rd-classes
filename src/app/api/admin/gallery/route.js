import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { GalleryItem } from "@/lib/models/GalleryItem";
import { logAuditEvent } from "@/server/services/audit.js";

const galleryItemInputSchema = z.object({
  type: z.enum(["image", "video"]).optional().default("image"),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  posterUrl: z.string().optional().default(""),
  publicId: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
  position: z.number().optional().default(0),
  order: z.number().optional().default(0),
  showOnHome: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const items = await GalleryItem.find().sort({ position: 1, order: 1, createdAt: -1 }).lean();
    return Response.json({ success: true, items });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch gallery items." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    await connectDB();

    // Support single item or array of items
    if (Array.isArray(body)) {
      const created = [];
      const count = await GalleryItem.countDocuments();
      let pos = count;

      for (const item of body) {
        const parsed = galleryItemInputSchema.safeParse(item);
        if (parsed.success) {
          const itemUrl = parsed.data.url || parsed.data.imageUrl;
          if (!itemUrl) continue;

          const doc = await GalleryItem.create({
            ...parsed.data,
            url: itemUrl,
            imageUrl: itemUrl,
            position: parsed.data.position || pos,
            order: parsed.data.order || pos,
          });
          pos++;
          created.push(doc);
        }
      }

      await logAuditEvent({
        actorId: admin.user._id,
        action: "gallery.batch_created",
        entity: "GalleryItem",
        entityId: "batch",
        meta: { count: created.length },
      });

      return Response.json({ success: true, items: created }, { status: 201 });
    }

    const parsed = galleryItemInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid gallery data." },
        { status: 400 }
      );
    }

    const itemUrl = parsed.data.url || parsed.data.imageUrl;
    if (!itemUrl) {
      return Response.json({ error: "Media URL is required." }, { status: 400 });
    }

    const maxItem = await GalleryItem.findOne().sort({ position: -1 }).select("position").lean();
    const nextPos = (maxItem?.position ?? -1) + 1;

    const item = await GalleryItem.create({
      ...parsed.data,
      url: itemUrl,
      imageUrl: itemUrl,
      position: parsed.data.position || nextPos,
      order: parsed.data.order || nextPos,
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "gallery.created",
      entity: "GalleryItem",
      entityId: item._id.toString(),
      meta: { caption: item.caption, type: item.type },
    });

    return Response.json({ success: true, item }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to create gallery item." },
      { status: 500 }
    );
  }
}
