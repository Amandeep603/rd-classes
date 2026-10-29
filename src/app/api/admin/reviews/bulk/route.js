import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Review } from "@/lib/models/Review";
import { logAuditEvent } from "@/server/services/audit.js";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const rawText = body.rawText || body.text;
    const providedReviews = body.reviews;

    let itemsToInsert = [];

    if (Array.isArray(providedReviews) && providedReviews.length > 0) {
      itemsToInsert = providedReviews;
    } else if (typeof rawText === "string" && rawText.trim()) {
      // Parse pipe-delimited or double-newline blocks
      const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes("|")) {
          const parts = line.split("|").map((p) => p.trim());
          if (parts.length >= 2) {
            const name = parts[0];
            const role = parts[1].toLowerCase().includes("parent") ? "parent" : "student";
            let rating = 5;
            let meta = "";
            let quote = "";

            if (parts.length >= 5) {
              rating = Number(parts[2]) || 5;
              meta = parts[3];
              quote = parts.slice(4).join(" | ");
            } else if (parts.length === 4) {
              meta = parts[2];
              quote = parts[3];
            } else if (parts.length === 3) {
              quote = parts[2];
            }

            if (name && quote) {
              itemsToInsert.push({
                name,
                role,
                rating: Math.min(5, Math.max(1, rating)),
                meta,
                quote,
                published: true,
              });
            }
          }
        } else if (line.length > 10) {
          // Single line fallback
          itemsToInsert.push({
            name: "Student Feedback",
            role: "student",
            rating: 5,
            meta: "CBSE Commerce",
            quote: line,
            published: true,
          });
        }
      }
    }

    if (itemsToInsert.length === 0) {
      return Response.json(
        { error: "No valid reviews found to import." },
        { status: 400 }
      );
    }

    await connectDB();
    const created = await Review.insertMany(itemsToInsert);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "review.bulk_imported",
      entity: "Review",
      entityId: "bulk",
      meta: { count: created.length },
    });

    return Response.json({ success: true, count: created.length, reviews: created });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to bulk import reviews." },
      { status: 500 }
    );
  }
}
