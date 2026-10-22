import "server-only";
import connectDB from "../db/connect.js";
import { Course } from "../db/models/Course.js";
import { Lecture } from "../db/models/Lecture.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Progress } from "../db/models/Progress.js";
import { logAuditEvent } from "./audit.js";

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
 * Returns all courses for admin with counts of lectures and active students.
 */
export async function getAdminCourses() {
  await connectDB();
  const courses = await Course.find().sort({ order: 1, createdAt: -1 }).lean();

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
 * Creates a new course.
 */
export async function createCourse(data, adminId) {
  await connectDB();
  let baseSlug = slugify(data.title);
  if (!baseSlug) baseSlug = "course";

  let slug = baseSlug;
  let counter = 1;
  while (await Course.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const course = await Course.create({
    title: data.title.trim(),
    slug,
    description: (data.description || "").trim(),
    thumbnail: (data.thumbnail || "").trim(),
    published: !!data.published,
    order: Number(data.order) || 0,
  });

  await logAuditEvent({
    actorId: adminId,
    action: "course.created",
    targetType: "course",
    targetId: course._id.toString(),
    meta: { title: course.title, slug: course.slug },
  });

  return course;
}

/**
 * Updates a course.
 */
export async function updateCourse(courseId, data, adminId) {
  await connectDB();
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found.");
  }

  if (data.title) course.title = data.title.trim();
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
  if (typeof data.description === "string") course.description = data.description.trim();
  if (typeof data.thumbnail === "string") course.thumbnail = data.thumbnail.trim();
  if (typeof data.published === "boolean") course.published = data.published;
  if (typeof data.order === "number") course.order = data.order;

  await course.save();

  await logAuditEvent({
    actorId: adminId,
    action: "course.updated",
    targetType: "course",
    targetId: course._id.toString(),
    meta: { title: course.title },
  });

  return course;
}

/**
 * Deletes a course and cascades lecture removal.
 */
export async function deleteCourse(courseId, adminId) {
  await connectDB();
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
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      totalLectures,
      completedLectures,
      progressPercent: percent,
      expiresAt: enr.expiresAt,
    });
  }

  return courses;
}
