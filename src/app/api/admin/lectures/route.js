import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

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
    return "hls";
  }
  if (clean.includes(".mp4")) {
    return "mp4";
  }
  return "direct";
}

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    await connectDB();
    const filter = courseId ? { courseId } : {};
    const lectures = await Lecture.find(filter)
      .sort({ book: 1, chapter: 1, position: 1, order: 1, createdAt: 1 })
      .lean();

    const { isLectureFree } = await import("@/server/services/lectureService.js");
    const withFree = lectures.map((lec) => ({
      ...lec,
      isFreePreview: isLectureFree(lec, lectures),
      freePreview: isLectureFree(lec, lectures),
      isPreview: isLectureFree(lec, lectures),
    }));

    return Response.json({ success: true, lectures: withFree });
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

    const videoUrl = (body.videoUrl || "").trim();
    const videoProvider = body.videoProvider || detectVideoProvider(videoUrl);

    await connectDB();

    // Determine position
    const maxLec = await Lecture.findOne({ courseId: body.courseId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    const nextPos = (maxLec?.position ?? 0) + 1;

    const isFree = Boolean(body.isFreePreview ?? body.freePreview ?? body.isPreview);

    const lecture = await Lecture.create({
      courseId: body.courseId,
      book: (body.book || "").trim(),
      chapter: (body.chapter || "").trim(),
      title: body.title.trim(),
      description: (body.description || "").trim(),
      videoProvider,
      videoUrl,
      durationSeconds: Number(body.durationSeconds || body.durationSec || 0),
      durationSec: Number(body.durationSeconds || body.durationSec || 0),
      position: typeof body.position === "number" ? body.position : nextPos,
      order: typeof body.position === "number" ? body.position : nextPos,
      status: body.status || "published",
      published: body.status === "published",
      isFreePreview: isFree,
      freePreview: isFree,
      isPreview: isFree,
    });

    await invalidateCoursesCache();

    return Response.json({ success: true, lecture }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
