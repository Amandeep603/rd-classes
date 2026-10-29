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
    if (body.title !== undefined) chapter.title = body.title.trim();
    if (body.bookId !== undefined) chapter.bookId = body.bookId;
    if (body.status !== undefined) chapter.status = body.status === "published" ? "published" : "draft";
    if (body.position !== undefined) chapter.position = Number(body.position);

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
    await Chapter.findByIdAndDelete(id);

    // Delete associated lectures
    await Lecture.deleteMany({ chapterId: id });

    await invalidateCoursesCache();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

