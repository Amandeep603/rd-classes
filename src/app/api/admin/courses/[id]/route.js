import { requireAdmin } from "@/server/auth/session.js";
import {
  getCourseById,
  updateCourse,
  deleteCourse,
  invalidateCoursesCache,
} from "@/server/services/courseService.js";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const course = await getCourseById(id);
    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    return Response.json({ success: true, course });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const course = await updateCourse(id, body, admin.user._id);
    await invalidateCoursesCache();

    return Response.json({ success: true, course });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await deleteCourse(id, admin.user._id);
    await invalidateCoursesCache();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 400 });
  }
}
