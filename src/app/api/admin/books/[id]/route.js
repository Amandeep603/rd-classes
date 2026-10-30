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
    if (body.title !== undefined) {
      book.title = body.title.trim();
      // Update bookTitle in lectures
      await Lecture.updateMany({ bookId: id }, { $set: { bookTitle: book.title, book: book.title } });
    }
    if (body.status !== undefined) book.status = body.status === "published" ? "published" : "draft";
    if (body.bookNo !== undefined) book.bookNo = Number(body.bookNo);
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
    const book = await Book.findById(id);
    if (!book) return Response.json({ error: "Book not found" }, { status: 404 });

    const courseId = book.courseId;

    // Delete associated chapters and lectures
    await Chapter.deleteMany({ bookId: id });
    await Lecture.deleteMany({ bookId: id });
    await Book.findByIdAndDelete(id);

    // Renumber remaining books in course 1..n
    const remainingBooks = await Book.find({ courseId }).sort({ bookNo: 1, position: 1, createdAt: 1 });
    for (let i = 0; i < remainingBooks.length; i++) {
      const b = remainingBooks[i];
      const newNo = i + 1;
      if (b.bookNo !== newNo || b.position !== newNo) {
        b.bookNo = newNo;
        b.position = newNo;
        await b.save();

        // Update chapters and lectures with new bookNo
        await Chapter.updateMany({ bookId: b._id }, { $set: { bookNo: newNo } });
        await Lecture.updateMany({ bookId: b._id }, { $set: { bookNo: newNo } });
      }
    }

    await invalidateCoursesCache();
    return Response.json({ success: true, message: "Book deleted and course books renumbered" });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
