import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Review } from "@/lib/models/Review";
import { logAuditEvent } from "@/server/services/audit.js";

const updateReviewSchema = z.object({
  name: z.string().min(1).optional(),
  meta: z.string().optional(),
  role: z.enum(["student", "parent"]).optional(),
  rating: z.number().min(1).max(5).optional(),
  quote: z.string().min(1).optional(),
  published: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid data." },
        { status: 400 }
      );
    }

    await connectDB();
    const review = await Review.findById(id);
    if (!review) {
      return Response.json({ error: "Review not found." }, { status: 404 });
    }

    Object.assign(review, parsed.data);
    await review.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "review.updated",
      entity: "Review",
      entityId: id,
      meta: { name: review.name, published: review.published },
    });

    return Response.json({ success: true, review });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to update review." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await connectDB();
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return Response.json({ error: "Review not found." }, { status: 404 });
    }

    await logAuditEvent({
      actorId: admin.user._id,
      action: "review.deleted",
      entity: "Review",
      entityId: id,
      meta: { name: review.name },
    });

    return Response.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}
