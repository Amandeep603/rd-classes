"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import {
  lectureCreateSchema,
  lectureUpdateSchema,
} from "../validation/schemas.js";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  syncCourseFreePreview,
} from "../services/lectureService.js";
import { fetchVimeoMetadata } from "../services/vimeo.js";

export async function createLectureAction(courseId, prevState, formData) {
  const admin = await requireAdmin();

  const isFreeExplicit = formData.has("freePreview")
    ? formData.get("freePreview") === "on"
    : formData.has("isPreview")
    ? formData.get("isPreview") === "on"
    : undefined;

  const raw = {
    courseId,
    section: formData.get("section") || "General",
    title: formData.get("title"),
    vimeoUrl: formData.get("vimeoUrl"),
    durationSec: formData.get("durationSec") || 0,
    description: formData.get("description") || "",
    published: formData.get("published") === "on",
    isPreview: isFreeExplicit ?? false,
    freePreview: isFreeExplicit,
  };

  const parsed = lectureCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await createLecture(parsed.data, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidateTag("courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateLectureAction(
  lectureId,
  courseId,
  prevState,
  formData
) {
  const admin = await requireAdmin();

  const isFreeExplicit = formData.has("freePreview")
    ? formData.get("freePreview") === "on"
    : formData.has("isPreview")
    ? formData.get("isPreview") === "on"
    : undefined;

  const raw = {
    section: formData.get("section"),
    title: formData.get("title"),
    vimeoUrl: formData.get("vimeoUrl"),
    durationSec: formData.get("durationSec")
      ? Number(formData.get("durationSec"))
      : undefined,
    description: formData.get("description"),
    published: formData.get("published") === "on",
    isPreview: isFreeExplicit,
    freePreview: isFreeExplicit,
  };

  const parsed = lectureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await updateLecture(lectureId, parsed.data, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidateTag("courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteLectureAction(lectureId, courseId) {
  const admin = await requireAdmin();
  try {
    await deleteLecture(lectureId, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidateTag("courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function reorderLecturesAction(courseId, orderedIds) {
  const admin = await requireAdmin();
  try {
    await reorderLectures(courseId, orderedIds, admin.user._id);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidateTag("courses");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchVimeoMetadataAction(vimeoId) {
  await requireAdmin();
  return fetchVimeoMetadata(vimeoId);
}

/**
 * Bulk adds up to 100 Vimeo lectures to a course.
 */
export async function bulkAddLecturesToCourseAction({
  courseId,
  rawUrls,
  section = "General",
  titlePrefix = "",
}) {
  const admin = await requireAdmin();
  const { parseVimeoUrl, fetchVimeoMetadata } = await import("../services/vimeo.js");
  const { Lecture } = await import("../db/models/Lecture.js");
  const { logAuditEvent } = await import("../services/audit.js");
  const connectDB = (await import("../db/connect.js")).default;
  await connectDB();

  if (!courseId) {
    return { success: false, error: "Course ID is required." };
  }

  const lines = (rawUrls || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { success: false, error: "Please enter at least one Vimeo URL." };
  }

  if (lines.length > 100) {
    return { success: false, error: "Maximum 100 Vimeo URLs allowed per bulk import." };
  }

  // Get current max order
  const lastLecture = await Lecture.findOne({ courseId }).sort({ order: -1 }).lean();
  let currentOrder = lastLecture && typeof lastLecture.order === "number" ? lastLecture.order + 1 : 0;

  // Get existing vimeoIds to prevent duplicates in this course
  const existingLectures = await Lecture.find({ courseId }).select("vimeoId").lean();
  const seenVimeoIds = new Set(existingLectures.map((l) => l.vimeoId));

  const created = [];
  const skipped = [];
  const targetSection = (section || "General").trim();
  const prefix = (titlePrefix || "").trim();

  let itemCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawUrl = lines[i];
    const { vimeoId, vimeoHash } = parseVimeoUrl(rawUrl);

    if (!vimeoId) {
      skipped.push({
        line: i + 1,
        url: rawUrl,
        reason: "Invalid Vimeo URL format",
      });
      continue;
    }

    if (seenVimeoIds.has(vimeoId)) {
      skipped.push({
        line: i + 1,
        url: rawUrl,
        vimeoId,
        reason: "Duplicate Vimeo ID in course",
      });
      continue;
    }

    seenVimeoIds.add(vimeoId);

    // Fetch metadata if access token is configured
    let metaTitle = "";
    let durationSec = 0;
    try {
      const meta = await fetchVimeoMetadata(vimeoId);
      if (meta && meta.success) {
        metaTitle = meta.title || "";
        durationSec = meta.durationSec || 0;
      }
    } catch {
      // Degrades gracefully to fallback title
    }

    let finalTitle = "";
    if (metaTitle) {
      finalTitle = prefix ? `${prefix} - ${metaTitle}` : metaTitle;
    } else {
      finalTitle = prefix ? `${prefix} - Lecture ${itemCounter}` : `Lecture ${currentOrder + 1}`;
    }

    try {
      const lecture = await Lecture.create({
        courseId,
        section: targetSection,
        title: finalTitle,
        vimeoId,
        vimeoHash: vimeoHash || "",
        durationSec,
        order: currentOrder++,
        published: true,
        isPreview: false,
      });

      created.push({
        lectureId: lecture._id.toString(),
        title: lecture.title,
        vimeoId: lecture.vimeoId,
        section: lecture.section,
        order: lecture.order,
      });

      itemCounter++;
    } catch (err) {
      skipped.push({
        line: i + 1,
        url: rawUrl,
        vimeoId,
        reason: err.message || "Failed to create lecture record",
      });
    }
  }

  if (created.length > 0) {
    await syncCourseFreePreview(courseId);
  }

  await logAuditEvent({
    actorId: admin.user._id,
    action: "lectures.bulk_added",
    targetType: "course",
    targetId: courseId.toString(),
    meta: {
      totalLines: lines.length,
      createdCount: created.length,
      skippedCount: skipped.length,
      section: targetSection,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidateTag("courses");

  return {
    success: true,
    created,
    skipped,
    addedCount: created.length,
    skippedCount: skipped.length,
  };
}

/**
 * Moves a lecture to a different section within the course.
 */
export async function moveLectureToSectionAction({ lectureId, courseId, newSection }) {
  const admin = await requireAdmin();
  const { Lecture } = await import("../db/models/Lecture.js");
  const { logAuditEvent } = await import("../services/audit.js");
  const connectDB = (await import("../db/connect.js")).default;
  await connectDB();

  const targetSection = (newSection || "General").trim();
  const lecture = await Lecture.findByIdAndUpdate(
    lectureId,
    { section: targetSection },
    { new: true }
  );

  if (!lecture) {
    return { success: false, error: "Lecture not found." };
  }

  await logAuditEvent({
    actorId: admin.user._id,
    action: "lecture.moved_section",
    targetType: "lecture",
    targetId: lectureId.toString(),
    meta: { newSection: targetSection, courseId },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidateTag("courses");

  return { success: true, lecture: JSON.parse(JSON.stringify(lecture)) };
}
