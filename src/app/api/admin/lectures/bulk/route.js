import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { detectVideoProvider } from "../route.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    await connectDB();

    // 1. Bulk Actions Mode on Selected Lectures
    if (body.action && Array.isArray(body.ids)) {
      const { action, ids } = body;
      if (ids.length === 0) {
        return Response.json({ success: true, count: 0 });
      }

      if (action === "make_free") {
        await Lecture.updateMany(
          { _id: { $in: ids } },
          { $set: { isFree: true, isFreePreview: true, freePreview: true, isPreview: true } }
        );
      } else if (action === "make_locked") {
        await Lecture.updateMany(
          { _id: { $in: ids } },
          { $set: { isFree: false, isFreePreview: false, freePreview: false, isPreview: false } }
        );
      } else if (action === "publish") {
        await Lecture.updateMany(
          { _id: { $in: ids } },
          { $set: { status: "published", published: true } }
        );
      } else if (action === "draft") {
        await Lecture.updateMany(
          { _id: { $in: ids } },
          { $set: { status: "draft", published: false } }
        );
      } else if (action === "move_to_chapter") {
        const { targetBookId, targetChapterId } = body;
        if (!targetChapterId) {
          return Response.json({ error: "targetChapterId is required" }, { status: 400 });
        }
        const chapter = await Chapter.findById(targetChapterId).populate("bookId").lean();
        const bookId = targetBookId || chapter?.bookId?._id || chapter?.bookId;

        await Lecture.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              bookId,
              chapterId: targetChapterId,
              book: chapter?.bookId?.title || "",
              chapter: chapter?.title || "",
              section: chapter?.title || "",
            },
          }
        );
      } else if (action === "delete") {
        await Lecture.deleteMany({ _id: { $in: ids } });
      }

      await invalidateCoursesCache();
      return Response.json({ success: true, count: ids.length, action });
    }

    // 2. Bulk Lines Import Mode
    const { courseId, bookId, chapterId, text = "" } = body;
    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!text || !text.trim()) {
      return Response.json({ error: "No lecture lines provided" }, { status: 400 });
    }

    let bId = bookId;
    let cId = chapterId;
    let bookTitle = body.book || "";
    let chapterTitle = body.chapter || "";

    if (!bId) {
      let book = await Book.findOne({ courseId, title: bookTitle || "Book 1" });
      if (!book) {
        book = await Book.create({ courseId, title: bookTitle || "Book 1", status: "published" });
      }
      bId = book._id;
      bookTitle = book.title;
    }

    if (!cId) {
      let chapter = await Chapter.findOne({ courseId, bookId: bId, title: chapterTitle || "Chapter 1" });
      if (!chapter) {
        chapter = await Chapter.create({ courseId, bookId: bId, title: chapterTitle || "Chapter 1", status: "published" });
      }
      cId = chapter._id;
      chapterTitle = chapter.title;
    }

    const maxLec = await Lecture.findOne({ courseId, chapterId: cId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    let currentPos = (maxLec?.position ?? 0) + 1;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const createdLectures = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let title = `Lecture ${currentPos}`;
      let url = "";

      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        url = urlMatch[1];
        const titlePart = line.replace(url, "").replace(/^[-|,:\s]+|[-|,:\s]+$/g, "").trim();
        if (titlePart) title = titlePart;
      } else {
        title = line;
      }

      const provider = detectVideoProvider(url);

      const lec = await Lecture.create({
        courseId,
        bookId: bId,
        chapterId: cId,
        book: bookTitle,
        chapter: chapterTitle,
        section: chapterTitle,
        title,
        partNumber: currentPos,
        videoUrl: url,
        videoProvider: provider,
        position: currentPos,
        order: currentPos,
        status: "published",
        published: true,
        isFree: false,
        freePreview: false,
      });

      createdLectures.push(lec);
      currentPos++;
    }

    await invalidateCoursesCache();

    if (createdLectures.length > 0) {
      try {
        const { createStudentNotification } = await import("@/server/services/notificationService.js");
        await createStudentNotification({
          type: "lecture_added",
          title: `${createdLectures.length} New Lecture${createdLectures.length > 1 ? "s" : ""} Added`,
          message: `${bookTitle ? `${bookTitle} · ` : ""}${chapterTitle || "New lectures added"}`,
          courseId,
          link: "/student/lectures",
          entityId: createdLectures[0]._id,
        });
      } catch {
        // ignore notification errors
      }
    }

    return Response.json({
      success: true,
      count: createdLectures.length,
      lectures: createdLectures,
    });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
