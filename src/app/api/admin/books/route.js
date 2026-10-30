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
    const books = await Book.find(filter).sort({ bookNo: 1, position: 1, createdAt: 1 }).lean();

    return Response.json({ success: true, books });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, title, status = "published" } = body;

    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    await connectDB();

    // Find highest bookNo in course
    const maxBook = await Book.findOne({ courseId }).sort({ bookNo: -1, position: -1 }).lean();
    let nextBookNo = Math.max(maxBook?.bookNo ?? 0, maxBook?.position ?? 0) + 1;

    let book = null;
    let attempts = 0;
    while (!book && attempts < 5) {
      try {
        book = await Book.create({
          courseId,
          title: title.trim(),
          bookNo: nextBookNo,
          position: nextBookNo,
          status: status === "published" ? "published" : "draft",
        });
      } catch (err) {
        if (err.code === 11000) {
          attempts++;
          const latestMax = await Book.findOne({ courseId }).sort({ bookNo: -1, position: -1 }).lean();
          nextBookNo = Math.max(latestMax?.bookNo ?? nextBookNo, latestMax?.position ?? nextBookNo) + 1;
        } else {
          throw err;
        }
      }
    }

    if (!book) {
      return Response.json({ error: "Could not allocate book number due to concurrent writes" }, { status: 409 });
    }

    await invalidateCoursesCache();

    return Response.json({ success: true, book });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
