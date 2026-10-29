import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const book = await Book.findById(id);
    if (!book) return Response.json({ error: "Book not found" }, { status: 404 });

    // Handle book-level actions
    if (body.action === "unlock_all") {
      await Lecture.updateMany(
        { bookId: id },
        { $set: { isFree: true, isFreePreview: true, freePreview: true, isPreview: true } }
      );
      await invalidateCoursesCache();
      return Response.json({ success: true, message: "All lectures in book unlocked" });
    }

    if (body.action === "lock_all") {
      await Lecture.updateMany(
        { bookId: id },
        { $set: { isFree: false, isFreePreview: false, freePreview: false, isPreview: false } }
      );
      await invalidateCoursesCache();
      return Response.json({ success: true, message: "All lectures in book locked" });
    }

    if (body.action === "publish") {
      book.status = "published";
      await book.save();
      // Also publish all chapters in this book
      await Chapter.updateMany({ bookId: id }, { $set: { status: "published" } });
      await invalidateCoursesCache();
      return Response.json({ success: true, book });
    }

    if (body.action === "draft") {
      book.status = "draft";
      await book.save();
      await invalidateCoursesCache();
      return Response.json({ success: true, book });
    }

    // Standard updates
    if (body.title !== undefined) book.title = body.title.trim();
    if (body.status !== undefined) book.status = body.status === "published" ? "published" : "draft";
    if (body.position !== undefined) book.position = Number(body.position);

    await book.save();
    await invalidateCoursesCache();

    return Response.json({ success: true, book });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();
    await Book.findByIdAndDelete(id);

    // Delete associated chapters and lectures
    await Chapter.deleteMany({ bookId: id });
    await Lecture.deleteMany({ bookId: id });

    await invalidateCoursesCache();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

