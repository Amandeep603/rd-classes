import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { detectVideoProvider } from "../route.js";
import { parseVimeoUrl } from "@/server/services/vimeo.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectDB();
    const lecture = await Lecture.findById(id)
      .populate("bookId", "title position status")
      .populate("chapterId", "title position status")
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

    if (body.durationSeconds !== undefined || body.durationSec !== undefined) {
      const sec = Number(body.durationSeconds ?? body.durationSec) || 0;
      lecture.durationSeconds = sec;
      lecture.durationSec = sec;
    }

    if (body.position !== undefined || body.order !== undefined) {
      const pos = Number(body.position ?? body.order) || 0;
      lecture.position = pos;
      lecture.order = pos;
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
    await Lecture.findByIdAndDelete(id);
    await invalidateCoursesCache();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
