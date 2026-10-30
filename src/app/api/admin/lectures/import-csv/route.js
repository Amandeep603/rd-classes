import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Book } from "@/lib/models/Book";
import { Chapter } from "@/lib/models/Chapter";
import { Lecture } from "@/lib/models/Lecture";
import { parseVimeoUrl } from "@/lib/utils/vimeoParser";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    let csvText = "";
    let isPreview = false;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file && typeof file.text === "function") {
        csvText = await file.text();
      }
      isPreview = formData.get("preview") === "true";
    } else {
      const body = await request.json();
      csvText = body.csvText || "";
      isPreview = Boolean(body.preview);
    }

    if (!csvText || !csvText.trim()) {
      return Response.json({ error: "CSV data is empty" }, { status: 400 });
    }

    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return Response.json({ error: "CSV contains no data rows" }, { status: 400 });
    }

    // Header normalization
    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9_]/g, "")
    );

    // Map column indices
    const colIndex = {
      course: headers.indexOf("course"),
      book_no: headers.indexOf("book_no") !== -1 ? headers.indexOf("book_no") : headers.indexOf("bookno"),
      book_title: headers.indexOf("book_title") !== -1 ? headers.indexOf("book_title") : headers.indexOf("booktitle"),
      chapter_no: headers.indexOf("chapter_no") !== -1 ? headers.indexOf("chapter_no") : headers.indexOf("chapterno"),
      chapter_title: headers.indexOf("chapter_title") !== -1 ? headers.indexOf("chapter_title") : headers.indexOf("chaptertitle"),
      lecture_no: headers.indexOf("lecture_no") !== -1 ? headers.indexOf("lecture_no") : headers.indexOf("lectureno"),
      title: headers.indexOf("title"),
      duration_seconds: headers.indexOf("duration_seconds") !== -1 ? headers.indexOf("duration_seconds") : headers.indexOf("duration"),
      vimeo_url: headers.indexOf("vimeo_url") !== -1 ? headers.indexOf("vimeo_url") : headers.indexOf("vimeourl"),
      is_free: headers.indexOf("is_free") !== -1 ? headers.indexOf("is_free") : headers.indexOf("isfree"),
    };

    if (colIndex.title === -1) {
      return Response.json(
        { error: "CSV must contain at least a 'title' column" },
        { status: 400 }
      );
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length <= 1 && !values[0]) continue;

      const getVal = (col) => (colIndex[col] !== -1 && values[colIndex[col]] !== undefined ? values[colIndex[col]] : "");

      const courseName = getVal("course") || "Class 12 Accountancy";
      const bookNo = parseInt(getVal("book_no"), 10) || 1;
      const bookTitle = getVal("book_title") || `Book ${bookNo}`;
      const chapterNo = parseInt(getVal("chapter_no"), 10) || 1;
      const chapterTitle = getVal("chapter_title") || `Chapter ${chapterNo}`;
      const lectureNo = parseInt(getVal("lecture_no"), 10) || i;
      const title = getVal("title");
      const durationSeconds = parseInt(getVal("duration_seconds"), 10) || 0;
      const vimeoUrl = getVal("vimeo_url");
      const rawIsFree = getVal("is_free");
      const isFree =
        rawIsFree === "true" ||
        rawIsFree === "1" ||
        rawIsFree === "yes" ||
        rawIsFree === "TRUE";

      if (!title) continue;

      rows.push({
        courseName,
        bookNo,
        bookTitle,
        chapterNo,
        chapterTitle,
        lectureNo,
        title,
        durationSeconds,
        vimeoUrl,
        isFree,
      });
    }

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const previewRows = [];

    // Cache of courses, books, chapters during execution
    const courseCache = new Map();
    const bookCache = new Map();
    const chapterCache = new Map();

    for (const r of rows) {
      // 1. Resolve Course
      let course = courseCache.get(r.courseName.toLowerCase());
      if (!course) {
        course = await Course.findOne({
          $or: [
            { title: { $regex: new RegExp(`^${r.courseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
            { slug: slugify(r.courseName) },
          ],
        });

        if (!course && !isPreview) {
          course = await Course.create({
            title: r.courseName,
            slug: slugify(r.courseName),
            status: "published",
            published: true,
            classLabel: r.courseName.toLowerCase().includes("11") ? "Class 11" : "Class 12",
          });
        }
        if (course) {
          courseCache.set(r.courseName.toLowerCase(), course);
        }
      }

      const courseId = course?._id;

      // 2. Resolve Book
      const bookCacheKey = `${courseId}_${r.bookNo}`;
      let book = bookCache.get(bookCacheKey);
      if (courseId && !book) {
        book = await Book.findOne({
          courseId,
          $or: [{ position: r.bookNo - 1 }, { title: r.bookTitle }],
        });

        if (!book && !isPreview) {
          book = await Book.create({
            courseId,
            title: r.bookTitle,
            position: r.bookNo - 1,
            status: "published",
          });
        }
        if (book) {
          bookCache.set(bookCacheKey, book);
        }
      }

      // 3. Resolve Chapter
      const chapterCacheKey = `${courseId}_${book?._id}_${r.chapterNo}`;
      let chapter = chapterCache.get(chapterCacheKey);
      if (courseId && book && !chapter) {
        chapter = await Chapter.findOne({
          courseId,
          bookId: book._id,
          $or: [{ position: r.chapterNo - 1 }, { title: r.chapterTitle }],
        });

        if (!chapter && !isPreview) {
          chapter = await Chapter.create({
            courseId,
            bookId: book._id,
            title: r.chapterTitle,
            position: r.chapterNo - 1,
            status: "published",
          });
        }
        if (chapter) {
          chapterCache.set(chapterCacheKey, chapter);
        }
      }

      // Parse Vimeo URL if present
      const vimeoParsed = parseVimeoUrl(r.vimeoUrl);

      // 4. Find existing lecture by (course, book_no, chapter_no, lecture_no)
      let existing = null;
      if (courseId) {
        existing = await Lecture.findOne({
          courseId,
          $or: [
            { bookNo: r.bookNo, chapterNo: r.chapterNo, lectureNo: r.lectureNo },
            ...(chapter ? [{ chapterId: chapter._id, partNumber: r.lectureNo }] : []),
          ],
        });
      }

      if (existing) {
        updatedCount++;
        if (previewRows.length < 15) {
          previewRows.push({
            status: "updated",
            course: r.courseName,
            book: r.bookTitle,
            chapter: r.chapterTitle,
            lectureNo: r.lectureNo,
            title: r.title,
            vimeoUrl: r.vimeoUrl || (existing.vimeoId ? `Vimeo ID: ${existing.vimeoId}` : ""),
            isFree: r.isFree,
          });
        }

        if (!isPreview) {
          existing.title = r.title;
          existing.bookNo = r.bookNo;
          existing.bookTitle = r.bookTitle;
          existing.chapterNo = r.chapterNo;
          existing.chapterTitle = r.chapterTitle;
          existing.lectureNo = r.lectureNo;
          existing.partNumber = r.lectureNo;
          existing.isFree = r.isFree;

          if (book?._id) existing.bookId = book._id;
          if (chapter?._id) existing.chapterId = chapter._id;

          // Only update vimeo details if new valid vimeoUrl was supplied
          if (vimeoParsed.isValid && vimeoParsed.vimeoId) {
            existing.vimeoId = vimeoParsed.vimeoId;
            existing.vimeoHash = vimeoParsed.vimeoHash || existing.vimeoHash || "";
            existing.videoUrl = r.vimeoUrl;
            existing.videoProvider = "vimeo";
            existing.status = "published";
            existing.published = true;
          }

          if (r.durationSeconds > 0) {
            existing.durationSeconds = r.durationSeconds;
            existing.durationSec = r.durationSeconds;
          }

          await existing.save();
        }
      } else {
        newCount++;
        if (previewRows.length < 15) {
          previewRows.push({
            status: "new",
            course: r.courseName,
            book: r.bookTitle,
            chapter: r.chapterTitle,
            lectureNo: r.lectureNo,
            title: r.title,
            vimeoUrl: r.vimeoUrl,
            isFree: r.isFree,
          });
        }

        if (!isPreview && courseId) {
          const hasVimeo = Boolean(vimeoParsed.isValid && vimeoParsed.vimeoId);
          await Lecture.create({
            courseId,
            bookId: book?._id || null,
            chapterId: chapter?._id || null,
            bookNo: r.bookNo,
            bookTitle: r.bookTitle,
            chapterNo: r.chapterNo,
            chapterTitle: r.chapterTitle,
            lectureNo: r.lectureNo,
            partNumber: r.lectureNo,
            position: r.lectureNo - 1,
            order: r.lectureNo - 1,
            title: r.title,
            durationSeconds: r.durationSeconds || 0,
            durationSec: r.durationSeconds || 0,
            videoProvider: hasVimeo ? "vimeo" : "direct",
            videoUrl: r.vimeoUrl || "",
            vimeoId: vimeoParsed.vimeoId || "",
            vimeoHash: vimeoParsed.vimeoHash || "",
            isFree: r.isFree,
            status: hasVimeo ? "published" : "draft",
            published: hasVimeo,
          });
        }
      }
    }

    if (!isPreview) {
      await invalidateCoursesCache();
    }

    return Response.json({
      success: true,
      preview: isPreview,
      totalRows: rows.length,
      newCount,
      updatedCount,
      skippedCount,
      previewRows,
    });
  } catch (err) {
    return Response.json({ error: err?.message || "Failed to import CSV" }, { status: 500 });
  }
}

