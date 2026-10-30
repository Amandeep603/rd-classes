import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const chapter = await Chapter.findById(id);
    if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

    // Handle chapter-level actions
    if (body.action === "unlock_all") {
      await Lecture.updateMany(
        { chapterId: id },
        { $set: { isFree: true, isFreePreview: true, freePreview: true, isPreview: true } }
      );
      await invalidateCoursesCache();
      return Response.json({ success: true, message: "All lectures in chapter unlocked" });
    }

    if (body.action === "lock_all") {
      await Lecture.updateMany(
        { chapterId: id },
        { $set: { isFree: false, isFreePreview: false, freePreview: false, isPreview: false } }
      );
      await invalidateCoursesCache();
      return Response.json({ success: true, message: "All lectures in chapter locked" });
    }

    if (body.action === "publish") {
      chapter.status = "published";
      await chapter.save();
      await invalidateCoursesCache();
      return Response.json({ success: true, chapter });
    }

    if (body.action === "draft") {
      chapter.status = "draft";
      await chapter.save();
      await invalidateCoursesCache();
      return Response.json({ success: true, chapter });
    }

    // Standard field updates
    if (body.title !== undefined) {
      chapter.title = body.title.trim();
      // Update chapterTitle in lectures
      await Lecture.updateMany(
        { chapterId: id },
        { $set: { chapterTitle: chapter.title, chapter: chapter.title, section: chapter.title } }
      );
    }
    if (body.bookId !== undefined) chapter.bookId = body.bookId;
    if (body.bookNo !== undefined) chapter.bookNo = Number(body.bookNo);
    if (body.chapterNo !== undefined) chapter.chapterNo = Number(body.chapterNo);
    if (body.position !== undefined) chapter.position = Number(body.position);
    if (body.status !== undefined) chapter.status = body.status === "published" ? "published" : "draft";

    await chapter.save();
    await invalidateCoursesCache();

    return Response.json({ success: true, chapter });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();
    const chapter = await Chapter.findById(id);
    if (!chapter) return Response.json({ error: "Chapter not found" }, { status: 404 });

    const courseId = chapter.courseId;
    const bookId = chapter.bookId;

    // Delete associated lectures and chapter
    await Lecture.deleteMany({ chapterId: id });
    await Chapter.findByIdAndDelete(id);

    // Renumber remaining chapters in this book to 1..n
    const remaining = await Chapter.find({ courseId, bookId }).sort({ chapterNo: 1, position: 1, createdAt: 1 });
    for (let i = 0; i < remaining.length; i++) {
      const ch = remaining[i];
      const newNo = i + 1;
      if (ch.chapterNo !== newNo || ch.position !== newNo) {
        ch.chapterNo = newNo;
        ch.position = newNo;
        await ch.save();

        // Update lectures with new chapterNo
        await Lecture.updateMany({ chapterId: ch._id }, { $set: { chapterNo: newNo } });
      }
    }

    await invalidateCoursesCache();
    return Response.json({ success: true, message: "Chapter deleted and remaining chapters renumbered" });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
