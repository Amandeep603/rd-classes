import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Book } from "@/lib/models/Book";
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

    const chapters = await Chapter.find(filter)
      .sort({ chapterNo: 1, position: 1, createdAt: 1 })
      .lean();

    return Response.json({ success: true, chapters });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, bookId, title, status = "published" } = body;

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

    const book = await Book.findById(bookId).lean();
    if (!book) {
      return Response.json({ error: "Parent book not found" }, { status: 404 });
    }
    const bookNo = book.bookNo ?? book.position ?? 1;

    // Find highest chapterNo in this book
    const maxChap = await Chapter.findOne({ courseId, bookId })
      .sort({ chapterNo: -1, position: -1 })
      .lean();
    let nextChapterNo = Math.max(maxChap?.chapterNo ?? 0, maxChap?.position ?? 0) + 1;

    let chapter = null;
    let attempts = 0;
    while (!chapter && attempts < 5) {
      try {
        chapter = await Chapter.create({
          courseId,
          bookId,
          bookNo,
          chapterNo: nextChapterNo,
          position: nextChapterNo,
          title: title.trim(),
          status: status === "published" ? "published" : "draft",
        });
      } catch (err) {
        if (err.code === 11000) {
          attempts++;
          const latestMax = await Chapter.findOne({ courseId, bookId })
            .sort({ chapterNo: -1, position: -1 })
            .lean();
          nextChapterNo = Math.max(latestMax?.chapterNo ?? nextChapterNo, latestMax?.position ?? nextChapterNo) + 1;
        } else {
          throw err;
        }
      }
    }

    if (!chapter) {
      return Response.json({ error: "Could not allocate chapter number due to concurrent writes" }, { status: 409 });
    }

    await invalidateCoursesCache();

    return Response.json({ success: true, chapter });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
