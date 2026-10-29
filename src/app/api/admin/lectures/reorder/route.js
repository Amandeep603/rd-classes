import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return Response.json({ error: "orderedIds array is required" }, { status: 400 });
    }

    await connectDB();

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            position: index + 1,
            order: index + 1,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Lecture.bulkWrite(bulkOps);
    }

    await invalidateCoursesCache();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
