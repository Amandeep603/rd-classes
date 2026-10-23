"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "../auth/session.js";
import { progressSaveSchema } from "../validation/schemas.js";
import { saveLectureProgress } from "../services/progressService.js";
import connectDB from "../db/connect.js";
import { Progress } from "../db/models/Progress.js";
import { Lecture } from "../db/models/Lecture.js";

export async function saveProgressAction(payload) {
  const auth = await requireStudent();

  const parsed = progressSaveSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const result = await saveLectureProgress({
      userId: auth.user._id,
      lectureId: parsed.data.lectureId,
      positionSec: parsed.data.positionSec,
      durationSec: parsed.data.durationSec,
      forceCompleted: parsed.data.forceCompleted,
    });
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function markLectureCompleteAction(lectureId) {
  const auth = await requireStudent();
  try {
    const result = await saveLectureProgress({
      userId: auth.user._id,
      lectureId,
      positionSec: 0,
      durationSec: 0,
      forceCompleted: true,
    });
    revalidatePath("/student");
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function toggleBookmarkAction(lectureId) {
  const auth = await requireStudent();
  await connectDB();

  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture) {
    return { success: false, error: "Lecture not found" };
  }

  const existing = await Progress.findOne({
    userId: auth.user._id,
    lectureId,
  });

  if (existing) {
    existing.bookmarked = !existing.bookmarked;
    await existing.save();
    revalidatePath("/student");
    return { success: true, bookmarked: existing.bookmarked };
  } else {
    await Progress.create({
      userId: auth.user._id,
      lectureId,
      courseId: lecture.courseId,
      bookmarked: true,
      positionSec: 0,
    });
    revalidatePath("/student");
    return { success: true, bookmarked: true };
  }
}
