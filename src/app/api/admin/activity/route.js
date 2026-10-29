import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { ActivityLog } from "@/lib/models/ActivityLog";

export async function GET(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit")) || 50));
    const search = (searchParams.get("search") || "").trim();

    let query = {};
    if (search) {
      query = {
        $or: [
          { action: { $regex: search, $options: "i" } },
          { entity: { $regex: search, $options: "i" } },
          { entityId: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("actorId", "name email loginId role")
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return Response.json({ success: true, logs, activities: logs, total });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch activity logs." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
