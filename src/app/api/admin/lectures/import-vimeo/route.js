import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { parseVimeoUrl, fetchVimeoMetadata } from "@/server/services/vimeo.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, items = [], lines = [], text = "", defaultBookId, defaultChapterId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    await connectDB();

    // Cache maps to avoid redundant DB queries
    const bookCache = new Map();
    const chapterCache = new Map();

    // Helper: Find or create Book by title
    async function resolveBook(title, fallbackBookId) {
      const cleanTitle = (title || "").trim();
      if (!cleanTitle && fallbackBookId) {
        const found = await Book.findById(fallbackBookId).lean();
        if (found) return found;
      }
      const bTitle = cleanTitle || "Book 1";
      const key = `${courseId}:::${bTitle.toLowerCase()}`;
      if (bookCache.has(key)) return bookCache.get(key);

      let book = await Book.findOne({
        courseId,
        title: { $regex: new RegExp("^" + escapeRegex(bTitle) + "$", "i") },
      });

      if (!book) {
        const maxPos = await Book.findOne({ courseId })
          .sort({ position: -1 })
          .select("position")
          .lean();
        const nextPos = (maxPos?.position ?? -1) + 1;

        book = await Book.create({
          courseId,
          title: bTitle,
          position: nextPos,
          status: "draft",
        });
      }

      bookCache.set(key, book);
      return book;
    }

    // Helper: Find or create Chapter by title within a Book
    async function resolveChapter(bookId, title, fallbackChapterId) {
      const cleanTitle = (title || "").trim();
      if (!cleanTitle && fallbackChapterId) {
        const found = await Chapter.findById(fallbackChapterId).lean();
        if (found) return found;
      }
      const chTitle = cleanTitle || "General";
      const key = `${courseId}:::${bookId}:::${chTitle.toLowerCase()}`;
      if (chapterCache.has(key)) return chapterCache.get(key);

      let chapter = await Chapter.findOne({
        courseId,
        bookId,
        title: { $regex: new RegExp("^" + escapeRegex(chTitle) + "$", "i") },
      });

      if (!chapter) {
        const maxPos = await Chapter.findOne({ courseId, bookId })
          .sort({ position: -1 })
          .select("position")
          .lean();
        const nextPos = (maxPos?.position ?? -1) + 1;

        chapter = await Chapter.create({
          courseId,
          bookId,
          title: chTitle,
          position: nextPos,
          status: "draft",
        });
      }

      chapterCache.set(key, chapter);
      return chapter;
    }

    let created = 0;
    let skipped = 0;
    let updated = 0;
    let warnings = 0;
    const errors = [];

    // CASE 1: Structured items (from Vimeo Folder Import modal or File Upload)
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const vimeoId = item.vimeoId || (item.link ? parseVimeoUrl(item.link).vimeoId : "");
        const vimeoHash = item.vimeoHash || (item.link ? parseVimeoUrl(item.link).vimeoHash : "") || "";

        if (!vimeoId) {
          errors.push({ item, reason: "Missing Vimeo ID" });
          continue;
        }

        if (item.isPublicWarning) {
          warnings++;
        }

        // Resolve Book and Chapter
        const bookDoc = await resolveBook(item.book || item.bookTitle, item.bookId || defaultBookId);
        const chapterDoc = await resolveChapter(bookDoc._id, item.chapter || item.chapterTitle, item.chapterId || defaultChapterId);

        const sourceKey = `vimeo:${vimeoId}`;
        const existing = await Lecture.findOne({ courseId, sourceKey });

        const dur = Number(item.durationSeconds || item.durationSec || item.duration) || 0;
        const part = Number(item.partNumber || item.part) || (i + 1);
        const title = (item.title || item.name || `Lecture ${part}`).trim();

        if (existing) {
          // Update existing lecture to avoid duplication
          existing.bookId = bookDoc._id;
          existing.chapterId = chapterDoc._id;
          existing.book = bookDoc.title;
          existing.chapter = chapterDoc.title;
          existing.section = chapterDoc.title;
          existing.title = title;
          existing.partNumber = part;
          existing.vimeoId = vimeoId;
          if (vimeoHash) existing.vimeoHash = vimeoHash;
          if (dur > 0) {
            existing.durationSeconds = dur;
            existing.durationSec = dur;
          }
          await existing.save();
          skipped++;
          updated++;
        } else {
          // Find next position in chapter
          const maxLec = await Lecture.findOne({ courseId, chapterId: chapterDoc._id })
            .sort({ position: -1 })
            .select("position")
            .lean();
          const nextPos = (maxLec?.position ?? -1) + 1;

          await Lecture.create({
            courseId,
            bookId: bookDoc._id,
            chapterId: chapterDoc._id,
            book: bookDoc.title,
            chapter: chapterDoc.title,
            section: chapterDoc.title,
            title,
            partNumber: part,
            position: nextPos,
            order: nextPos,
            videoProvider: "vimeo",
            videoUrl: item.link || item.videoUrl || `https://vimeo.com/${vimeoId}`,
            vimeoId,
            vimeoHash,
            durationSeconds: dur,
            durationSec: dur,
            status: "draft",
            published: false,
            isFree: Boolean(item.isFree || item.free === true || String(item.free).toLowerCase() === "yes"),
            freePreview: Boolean(item.isFree || item.free === true || String(item.free).toLowerCase() === "yes"),
            isPreview: Boolean(item.isFree || item.free === true || String(item.free).toLowerCase() === "yes"),
            sourceKey,
          });

          created++;
        }
      }

      await invalidateCoursesCache();

      return NextResponse.json({
        success: true,
        created,
        skipped,
        updated,
        warnings,
        total: items.length,
        errors,
      });
    }

    // CASE 2: Legacy rawLines/text format (single chapter)
    const rawLines = [
      ...lines,
      ...(text ? text.split("\n").map((l) => l.trim()).filter(Boolean) : []),
    ];

    if (rawLines.length === 0) {
      return NextResponse.json({ error: "No video items or links provided" }, { status: 400 });
    }

    if (!defaultChapterId) {
      return NextResponse.json({ error: "chapterId is required for raw lines import" }, { status: 400 });
    }

    const chapter = await Chapter.findById(defaultChapterId).populate("bookId").lean();
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }
    const bId = defaultBookId || chapter.bookId?._id || chapter.bookId;

    const maxLec = await Lecture.findOne({ courseId, chapterId: defaultChapterId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    let currentPos = (maxLec?.position ?? -1) + 1;

    for (let i = 0; i < rawLines.length; i++) {
      const line = typeof rawLines[i] === "string" ? rawLines[i] : rawLines[i].url || rawLines[i].id;
      if (!line) continue;

      const { vimeoId, vimeoHash } = parseVimeoUrl(line);
      if (!vimeoId) {
        errors.push({ line, reason: "Could not parse Vimeo ID" });
        continue;
      }

      const sourceKey = `vimeo:${vimeoId}`;
      const existing = await Lecture.findOne({ courseId, sourceKey });
      if (existing) {
        skipped++;
        continue;
      }

      let manualTitle = "";
      if (typeof line === "string") {
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
          const cand = line.replace(urlMatch[1], "").replace(/^[-|,:\s]+|[-|,:\s]+$/g, "").trim();
          if (cand) manualTitle = cand;
        }
      }

      let title = manualTitle || `Lecture ${currentPos + 1}`;
      let durationSec = 0;

      try {
        const meta = await fetchVimeoMetadata(vimeoId);
        if (meta.success) {
          if (!manualTitle && meta.title) title = meta.title;
          if (meta.durationSec) durationSec = meta.durationSec;
        }
      } catch {
        // Fallback
      }

      await Lecture.create({
        courseId,
        bookId: bId,
        chapterId: defaultChapterId,
        book: chapter.bookId?.title || "",
        chapter: chapter.title,
        section: chapter.title,
        title,
        partNumber: currentPos + 1,
        position: currentPos,
        order: currentPos,
        videoProvider: "vimeo",
        videoUrl: `https://vimeo.com/${vimeoId}`,
        vimeoId,
        vimeoHash: vimeoHash || "",
        durationSeconds: durationSec,
        durationSec,
        status: "draft",
        published: false,
        isFree: false,
        freePreview: false,
        isPreview: false,
        sourceKey,
      });

      created++;
      currentPos++;
    }

    await invalidateCoursesCache();

    return NextResponse.json({
      success: true,
      created,
      skipped,
      warnings: 0,
      total: rawLines.length,
      errors,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}
