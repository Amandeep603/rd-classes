import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Review } from "@/lib/models/Review";
import { logAuditEvent } from "@/server/services/audit.js";

const reviewSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  meta: z.string().optional().default(""),
  role: z.enum(["student", "parent"]).default("student"),
  rating: z.number().min(1).max(5).default(5),
  quote: z.string().min(1, "Testimonial quote is required").trim(),
  published: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, reviews });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch reviews." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      // Check if isPublished was used instead of published
      if (body.isPublished !== undefined && body.published === undefined) {
        body.published = body.isPublished;
      }
      const retryParsed = reviewSchema.safeParse(body);
      if (!retryParsed.success) {
        return Response.json(
          { error: retryParsed.error.issues[0]?.message || "Invalid data." },
          { status: 400 }
        );
      }
      Object.assign(parsed, retryParsed);
    }

    await connectDB();
    const review = await Review.create(parsed.data);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "review.created",
      entity: "Review",
      entityId: review._id.toString(),
      meta: { name: review.name, rating: review.rating, published: review.published },
    });

    return Response.json({ success: true, review }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to create review." },
      { status: 500 }
    );
  }
}
