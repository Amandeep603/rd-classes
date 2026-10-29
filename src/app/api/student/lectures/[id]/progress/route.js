import { requireStudentApi } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { LectureProgress } from "@/lib/models/LectureProgress";
import { Lecture } from "@/lib/models/Lecture";

export async function POST(request, { params }) {
  const auth = await requireStudentApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const watchedSeconds = Math.max(0, Number(body.watchedSeconds || 0));
    const completed = Boolean(body.completed);

    await connectDB();

    const lecture = await Lecture.findById(id).select("courseId durationSeconds durationSec").lean();
    if (!lecture) {
      return Response.json({ error: "Lecture not found" }, { status: 404 });
    }

    const totalSec = lecture.durationSeconds || lecture.durationSec || 0;
    const isCompleted = completed || (totalSec > 0 && watchedSeconds >= totalSec * 0.9);

    const progress = await LectureProgress.findOneAndUpdate(
      {
        $or: [
          { studentId: auth.user._id, lectureId: id },
          { userId: auth.user._id, lectureId: id },
        ],
      },
      {
        $set: {
          studentId: auth.user._id,
          userId: auth.user._id,
          lectureId: id,
          courseId: lecture.courseId,
          watchedSeconds,
          completed: isCompleted,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ success: true, progress });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
