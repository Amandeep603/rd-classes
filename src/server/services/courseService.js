import "server-only";
import mongoose from "mongoose";
import { cacheTag, cacheLife } from "next/cache";
import connectDB from "../db/connect.js";
import { Course } from "../db/models/Course.js";
import { Lecture } from "../db/models/Lecture.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Progress } from "../db/models/Progress.js";
import { Settings } from "../db/models/Settings.js";
import { logAuditEvent } from "./audit.js";
import { createAdminNotification } from "./notificationService.js";

export { getStudentCourseAccess } from "./studentAccessService.js";

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Invalidates cached courses tag using Next.js revalidateTag / revalidatePath API.
 */
export async function invalidateCoursesCache() {
  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    if (typeof revalidateTag === "function") {
      try {
        revalidateTag("courses");
      } catch (tErr) {
        // Tag invalidation
      }
    }
    if (typeof revalidatePath === "function") {
      try {
        revalidatePath("/courses");
        revalidatePath("/courses/[slug]", "page");
        revalidatePath("/student", "layout");
        revalidatePath("/student");
        revalidatePath("/student/lectures");
        revalidatePath("/");
      } catch (pErr) {
        // Path invalidation
      }
    }
  } catch (err) {
    console.warn("Could not invalidate courses tag:", err?.message || err);
  }
}

/**
 * Cached function for all published public courses.
 * Tagged with cacheTag("courses") and cacheLife("max").
 */
