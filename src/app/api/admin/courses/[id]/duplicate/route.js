import { requireAdmin } from "@/server/auth/session.js";
import {
  duplicateCourse,
  invalidateCoursesCache,
} from "@/server/services/courseService.js";

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const duplicate = await duplicateCourse(id, admin.user._id);
    await invalidateCoursesCache();

    return Response.json({ success: true, course: duplicate });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
