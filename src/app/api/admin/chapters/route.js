import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Chapter } from "@/lib/models/Chapter";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const bookId = searchParams.get("bookId");

    await connectDB();
    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (bookId) filter.bookId = bookId;

    const chapters = await Chapter.find(filter).sort({ position: 1, createdAt: 1 }).lean();

    return Response.json({ success: true, chapters });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, bookId, title, status = "draft" } = body;

    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!bookId) {
      return Response.json({ error: "bookId is required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    await connectDB();

    const maxChap = await Chapter.findOne({ courseId, bookId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    const position = typeof body.position === "number" ? body.position : (maxChap?.position ?? -1) + 1;

    const chapter = await Chapter.create({
      courseId,
      bookId,
      title: title.trim(),
      position,
      status: status === "published" ? "published" : "draft",
    });

    await invalidateCoursesCache();

    return Response.json({ success: true, chapter });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