export async function getCachedPublicCourses() {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();
  const courses = await Course.find({
    $or: [{ status: "published" }, { published: true }],
  })
    .sort({ homeOrder: 1, sortOrder: 1, order: 1, createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(courses));
}

/**
 * Cached function for featured home courses (max 6, showOnHome=true, ordered by homeOrder).
 * Tagged with cacheTag("courses") and cacheLife("max").
 */
export async function getCachedFeaturedCourses() {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();
  const courses = await Course.find({
    $and: [
      { $or: [{ status: "published" }, { published: true }] },
      { $or: [{ showOnHome: true }, { featured: true }] },
    ],
  })
    .sort({ homeOrder: 1, sortOrder: 1, order: 1, createdAt: 1 })
    .limit(6)
    .lean();
  return JSON.parse(JSON.stringify(courses));
}

/**
 * Cached function for single public course by slug.
 */
export async function getCachedCourseBySlug(slug) {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();
  const course = await Course.findOne({
    slug: slug.toLowerCase(),
    $or: [{ status: "published" }, { published: true }],
  }).lean();
  return course ? JSON.parse(JSON.stringify(course)) : null;
}

import { isLectureFree } from "./lectureService.js";

/**
 * Cached public lecture outlines for a course.
 * Server-enforced: locked lectures expose only id, title, chapter, book, duration, isFree, locked.
 * Provider IDs, video URLs, and tokens are NEVER exposed in page HTML or props for non-enrolled users.
 */
export async function getCachedCourseLectures(courseId) {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();

  let targetCourseId = courseId;
  if (!mongoose.isValidObjectId(String(courseId))) {
    const found = await Course.findOne({
      slug: String(courseId).toLowerCase().trim(),
    })
      .select("_id")
      .lean();
    if (found) targetCourseId = found._id;
  }

  const lectures = await Lecture.find({
    courseId: targetCourseId,
    status: { $ne: "archived" },
  })
    .populate("bookId", "title position status")
    .populate("chapterId", "title position status")
    .sort({ bookNo: 1, chapterNo: 1, lectureNo: 1, position: 1, order: 1, createdAt: 1 })
    .lean();

  const sanitized = lectures.map((lec) => {
    const isFree = Boolean(
      lec.isFree === true ||
      lec.isFreePreview === true ||
      lec.freePreview === true ||
      lec.isPreview === true
    );
    const bookTitle = lec.bookTitle || lec.bookId?.title || lec.book || "Book 1";
    const chapterTitle = lec.chapterTitle || lec.chapterId?.title || lec.chapter || lec.section || "General";
    const dur = lec.durationSeconds || lec.durationSec || 0;
    const bookNo = lec.bookNo || lec.bookId?.position || 1;
    const chapterNo = lec.chapterNo || lec.chapterId?.position || 1;
    const lectureNo = lec.lectureNo || (lec.position !== undefined ? lec.position : (lec.order || 1));

    const hasVideo = Boolean(lec.vimeoId && lec.vimeoId.trim() !== "");

    const base = {
      id: lec._id.toString(),
      _id: lec._id.toString(),
      title: lec.title,
      partNumber: lectureNo,
      lectureNo: lectureNo,
      bookNo: bookNo,
      bookTitle: bookTitle,
      chapterNo: chapterNo,
      chapterTitle: chapterTitle,
      chapter: chapterTitle,
      section: chapterTitle,
      book: bookTitle,
      bookId: lec.bookId?._id ? lec.bookId._id.toString() : lec.bookId ? lec.bookId.toString() : null,
      chapterId: lec.chapterId?._id ? lec.chapterId._id.toString() : lec.chapterId ? lec.chapterId.toString() : null,
      bookPosition: bookNo,
      chapterPosition: chapterNo,
      duration: dur,
      durationSec: dur,
      durationSeconds: dur,
      duration_mmss: lec.duration_mmss,
      position: lectureNo,
      order: lectureNo,
      isFree,
      freePreview: isFree,
      isPreview: isFree,
      locked: !isFree,
      hasVideo,
    };

    return base;
  });

  return JSON.parse(JSON.stringify(sanitized));
}

/**
 * Cached website numbers and lecture count for Home stats band.
 */
export async function getCachedWebsiteStats() {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();
  const [settings, publishedLecturesCount] = await Promise.all([
    Settings.findOne().select("websiteNumbers").lean(),
    Lecture.countDocuments({ published: true }),
  ]);
  return {
    websiteNumbers: settings?.websiteNumbers
      ? JSON.parse(JSON.stringify(settings.websiteNumbers))
      : {},
    publishedLecturesCount,
  };
}

/**
 * Cached related courses (up to 3, same category first, then others).
 */
export async function getCachedRelatedCourses(courseId, category) {
  "use cache";
  cacheTag("courses");
  cacheLife("max");
  await connectDB();

  const courses = await Course.find({
    _id: { $ne: courseId },
    published: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .limit(8)
    .lean();

  const withLectureCounts = await Promise.all(
    courses.map(async (c) => {
      const lectureCount = await Lecture.countDocuments({
        courseId: c._id,
        published: true,
      });
      return {
        _id: c._id.toString(),
        title: c.title,
        subtitle: c.subtitle,
        slug: c.slug,
        category: c.category,
        tone: c.tone,
        theme: c.theme || c.tone || "blue",
        lectureCount,
      };
    })
  );

  return JSON.parse(JSON.stringify(withLectureCounts));
}

/**
 * Returns all courses for admin with counts of lectures and active students.
 */
export async function getAdminCourses() {
  await connectDB();
  const courses = await Course.find({
    slug: { $not: /^e2e-/ }
  }).sort({ homeOrder: 1, sortOrder: 1, order: 1, createdAt: 1 }).lean();

  const coursesWithStats = await Promise.all(
    courses.map(async (c) => {
      const [lectureCount, studentCount] = await Promise.all([
        Lecture.countDocuments({ courseId: c._id }),
        Enrollment.countDocuments({ courseId: c._id, status: "active" }),
      ]);
      return {
        ...c,
        lectureCount,
        studentCount,
      };
    })
  );

  return coursesWithStats;
}

/**
 * Returns a single course by ID.
 */
export async function getCourseById(courseId) {
  await connectDB();
  return Course.findById(courseId).lean();
}

/**
 * Returns a single course by slug.
 */
export async function getCourseBySlug(slug) {
  await connectDB();
  return Course.findOne({ slug: slug.toLowerCase() }).lean();
}

/**
 * Creates a new course. Order is automatically assigned order = max + 1.
 */
export async function createCourse(data, adminId) {
  await connectDB();

  let baseSlug = slugify(data.slug || data.title);
  if (!baseSlug) baseSlug = "course";

  let slug = baseSlug;
  let counter = 1;
  while (await Course.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Calculate order = max + 1
  const maxCourse = await Course.findOne().sort({ order: -1 }).select("order").lean();
  const nextOrder = (maxCourse?.order ?? 0) + 1;

  const TONE_CYCLE = ["sky", "yellow", "orange", "green", "purple", "red"];
  let assignedTone = data.tone;
  if (!assignedTone || !TONE_CYCLE.includes(assignedTone)) {
    const totalCourses = await Course.countDocuments();
    assignedTone = TONE_CYCLE[totalCourses % TONE_CYCLE.length];
  }

  const course = await Course.create({
    title: (data.title || "").trim(),
    subtitle: (data.subtitle || "").trim(),
    slug,
    category: data.category || "class12",
    classLabel: (data.classLabel || "Class 12").trim(),
    badgeText: (data.badgeText || "").trim(),
    badgeVariant: data.badgeVariant || "crown-navy",
    theme: data.theme || assignedTone || "blue",
    tone: data.theme || assignedTone || "sky",
    illustration: data.illustration || "books-blue",
    illustrationKey: (data.illustrationKey || "").trim(),
    illustrationUrl: (data.illustrationUrl || "").trim(),
    illustrationAssetId: data.illustrationAssetId || null,
    description: (data.description || "").trim(),
    metaLeft: (data.metaLeft || "").trim(),
    metaRight: (data.metaRight || "").trim(),
    metaIcon: data.metaIcon || "video",
    metaText: (data.metaText || "").trim(),
    rating: typeof data.rating === "number" ? data.rating : 4.8,
    ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : 0,
    categories: Array.isArray(data.categories) ? data.categories : [],
    price: data.price !== undefined ? data.price : 0,
    status: data.status || (data.published ? "published" : "draft"),
    showOnHome: Boolean(data.showOnHome ?? data.featured),
    homeOrder: typeof data.homeOrder === "number" ? data.homeOrder : nextOrder,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : nextOrder,
    language: (data.language || "Bilingual").trim(),
    facultyName: (data.facultyName || "Ronak Dugar").trim(),
    facultyRole: (data.facultyRole || "Lead Accountancy Faculty").trim(),
    facultyAvatarAssetId: data.facultyAvatarAssetId || null,
    whatsappText: (data.whatsappText || "").trim(),
    thumbnail: (data.thumbnail || "").trim(),
    published: data.status === "published" || !!data.published,
    featured: Boolean(data.showOnHome ?? data.featured),
    order: data.order !== undefined && data.order !== null && !isNaN(Number(data.order)) ? Number(data.order) : nextOrder,
    about: (data.about || "").trim(),
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    includes: Array.isArray(data.includes) ? data.includes : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    facultyBullets: Array.isArray(data.facultyBullets) ? data.facultyBullets : [],
    facultyProfileUrl: (data.facultyProfileUrl || "").trim(),
    heroIllustration: data.heroIllustration || "books-subjects",
  });

  await logAuditEvent({
    actorId: adminId,
    action: "course.created",
    targetType: "course",
    targetId: course._id.toString(),
    meta: { title: course.title, slug: course.slug },
  });

  await createAdminNotification({
    type: "course_created",
    title: "Course Created",
    message: `Course "${course.title}" was created`,
    link: `/admin/courses/${course._id}`,
    entityId: course._id.toString(),
  });

  await invalidateCoursesCache();

  return course;
}

/**
 * Updates an existing course.
 */
export async function updateCourse(courseId, data, adminId) {
  await connectDB();
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found.");
  }

  if (data.title !== undefined) course.title = data.title.trim();
  if (data.subtitle !== undefined) course.subtitle = (data.subtitle || "").trim();

  if (data.slug) {
    const desiredSlug = slugify(data.slug);
    if (desiredSlug !== course.slug) {
      const exists = await Course.exists({
        slug: desiredSlug,
        _id: { $ne: courseId },
      });
      if (exists) {
        throw new Error(`Slug "${desiredSlug}" is already in use.`);
      }
      course.slug = desiredSlug;
    }
  }

  if (data.category !== undefined) course.category = data.category;
  if (data.classLabel !== undefined) course.classLabel = data.classLabel.trim();
  if (data.badgeText !== undefined) course.badgeText = (data.badgeText || "").trim();
  if (data.badgeVariant !== undefined) course.badgeVariant = data.badgeVariant;
  if (data.theme !== undefined) {
    course.theme = data.theme;
    course.tone = data.theme;
  }
  if (data.tone !== undefined && !data.theme) course.tone = data.tone;
  if (data.illustration !== undefined) course.illustration = data.illustration;
  if (data.illustrationKey !== undefined) course.illustrationKey = data.illustrationKey.trim();
  if (data.illustrationUrl !== undefined) course.illustrationUrl = data.illustrationUrl.trim();
  if (data.illustrationAssetId !== undefined) course.illustrationAssetId = data.illustrationAssetId;
  if (typeof data.description === "string") course.description = data.description.trim();
  if (data.metaLeft !== undefined) course.metaLeft = (data.metaLeft || "").trim();
  if (data.metaRight !== undefined) course.metaRight = (data.metaRight || "").trim();
  if (data.metaIcon !== undefined) course.metaIcon = data.metaIcon;
  if (data.metaText !== undefined) course.metaText = (data.metaText || "").trim();
  if (data.rating !== undefined) course.rating = Number(data.rating);
  if (data.ratingCount !== undefined) course.ratingCount = Number(data.ratingCount);
  if (Array.isArray(data.categories)) course.categories = data.categories;
  if (data.price !== undefined) course.price = data.price;
  if (data.status !== undefined) {
    course.status = data.status;
    course.published = data.status === "published";
  } else if (typeof data.published === "boolean") {
    course.published = data.published;
    course.status = data.published ? "published" : "draft";
  }
  if (typeof data.showOnHome === "boolean") {
    course.showOnHome = data.showOnHome;
    course.featured = data.showOnHome;
  } else if (typeof data.featured === "boolean") {
    course.featured = data.featured;
    course.showOnHome = data.featured;
  }
  if (typeof data.homeOrder === "number") course.homeOrder = data.homeOrder;
  if (typeof data.sortOrder === "number") course.sortOrder = data.sortOrder;
  if (typeof data.order === "number") course.order = data.order;
  if (data.language !== undefined) course.language = (data.language || "Bilingual").trim();
  if (data.facultyName !== undefined) course.facultyName = (data.facultyName || "Ronak Dugar").trim();
  if (data.facultyRole !== undefined) course.facultyRole = (data.facultyRole || "Lead Accountancy Faculty").trim();
  if (data.facultyAvatarAssetId !== undefined) course.facultyAvatarAssetId = data.facultyAvatarAssetId;
  if (data.whatsappText !== undefined) course.whatsappText = (data.whatsappText || "").trim();
  if (typeof data.thumbnail === "string") course.thumbnail = data.thumbnail.trim();
  if (data.about !== undefined) course.about = (data.about || "").trim();
  if (Array.isArray(data.highlights)) course.highlights = data.highlights;
  if (Array.isArray(data.includes)) course.includes = data.includes;
  if (Array.isArray(data.faqs)) course.faqs = data.faqs;
  if (Array.isArray(data.facultyBullets)) course.facultyBullets = data.facultyBullets;
  if (data.facultyProfileUrl !== undefined) course.facultyProfileUrl = (data.facultyProfileUrl || "").trim();
  if (data.heroIllustration !== undefined) course.heroIllustration = data.heroIllustration;

  await course.save();

  await logAuditEvent({
    actorId: adminId,
    action: "course.updated",
    targetType: "course",
    targetId: course._id.toString(),
    meta: { title: course.title },
  });

  await createAdminNotification({
    type: "course_updated",
    title: "Course Updated",
    message: `Course "${course.title}" was updated`,
    link: `/admin/courses/${course._id}`,
    entityId: course._id.toString(),
  });

  await invalidateCoursesCache();

  return course;
}

/**
 * Duplicates a course.
 */
export async function duplicateCourse(courseId, adminId) {
  await connectDB();
  const source = await Course.findById(courseId).lean();
  if (!source) throw new Error("Course not found.");

  let baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let counter = 1;
  while (await Course.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const { _id, createdAt, updatedAt, __v, ...rest } = source;
  const duplicate = await Course.create({
    ...rest,
    title: `${source.title} (Copy)`,
    slug,
    status: "draft",
    published: false,
    showOnHome: false,
    featured: false,
  });

  await logAuditEvent({
    actorId: adminId,
    action: "course.duplicated",
    targetType: "course",
    targetId: duplicate._id.toString(),
    meta: { sourceId: courseId, title: duplicate.title, slug: duplicate.slug },
  });

  await invalidateCoursesCache();
  return duplicate;
}

/**
 * Reorders courses by swapping orders with neighboring course.
 */
export async function reorderCourse(courseId, direction, adminId) {
  await connectDB();
  const current = await Course.findById(courseId);
  if (!current) throw new Error("Course not found.");

  const allCourses = await Course.find().sort({ order: 1, createdAt: 1 });
  const index = allCourses.findIndex((c) => c._id.toString() === courseId.toString());
  if (index === -1) throw new Error("Course not found in list.");

  if (direction === "up" && index > 0) {
    const prev = allCourses[index - 1];
    const temp = current.order;
    current.order = prev.order;
    prev.order = temp;
    await current.save();
    await prev.save();
  } else if (direction === "down" && index < allCourses.length - 1) {
    const next = allCourses[index + 1];
    const temp = current.order;
    current.order = next.order;
    next.order = temp;
    await current.save();
    await next.save();
  }

  await invalidateCoursesCache();

  return { success: true };
}

/**
 * Deletes a course. Blocked while students are enrolled; offers Unpublish instead.
 */
export async function deleteCourse(courseId, adminId) {
  await connectDB();

  const activeEnrollments = await Enrollment.countDocuments({
    courseId,
    status: "active",
  });

  if (activeEnrollments > 0) {
    throw new Error(
      `Cannot delete course: ${activeEnrollments} student(s) are currently enrolled. Please Unpublish the course instead to hide it from new visitors.`
    );
  }

  await Lecture.deleteMany({ courseId });
  await Enrollment.deleteMany({ courseId });
  await Progress.deleteMany({ courseId });
  await Course.findByIdAndDelete(courseId);

  await logAuditEvent({
    actorId: adminId,
    action: "course.deleted",
    targetType: "course",
    targetId: courseId.toString(),
    meta: {},
  });

  await invalidateCoursesCache();

  return { success: true };
}

/**
 * Returns courses enrolled by a student with their progress percentage.
 */
export async function getStudentEnrolledCourses(studentId) {
  await connectDB();
  const now = new Date();

  const enrollments = await Enrollment.find({
    userId: studentId,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .populate("courseId")
    .lean();

  const courses = [];
  for (const enr of enrollments) {
    if (!enr.courseId || !enr.courseId.published) continue;

    const course = enr.courseId;
    const totalLectures = await Lecture.countDocuments({
      courseId: course._id,
      published: true,
    });

    const completedLectures = await Progress.countDocuments({
      userId: studentId,
      courseId: course._id,
      completed: true,
    });

    const percent =
      totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    courses.push({
      _id: course._id.toString(),
      title: course.title,
      subtitle: course.subtitle,
      slug: course.slug,
      category: course.category,
      classLabel: course.classLabel,
      badgeText: course.badgeText,
      badgeVariant: course.badgeVariant,
      tone: course.tone,
      illustration: course.illustration,
      description: course.description,
      metaIcon: course.metaIcon,
      metaText: course.metaText,
      language: course.language,
      facultyName: course.facultyName,
      facultyRole: course.facultyRole,
      thumbnail: course.thumbnail,
      totalLectures,
      completedLectures,
      progressPercent: percent,
      expiresAt: enr.expiresAt,
    });
  }

  return courses;
}
