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

function parseDurationInput(val) {
  if (typeof val === "number") {
    const m = Math.floor(val / 60);
    const s = val % 60;
    return {
      seconds: val,
      mmss: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    };
  }
  const clean = String(val || "").trim();
  if (!clean) return { seconds: 0, mmss: "00:00" };

  const parts = clean.split(":").map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    const [m, s] = parts;
    const total = m * 60 + s;
    return {
      seconds: total,
      mmss: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    };
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const total = h * 3600 + m * 60 + s;
    return {
      seconds: total,
      mmss: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    };
  }

  const sec = parseInt(clean, 10) || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return {
    seconds: sec,
    mmss: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
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
      .populate("bookId", "title position status bookNo")
      .populate("chapterId", "title position status chapterNo")
      .sort({ lectureNo: 1, position: 1, order: 1, createdAt: 1 })
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

    if (chapterId && !bookId) {
      const chDoc = await Chapter.findById(chapterId).lean();
      if (chDoc) {
        bookId = chDoc.bookId;
        chapterTitle = chDoc.title;
      }
    }

    if (!bookId && body.courseId) {
      let book = await Book.findOne({ courseId: body.courseId, title: bookTitle || "Book 1" });
      if (!book) {
        book = await Book.create({
          courseId: body.courseId,
          title: bookTitle || "Book 1",
          bookNo: 1,
          position: 1,
          status: "published",
        });
      }
      bookId = book._id;
      bookTitle = book.title;
    }

    if (!chapterId && bookId) {
      let chapter = await Chapter.findOne({ courseId: body.courseId, bookId, title: chapterTitle || "Chapter 1" });
      if (!chapter) {
        chapter = await Chapter.create({
          courseId: body.courseId,
          bookId,
          bookNo: 1,
          chapterNo: 1,
          position: 1,
          title: chapterTitle || "Chapter 1",
          status: "published",
        });
      }
      chapterId = chapter._id;
      chapterTitle = chapter.title;
    }

    // Resolve bookNo and chapterNo
    const bookDoc = await Book.findById(bookId).lean();
    const chapterDoc = await Chapter.findById(chapterId).lean();

    const bookNo = bookDoc?.bookNo ?? bookDoc?.position ?? 1;
    const chapterNo = chapterDoc?.chapterNo ?? chapterDoc?.position ?? 1;
    bookTitle = bookTitle || bookDoc?.title || "";
    chapterTitle = chapterTitle || chapterDoc?.title || "";

    // Parse duration
    const durationParsed = parseDurationInput(body.durationSeconds ?? body.duration ?? body.duration_mmss);

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

    // Automatically determine next sequence number inside the chapter
    const maxLec = await Lecture.findOne({ courseId: body.courseId, bookNo, chapterNo })
      .sort({ lectureNo: -1, position: -1 })
      .lean();
    let nextLectureNo = Math.max(maxLec?.lectureNo ?? 0, maxLec?.position ?? 0) + 1;

    const isFree = Boolean(body.isFree ?? body.isFreePreview ?? body.freePreview ?? false);
    const status = vimeoId ? "published" : (body.status === "published" || body.published === true ? "published" : "draft");

    let lecture = null;
    let attempts = 0;
    while (!lecture && attempts < 5) {
      try {
        lecture = await Lecture.create({
          courseId: body.courseId,
          bookId,
          chapterId,
          bookNo,
          chapterNo,
          lectureNo: nextLectureNo,
          position: nextLectureNo,
          order: nextLectureNo,
          partNumber: nextLectureNo,
          bookTitle,
          chapterTitle,
          book: bookTitle,
          chapter: chapterTitle,
          section: chapterTitle,
          title: body.title.trim(),
          description: (body.description || "").trim(),
          videoProvider: videoProvider || "vimeo",
          videoUrl,
          vimeoId,
          vimeoHash,
          durationSeconds: durationParsed.seconds,
          durationSec: durationParsed.seconds,
          duration_mmss: durationParsed.mmss,
          status,
          published: status === "published",
          isFree,
          freePreview: isFree,
          isFreePreview: isFree,
          isPreview: isFree,
          sourceKey: body.sourceKey || null,
        });
      } catch (err) {
        if (err.code === 11000) {
          attempts++;
          const latestMax = await Lecture.findOne({ courseId: body.courseId, bookNo, chapterNo })
            .sort({ lectureNo: -1, position: -1 })
            .lean();
          nextLectureNo = Math.max(latestMax?.lectureNo ?? nextLectureNo, latestMax?.position ?? nextLectureNo) + 1;
        } else {
          throw err;
        }
      }
    }

    if (!lecture) {
      return Response.json({ error: "Could not allocate lecture number due to concurrent writes" }, { status: 409 });
    }

    await invalidateCoursesCache();

    return Response.json({ success: true, lecture });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
