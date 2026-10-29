import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { invalidateCoursesCache } from "@/server/services/courseService.js";
import { parseVimeoUrl } from "@/server/services/vimeo.js";
import { isLectureFree } from "@/server/services/lectureService.js";

export function detectVideoProvider(url) {
  if (!url || typeof url !== "string") return "direct";
  const clean = url.trim().toLowerCase();
  if (
    clean.includes("mediadelivery.net") ||
    clean.includes("bunnycdn.com") ||
    clean.includes("b-cdn.net") ||
    clean.includes("bunny.net")
  ) {
    return "bunny";
  }
  if (clean.includes("vimeo.com")) {
    return "vimeo";
  }
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
    return "youtube";
  }
  if (clean.includes(".m3u8")) {
    return "bunny";
  }
  if (clean.includes(".mp4")) {
    return "direct";
  }
  return "direct";
}

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const bookId = searchParams.get("bookId");
    const chapterId = searchParams.get("chapterId");
    const search = searchParams.get("search");

    await connectDB();
    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (bookId) filter.bookId = bookId;
    if (chapterId) filter.chapterId = chapterId;
    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const lectures = await Lecture.find(filter)
      .populate("bookId", "title position status")
      .populate("chapterId", "title position status")
      .sort({ position: 1, order: 1, createdAt: 1 })
      .lean();

    const formatted = lectures.map((lec) => ({
      ...lec,
      isFree: isLectureFree(lec),
      isFreePreview: isLectureFree(lec),
      freePreview: isLectureFree(lec),
      bookTitle: lec.bookId?.title || lec.book || "",
      chapterTitle: lec.chapterId?.title || lec.chapter || lec.section || "",
    }));

    return Response.json({ success: true, lectures: formatted });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.courseId) {
      return Response.json({ error: "Course ID is required" }, { status: 400 });
    }

    await connectDB();

    // SourceKey duplicate protection
    if (body.sourceKey) {
      const existing = await Lecture.findOne({ courseId: body.courseId, sourceKey: body.sourceKey });
      if (existing) {
        return Response.json({
          success: true,
          duplicate: true,
          lecture: existing,
          message: "Lecture with this sourceKey already exists in course",
        });
      }
    }

    // Resolve book & chapter
    let bookId = body.bookId || null;
    let chapterId = body.chapterId || null;
    let bookTitle = body.book || "";
    let chapterTitle = body.chapter || body.section || "";

    if (!bookId && body.courseId) {
      // Find or create default book
      let book = await Book.findOne({ courseId: body.courseId, title: bookTitle || "Book 1" });
      if (!book) {
        book = await Book.create({
          courseId: body.courseId,
          title: bookTitle || "Book 1",
          status: "published",
        });
      }
      bookId = book._id;
      bookTitle = book.title;
    }

    if (!chapterId && bookId) {
      // Find or create default chapter
      let chapter = await Chapter.findOne({ courseId: body.courseId, bookId, title: chapterTitle || "Chapter 1" });
      if (!chapter) {
        chapter = await Chapter.create({
          courseId: body.courseId,
          bookId,
          title: chapterTitle || "Chapter 1",
          status: "published",
        });
      }
      chapterId = chapter._id;
      chapterTitle = chapter.title;
    }

    const videoUrl = (body.videoUrl || "").trim();
    let videoProvider = body.videoProvider;
    let vimeoId = body.vimeoId || "";
    let vimeoHash = body.vimeoHash || "";

    if (!videoProvider || videoProvider === "vimeo" || videoUrl.includes("vimeo")) {
      const parsed = parseVimeoUrl(videoUrl || vimeoId);
      if (parsed.vimeoId) {
        vimeoId = parsed.vimeoId;
        vimeoHash = parsed.vimeoHash || vimeoHash;
        videoProvider = "vimeo";
      } else {
        videoProvider = videoProvider || detectVideoProvider(videoUrl);
      }
    } else {
      videoProvider = detectVideoProvider(videoUrl);
    }

    // Determine position within chapter
    const maxLec = await Lecture.findOne({ courseId: body.courseId, chapterId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    const nextPos = (maxLec?.position ?? 0) + 1;

    const isFree = Boolean(body.isFree ?? body.isFreePreview ?? body.freePreview ?? false);
    const status = body.status === "published" || body.published === true ? "published" : "draft";

    const lecture = await Lecture.create({
      courseId: body.courseId,
      bookId,
      chapterId,
      book: bookTitle,
      chapter: chapterTitle,
      section: chapterTitle,
      title: body.title.trim(),
      partNumber: Number(body.partNumber) || 1,
      description: (body.description || "").trim(),
      videoProvider: videoProvider || "vimeo",
      videoUrl,
      vimeoId,
      vimeoHash,
      durationSeconds: Number(body.durationSeconds || body.durationSec || 0),
      durationSec: Number(body.durationSeconds || body.durationSec || 0),
      position: typeof body.position === "number" ? body.position : nextPos,
      order: typeof body.position === "number" ? body.position : nextPos,
      status,
      published: status === "published",
      isFree,
      freePreview: isFree,
      isFreePreview: isFree,
      isPreview: isFree,
      sourceKey: body.sourceKey || null,
    });

    await invalidateCoursesCache();

    return Response.json({ success: true, lecture });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
