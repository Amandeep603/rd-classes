import { requireStudentApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Announcement } from "@/lib/models/Announcement";
import { Enrollment } from "@/lib/models/Enrollment";

export async function GET() {
  const auth = await requireStudentApi();
  if (!auth.authenticated) return auth.response;
  const student = auth;

  try {
    await connectDB();

    // Find student's active enrollments using single source of truth
    const { getStudentCourseAccess } = await import("@/server/services/studentAccessService.js");
    const access = await getStudentCourseAccess(student.user);
    const enrolledCourseIds = access.enrolledCourseIds;
    const now = new Date();

    const announcement = await Announcement.findOne({
      $and: [
        { $or: [{ active: true }, { active: { $exists: false } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $or: [
            { audience: "all" },
            { audience: { $in: enrolledCourseIds } },
            { "audience.all": true },
          ],
        },
      ],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return Response.json({ success: true, announcement });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch student announcement." },
      { status: 500 }
    );
  }
}
