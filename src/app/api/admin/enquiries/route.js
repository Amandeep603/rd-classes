import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enquiry } from "@/lib/models/Enquiry";

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");

    await connectDB();

    const query = {};
    if (status && status !== "all") query.status = status;
    if (courseId && courseId !== "all") query.courseId = courseId;

    const enquiries = await Enquiry.find(query)
      .populate("courseId", "title slug theme classLabel")
      .populate("studentId", "name loginId phone className")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ success: true, enquiries });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

