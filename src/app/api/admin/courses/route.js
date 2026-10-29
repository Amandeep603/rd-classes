import { requireAdmin } from "@/server/auth/session.js";
import {
  getAdminCourses,
  createCourse,
  invalidateCoursesCache,
} from "@/server/services/courseService.js";

export async function GET() {
  try {
    await requireAdmin();
    const courses = await getAdminCourses();
    return Response.json({ success: true, courses });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch courses." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return Response.json({ error: "Title is required." }, { status: 400 });
    }

    const course = await createCourse(body, admin.user._id);
    await invalidateCoursesCache();

    return Response.json({ success: true, course }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to create course." },
      { status: 500 }
    );
  }
}
