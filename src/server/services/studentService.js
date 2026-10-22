import "server-only";
import crypto from "crypto";
import connectDB from "../db/connect.js";
import { User } from "../db/models/User.js";
import { Device } from "../db/models/Device.js";
import { Session } from "../db/models/Session.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { AuditLog } from "../db/models/AuditLog.js";
import { hashPassword, comparePassword } from "../auth/password.js";
import { logAuditEvent } from "./audit.js";

/**
 * Generates next sequential student loginId (e.g. rd1001, rd1002...).
 */
export async function generateNextLoginId() {
  await connectDB();
  const latestStudent = await User.findOne({
    role: "student",
    loginId: /^rd\d+$/,
  })
    .sort({ loginId: -1 })
    .lean();

  if (!latestStudent) {
    return "rd1001";
  }

  const match = latestStudent.loginId.match(/^rd(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `rd${nextNum}`;
  }
  return `rd${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Generates 10 readable random characters without easily confused glyphs (0, O, 1, l, I).
 */
export function generateReadablePassword() {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  let pwd = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

/**
 * Queries students with search, status filtering, and pagination.
 */
export async function getStudentsList({
  search = "",
  status = "",
  page = 1,
  limit = 20,
} = {}) {
  await connectDB();
  const query = { role: "student" };

  if (status && (status === "active" || status === "blocked")) {
    query.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { loginId: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    students,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Loads a student by ID along with their devices, active sessions, enrollments and recent activity.
 */
export async function getStudentDetail(studentId) {
  await connectDB();
  const student = await User.findOne({ _id: studentId, role: "student" })
    .select("-passwordHash")
    .lean();

  if (!student) return null;

  const [devices, sessions, enrollments, recentActivity] = await Promise.all([
    Device.find({ userId: studentId }).sort({ lastUsedAt: -1 }).lean(),
    Session.find({ userId: studentId }).sort({ lastSeenAt: -1 }).lean(),
    Enrollment.find({ userId: studentId })
      .populate("courseId", "title slug published")
      .sort({ createdAt: -1 })
      .lean(),
    AuditLog.find({ targetId: studentId.toString() })
      .sort({ at: -1 })
      .limit(20)
      .populate("actorId", "name loginId")
      .lean(),
  ]);

  return {
    student,
    devices,
    sessions,
    enrollments,
    recentActivity,
  };
}

/**
 * Creates a new student record with optional course enrollments.
 */
export async function createStudent(
  {
    name,
    phone,
    loginId,
    password,
    deviceLimit = 1,
    mustChangePassword = false,
    courseIds = [],
  },
  adminId
) {
  await connectDB();
  const normalizedLoginId = (loginId || "").trim().toLowerCase();

  const existing = await User.findOne({ loginId: normalizedLoginId });
  if (existing) {
    throw new Error(`A user with login ID "${normalizedLoginId}" already exists.`);
  }

  const passwordHash = await hashPassword(password);

  const student = await User.create({
    role: "student",
    name: name.trim(),
    phone: phone ? phone.trim() : "",
    loginId: normalizedLoginId,
    passwordHash,
    deviceLimit: Math.min(Math.max(deviceLimit || 1, 1), 3),
    deviceCount: 0,
    mustChangePassword: !!mustChangePassword,
    status: "active",
  });

  // Enroll in courses if provided
  if (Array.isArray(courseIds) && courseIds.length > 0) {
    const enrollDocs = courseIds.map((cId) => ({
      userId: student._id,
      courseId: cId,
      status: "active",
      startsAt: new Date(),
      assignedBy: adminId,
    }));
    await Enrollment.insertMany(enrollDocs);
  }

  await logAuditEvent({
    actorId: adminId,
    action: "student.created",
    targetType: "student",
    targetId: student._id.toString(),
    meta: {
      loginId: student.loginId,
      name: student.name,
      deviceLimit: student.deviceLimit,
      enrollmentCount: courseIds.length,
    },
  });

  return {
    student: {
      _id: student._id.toString(),
      name: student.name,
      loginId: student.loginId,
      phone: student.phone,
    },
    rawPassword: password,
  };
}

/**
 * Updates student profile details.
 */
export async function updateStudentProfile(studentId, { name, phone }, adminId) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  student.name = (name || "").trim();
  student.phone = (phone || "").trim();
  await student.save();

  await logAuditEvent({
    actorId: adminId,
    action: "student.profile_updated",
    targetType: "student",
    targetId: studentId.toString(),
    meta: { name: student.name, phone: student.phone },
  });

  return { success: true };
}

/**
 * Blocks a student and instantly deletes all their active sessions.
 */
export async function blockStudent(studentId, adminId) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  student.status = "blocked";
  await student.save();

  // Instantly terminate all active sessions
  await Session.deleteMany({ userId: studentId });

  await logAuditEvent({
    actorId: adminId,
    action: "student.blocked",
    targetType: "student",
    targetId: studentId.toString(),
    meta: {},
  });

  return { success: true };
}

/**
 * Unblocks a student.
 */
export async function unblockStudent(studentId, adminId) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  student.status = "active";
  await student.save();

  await logAuditEvent({
    actorId: adminId,
    action: "student.unblocked",
    targetType: "student",
    targetId: studentId.toString(),
    meta: {},
  });

  return { success: true };
}

/**
 * Admin resets student's password.
 */
export async function adminResetPassword(
  studentId,
  newPassword,
  revokeSessions = true,
  adminId
) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  const passwordHash = await hashPassword(newPassword);
  student.passwordHash = passwordHash;
  await student.save();

  if (revokeSessions) {
    await Session.deleteMany({ userId: studentId });
  }

  await logAuditEvent({
    actorId: adminId,
    action: "student.password_reset_by_admin",
    targetType: "student",
    targetId: studentId.toString(),
    meta: { sessionsRevoked: revokeSessions },
  });

  return { success: true };
}

/**
 * Student changes own password. Requires current password and revokes other sessions.
 */
export async function studentChangePassword({
  userId,
  currentPassword,
  newPassword,
  currentSessionId,
}) {
  await connectDB();
  const student = await User.findById(userId);
  if (!student) {
    throw new Error("User not found.");
  }

  const isValid = await comparePassword(currentPassword, student.passwordHash);
  if (!isValid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  student.passwordHash = passwordHash;
  student.mustChangePassword = false;
  await student.save();

  // Revoke all sessions except current session
  if (currentSessionId) {
    await Session.deleteMany({
      userId,
      _id: { $ne: currentSessionId },
    });
  } else {
    await Session.deleteMany({ userId });
  }

  await logAuditEvent({
    actorId: userId,
    action: "student.password_changed",
    targetType: "student",
    targetId: userId.toString(),
    meta: {},
  });

  return { success: true };
}
