"use server";

import { requireStudent } from "../auth/session.js";
import { progressSaveSchema } from "../validation/schemas.js";
import { saveLectureProgress } from "../services/progressService.js";

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
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
