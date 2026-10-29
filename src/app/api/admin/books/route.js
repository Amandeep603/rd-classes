import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    await connectDB();
    const filter = courseId ? { courseId } : {};
    const books = await Book.find(filter).sort({ position: 1, createdAt: 1 }).lean();

    return Response.json({ success: true, books });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, title, status = "draft" } = body;

    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    await connectDB();

    const maxBook = await Book.findOne({ courseId }).sort({ position: -1 }).select("position").lean();
    const position = typeof body.position === "number" ? body.position : (maxBook?.position ?? -1) + 1;

    const book = await Book.create({
      courseId,
      title: title.trim(),
      position,
      status: status === "published" ? "published" : "draft",
    });

    await invalidateCoursesCache();

    return Response.json({ success: true, book });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

