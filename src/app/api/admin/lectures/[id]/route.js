import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { detectVideoProvider } from "../route.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectDB();
    const lecture = await Lecture.findById(id).lean();
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
    if (body.book !== undefined) lecture.book = body.book.trim();
    if (body.chapter !== undefined) lecture.chapter = body.chapter.trim();
    if (body.description !== undefined) lecture.description = body.description.trim();
    if (body.videoUrl !== undefined) {
      lecture.videoUrl = body.videoUrl.trim();
      lecture.videoProvider = body.videoProvider || detectVideoProvider(lecture.videoUrl);
    }
    if (body.durationSeconds !== undefined) {
      lecture.durationSeconds = Number(body.durationSeconds);
      lecture.durationSec = Number(body.durationSeconds);
    }
    if (body.position !== undefined) {
      lecture.position = Number(body.position);
      lecture.order = Number(body.position);
    }
    if (body.status !== undefined) {
      lecture.status = body.status;
      lecture.published = body.status === "published";
    }
    if (body.isFreePreview !== undefined || body.freePreview !== undefined || body.isPreview !== undefined) {
      const freeVal = Boolean(body.isFreePreview ?? body.freePreview ?? body.isPreview);
      lecture.isFreePreview = freeVal;
      lecture.freePreview = freeVal;
      lecture.isPreview = freeVal;
    }

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
