import "server-only";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { User } from "../db/models/User.js";
import { Course } from "../db/models/Course.js";
import { Enrollment } from "../db/models/Enrollment.js";

/**
 * Single source of truth for student course access.
 * Reads fresh student data directly from MongoDB on every invocation.
 * Resolves legacy strings, slugs, titles, and ObjectIds to canonical course documents.
 * Never relies on session token for course enrollments.
 */
export async function getStudentCourseAccess(sessionOrUser) {
  await connectDB();

  const studentId =
    sessionOrUser?.user?._id ||
    sessionOrUser?.userId ||
    sessionOrUser?._id ||
    sessionOrUser;

  if (!studentId || !mongoose.isValidObjectId(String(studentId))) {
    return {
      authenticated: false,
      student: null,
      studentId: null,
      enrolledCourseIds: [],
      enrolledSlugs: [],
      activeCourses: [],
      hasAnyCourse: false,
      canonicalCourse: null,
      isEnrolledInCourse: () => false,
    };
  }

  const user = await User.findById(studentId).lean();
  if (!user || user.role !== "student" || user.status === "blocked") {
    return {
      authenticated: false,
      student: null,
      studentId: null,
      enrolledCourseIds: [],
      enrolledSlugs: [],
      activeCourses: [],
      hasAnyCourse: false,
      canonicalCourse: null,
      isEnrolledInCourse: () => false,
    };
  }

  const now = new Date();
  const userObjId = user._id;
  const userStrId = String(user._id);

  // 1. Gather active enrollments from Enrollment collection
  const enrollmentDocs = await Enrollment.find({
    $and: [
      {
        $or: [
          { userId: userObjId },
          { studentId: userObjId },
          { userId: userStrId },
          { studentId: userStrId },
        ],
      },
      { status: { $ne: "cancelled" } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  }).lean();

  // 2. Gather raw course references from user document
  const rawIdentifiers = [];

  // From Enrollment docs
  for (const e of enrollmentDocs) {
    if (e.courseId) rawIdentifiers.push(e.courseId);
  }

  // From user.courses
  if (Array.isArray(user.courses)) {
    for (const c of user.courses) {
      if (c) rawIdentifiers.push(c._id || c);
    }
  }

  // From user.enrolledCourses (legacy field)
  if (Array.isArray(user.enrolledCourses)) {
    for (const c of user.enrolledCourses) {
      if (c) rawIdentifiers.push(c._id || c);
    }
  }

  // 3. Separate ObjectIds and text identifiers
  const objectIds = [];
  const textMatches = [];

  for (const item of rawIdentifiers) {
    if (!item) continue;
    const str = String(item).trim();
    if (!str) continue;

    if (mongoose.isValidObjectId(str)) {
      objectIds.push(new mongoose.Types.ObjectId(str));
    } else {
      textMatches.push(str);
      textMatches.push(str.toLowerCase());
    }
  }

  // 4. Resolve against Course collection
  const queryConditions = [];
  if (objectIds.length > 0) {
    queryConditions.push({ _id: { $in: objectIds } });
  }
  if (textMatches.length > 0) {
    queryConditions.push({ slug: { $in: textMatches } });
    queryConditions.push({ title: { $in: textMatches } });
  }

  let resolvedCourses = [];
  if (queryConditions.length > 0) {
    resolvedCourses = await Course.find({
      $or: queryConditions,
      status: { $ne: "archived" },
    })
      .sort({ homeOrder: 1, sortOrder: 1, order: 1, createdAt: 1 })
      .lean();
  }

  // 5. Deduplicate and normalize
  const seenIds = new Set();
  const activeCourses = [];

  for (const c of resolvedCourses) {
    const idStr = c._id.toString();
    if (!seenIds.has(idStr)) {
      seenIds.add(idStr);
      activeCourses.push({
        ...c,
        _id: idStr,
        id: idStr,
      });
    }
  }

  const enrolledCourseIds = Array.from(seenIds);
  const enrolledSlugs = activeCourses.map((c) => c.slug).filter(Boolean);

  const isEnrolledInCourse = (courseIdOrSlug) => {
    if (!courseIdOrSlug) return false;
    const target = String(courseIdOrSlug).toLowerCase().trim();
    return activeCourses.some(
      (c) =>
        c._id.toLowerCase() === target ||
        (c.slug && c.slug.toLowerCase() === target)
    );
  };

  return {
    authenticated: true,
    student: {
      _id: user._id.toString(),
      name: user.name,
      loginId: user.loginId,
      phone: user.phone || "",
      email: user.email || "",
      className: user.className || "12",
      validUntil: user.validUntil || null,
      maxDevices: user.maxDevices || 1,
    },
    studentId: user._id.toString(),
    enrolledCourseIds,
    enrolledSlugs,
    activeCourses,
    hasAnyCourse: activeCourses.length > 0,
    canonicalCourse: activeCourses[0] || null,
    isEnrolledInCourse,
  };
}
