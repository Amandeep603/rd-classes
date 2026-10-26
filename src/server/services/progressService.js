import "server-only";
import connectDB from "../db/connect.js";
import { Progress } from "../db/models/Progress.js";
import { Lecture } from "../db/models/Lecture.js";
import { Enrollment } from "../db/models/Enrollment.js";

// In-memory write throttle map: key = `${userId}:${lectureId}`, val = timestamp
const writeThrottleMap = new Map();
const THROTTLE_MS = 4800; // ~5 seconds

export async function saveLectureProgress({
  userId,
  lectureId,
  positionSec,
  durationSec,
  forceCompleted = false,
}) {
  await connectDB();
  const throttleKey = `${userId}:${lectureId}`;
  const nowMs = Date.now();
  const lastWrite = writeThrottleMap.get(throttleKey) || 0;

  if (!forceCompleted && nowMs - lastWrite < THROTTLE_MS) {
    return { success: true, throttled: true };
  }

  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture || !lecture.published) {
    throw new Error("Lecture not found or unavailable.");
  }

  // Validate active enrollment unless preview
  const now = new Date();
  const enrollment = await Enrollment.findOne({
    userId,
    courseId: lecture.courseId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).lean();

  const isFree = Boolean(lecture.freePreview ?? lecture.isPreview);
  if (!enrollment && !isFree) {
    throw new Error("Student is not actively enrolled in this course.");
  }

  const dur = Number(durationSec) > 0 ? Number(durationSec) : lecture.durationSec || 0;
  const pos = Math.max(0, Number(positionSec) || 0);

  // Set completed at >= 90% or when explicitly marked
  const isCompleted = forceCompleted || (dur > 0 && pos / dur >= 0.9);

  const existing = await Progress.findOne({ userId, lectureId });
  if (existing) {
    existing.positionSec = pos;
    if (dur > 0) existing.durationSec = dur;
    if (isCompleted || existing.completed) {
      existing.completed = true;
    }
    await existing.save();
  } else {
    await Progress.create({
      userId,
      lectureId,
      courseId: lecture.courseId,
      positionSec: pos,
      durationSec: dur,
      completed: isCompleted,
    });
  }

  writeThrottleMap.set(throttleKey, nowMs);

  return {
    success: true,
    completed: isCompleted,
    positionSec: pos,
  };
}

/**
 * Returns the most recent lecture in progress for "Continue Watching".
 */
export async function getContinueWatching(userId) {
  await connectDB();
  const now = new Date();

  // Active enrolled courses
  const enrollments = await Enrollment.find({
    userId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("courseId")
    .lean();

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  if (enrolledCourseIds.length === 0) return null;

  const latestProgress = await Progress.findOne({
    userId,
    courseId: { $in: enrolledCourseIds },
  })
    .sort({ updatedAt: -1 })
    .populate("lectureId", "title section order durationSec published")
    .populate("courseId", "title slug published thumbnail")
    .lean();

  if (!latestProgress || !latestProgress.lectureId || !latestProgress.courseId) {
    return null;
  }

  if (!latestProgress.lectureId.published || !latestProgress.courseId.published) {
    return null;
  }

  return {
    lectureId: latestProgress.lectureId._id.toString(),
    lectureTitle: latestProgress.lectureId.title,
    section: latestProgress.lectureId.section,
    courseId: latestProgress.courseId._id.toString(),
    courseTitle: latestProgress.courseId.title,
    courseSlug: latestProgress.courseId.slug,
    positionSec: latestProgress.positionSec,
    durationSec: latestProgress.durationSec || latestProgress.lectureId.durationSec,
    completed: latestProgress.completed,
    thumbnail: latestProgress.courseId.thumbnail,
  };
}
