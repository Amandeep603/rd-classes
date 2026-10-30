import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { detectVideoProvider } from "../route.js";
import { parseVimeoUrl } from "@/server/services/vimeo.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

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

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectDB();
    const lecture = await Lecture.findById(id)
      .populate("bookId", "title position status bookNo")
      .populate("chapterId", "title position status chapterNo")
      .lean();

    if (!lecture) return Response.json({ error: "Lecture not found" }, { status: 404 });
    return Response.json({ success: true, lecture });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const lecture = await Lecture.findById(id);
    if (!lecture) return Response.json({ error: "Lecture not found" }, { status: 404 });

    if (body.title !== undefined) lecture.title = body.title.trim();
    if (body.partNumber !== undefined) lecture.partNumber = Number(body.partNumber) || 1;
    if (body.description !== undefined) lecture.description = body.description.trim();
    if (body.bookId !== undefined) lecture.bookId = body.bookId;
    if (body.chapterId !== undefined) lecture.chapterId = body.chapterId;
    if (body.book !== undefined) lecture.book = body.book.trim();
    if (body.chapter !== undefined) {
      lecture.chapter = body.chapter.trim();
      lecture.section = body.chapter.trim();
    }

    if (body.videoUrl !== undefined) {
      lecture.videoUrl = body.videoUrl.trim();
      const parsed = parseVimeoUrl(lecture.videoUrl);
      if (parsed.vimeoId) {
        lecture.vimeoId = parsed.vimeoId;
        lecture.vimeoHash = parsed.vimeoHash || lecture.vimeoHash || "";
        lecture.videoProvider = "vimeo";
      } else {
        lecture.videoProvider = body.videoProvider || detectVideoProvider(lecture.videoUrl);
      }
    }

    if (body.videoProvider !== undefined) lecture.videoProvider = body.videoProvider;
    if (body.vimeoId !== undefined) lecture.vimeoId = body.vimeoId.trim();
    if (body.vimeoHash !== undefined) lecture.vimeoHash = body.vimeoHash.trim();

    // Duration handling
    if (
      body.duration_mmss !== undefined ||
      body.durationSeconds !== undefined ||
      body.durationSec !== undefined ||
      body.duration !== undefined
    ) {
      const parsed = parseDurationInput(
        body.duration_mmss ?? body.durationSeconds ?? body.durationSec ?? body.duration
      );
      lecture.durationSeconds = parsed.seconds;
      lecture.durationSec = parsed.seconds;
      lecture.duration_mmss = parsed.mmss;
    }

    if (body.position !== undefined || body.order !== undefined || body.lectureNo !== undefined) {
      const pos = Number(body.lectureNo ?? body.position ?? body.order) || 0;
      lecture.position = pos;
      lecture.order = pos;
      lecture.lectureNo = pos;
      lecture.partNumber = pos;
    }

    if (body.status !== undefined) {
      lecture.status = body.status === "published" ? "published" : "draft";
      lecture.published = body.status === "published";
    }

    if (body.isFree !== undefined || body.isFreePreview !== undefined || body.freePreview !== undefined) {
      const freeVal = Boolean(body.isFree ?? body.isFreePreview ?? body.freePreview);
      lecture.isFree = freeVal;
      lecture.isFreePreview = freeVal;
      lecture.freePreview = freeVal;
      lecture.isPreview = freeVal;
    }

    if (body.sourceKey !== undefined) lecture.sourceKey = body.sourceKey;

    await lecture.save();
    await invalidateCoursesCache();

    return Response.json({ success: true, lecture });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectDB();

    const lecture = await Lecture.findById(id);
    if (!lecture) return Response.json({ error: "Lecture not found" }, { status: 404 });

    const courseId = lecture.courseId;
    const bookNo = lecture.bookNo;
    const chapterNo = lecture.chapterNo;
    const chapterId = lecture.chapterId;

    await Lecture.findByIdAndDelete(id);

    // Renumber remaining lectures in this chapter to 1..n
    const filter = chapterId
      ? { chapterId }
      : { courseId, bookNo, chapterNo };

    const remaining = await Lecture.find(filter).sort({ lectureNo: 1, position: 1, createdAt: 1 });

    // Sequentially shift numbers down so that no duplicate conflict occurs
    for (let i = 0; i < remaining.length; i++) {
      const lec = remaining[i];
      const newNo = i + 1;
      if (lec.lectureNo !== newNo || lec.position !== newNo) {
        lec.lectureNo = newNo;
        lec.position = newNo;
        lec.order = newNo;
        lec.partNumber = newNo;
        await lec.save();
      }
    }

    await invalidateCoursesCache();
    return Response.json({ success: true, message: "Lecture deleted and remaining lectures renumbered" });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
