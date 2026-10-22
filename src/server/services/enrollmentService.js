import "server-only";
import connectDB from "../db/connect.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { Course } from "../db/models/Course.js";
import { User } from "../db/models/User.js";
import { logAuditEvent } from "./audit.js";

/**
 * Enrolls a student in a course or updates existing enrollment status.
 */
export async function enrollStudentInCourse({
  userId,
  courseId,
  expiresAt = null,
  assignedBy,
}) {
  await connectDB();
  const [user, course] = await Promise.all([
    User.findById(userId),
    Course.findById(courseId),
  ]);

  if (!user || user.role !== "student") {
    throw new Error("Student not found.");
  }
  if (!course) {
    throw new Error("Course not found.");
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        status: "active",
        startsAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        assignedBy,
      },
    },
    { upsert: true, new: true }
  );

  await logAuditEvent({
    actorId: assignedBy,
    action: "enrollment.created_or_updated",
    targetType: "enrollment",
    targetId: enrollment._id.toString(),
    meta: {
      userId: userId.toString(),
      courseId: courseId.toString(),
      expiresAt,
    },
  });

  return enrollment;
}

/**
 * Revokes a student's enrollment in a course.
 */
export async function revokeEnrollment(enrollmentId, adminId) {
  await connectDB();
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  enrollment.status = "revoked";
  await enrollment.save();

  await logAuditEvent({
    actorId: adminId,
    action: "enrollment.revoked",
    targetType: "enrollment",
    targetId: enrollment._id.toString(),
    meta: {
      userId: enrollment.userId.toString(),
      courseId: enrollment.courseId.toString(),
    },
  });

  return { success: true };
}

/**
 * Updates expiry date of an enrollment.
 */
export async function updateEnrollmentExpiry(enrollmentId, newExpiresAt, adminId) {
  await connectDB();
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  enrollment.expiresAt = newExpiresAt ? new Date(newExpiresAt) : null;
  await enrollment.save();

  await logAuditEvent({
    actorId: adminId,
    action: "enrollment.expiry_updated",
    targetType: "enrollment",
    targetId: enrollment._id.toString(),
    meta: { newExpiresAt },
  });

  return { success: true };
}
