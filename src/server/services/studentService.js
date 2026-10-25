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
  noEmail = false,
  page = 1,
  limit = 20,
} = {}) {
  await connectDB();
  const query = { role: "student" };

  if (status && (status === "active" || status === "blocked")) {
    query.status = status;
  }

  if (noEmail) {
    query.$or = [{ email: { $exists: false } }, { email: "" }, { email: null }];
  }

  if (search && search.trim()) {
    const s = search.trim();
    const searchFilter = [
      { name: { $regex: s, $options: "i" } },
      { loginId: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchFilter }];
      delete query.$or;
    } else {
      query.$or = searchFilter;
    }
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
 * Creates a new student record with optional course enrollments and payment notes.
 */
export async function createStudent(
  {
    name,
    phone = "",
    email = "",
    className = "12",
    school = "",
    loginId,
    password,
    deviceLimit = 1,
    mustChangePassword = false,
    courseIds = [],
    courseAssignments = [], // array of { courseId, expiresAt, paymentNote: { amount, mode, remark } }
  },
  adminId
) {
  await connectDB();
  const { getNextStudentCode } = await import("./studentCodeService.js");
  const { Course } = await import("../db/models/Course.js");

  const studentCode = await getNextStudentCode();
  const defaultLoginId = studentCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedLoginId = (loginId || defaultLoginId).trim().toLowerCase();

  const existing = await User.findOne({ loginId: normalizedLoginId });
  if (existing) {
    throw new Error(`A user with login ID "${normalizedLoginId}" already exists.`);
  }

  const passwordHash = await hashPassword(password);

  const student = await User.create({
    role: "student",
    studentCode,
    name: name.trim(),
    className: className || "12",
    school: (school || "").trim(),
    phone: phone ? phone.trim() : "",
    email: email ? email.trim().toLowerCase() : "",
    loginId: normalizedLoginId,
    passwordHash,
    deviceLimit: Math.min(Math.max(deviceLimit || 1, 1), 3),
    deviceCount: 0,
    mustChangePassword: !!mustChangePassword,
    status: "active",
    createdBy: adminId,
  });

  // Default validity date: 31 March of next academic year
  const currentYear = new Date().getFullYear();
  const defaultValidity = new Date(currentYear + 1, 2, 31, 23, 59, 59); // 31 March

  // Collect course enrollment details
  const assignments = [];
  if (Array.isArray(courseAssignments) && courseAssignments.length > 0) {
    courseAssignments.forEach((ca) => {
      if (ca.courseId) {
        assignments.push({
          userId: student._id,
          courseId: ca.courseId,
          status: "active",
          startsAt: new Date(),
          expiresAt: ca.expiresAt ? new Date(ca.expiresAt) : defaultValidity,
          paymentNote: ca.paymentNote || {},
          assignedBy: adminId,
        });
      }
    });
  } else if (Array.isArray(courseIds) && courseIds.length > 0) {
    courseIds.forEach((cId) => {
      assignments.push({
        userId: student._id,
        courseId: cId,
        status: "active",
        startsAt: new Date(),
        expiresAt: defaultValidity,
        assignedBy: adminId,
      });
    });
  }

  if (assignments.length > 0) {
    await Enrollment.insertMany(assignments);
  }

  // Fetch course titles for welcome WhatsApp message
  const assignedCourseIds = assignments.map((a) => a.courseId);
  const enrolledCourses = await Course.find({ _id: { $in: assignedCourseIds } })
    .select("title")
    .lean();

  const courseTitles = enrolledCourses.map((c) => c.title).join(", ") || "Enrolled Course(s)";
  const earliestExpiryStr = assignments[0]?.expiresAt
    ? new Date(assignments[0].expiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "31 March";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";
  const whatsappMessage = `Hello ${student.name}, welcome to RD Classes! Login ID: ${student.loginId} | Password: ${password} | Portal: ${siteUrl}/student/login | Courses: ${courseTitles} (valid until ${earliestExpiryStr}). Note: your account works on one approved device. To use another device, please ask Sir for approval.`;

  await logAuditEvent({
    actorId: adminId,
    action: "student.created",
    targetType: "student",
    targetId: student._id.toString(),
    meta: {
      studentCode: student.studentCode,
      loginId: student.loginId,
      name: student.name,
      deviceLimit: student.deviceLimit,
      enrollmentCount: assignments.length,
    },
  });

  return {
    student: {
      _id: student._id.toString(),
      studentCode: student.studentCode,
      name: student.name,
      loginId: student.loginId,
      className: student.className,
      phone: student.phone,
      email: student.email,
    },
    rawPassword: password,
    courseTitles,
    validUntil: earliestExpiryStr,
    whatsappMessage,
  };
}

/**
 * Updates student profile details.
 */
export async function updateStudentProfile(studentId, { name, phone, email }, adminId) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  student.name = (name || "").trim();
  student.phone = (phone || "").trim();
  if (data.email !== undefined) {
    student.email = (data.email || "").trim().toLowerCase();
  }
  await student.save();

  await logAuditEvent({
    actorId: adminId,
    action: "student.profile_updated",
    targetType: "student",
    targetId: studentId.toString(),
    meta: { name: student.name, phone: student.phone, email: student.email },
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
 * Admin resets student's password and emails the new credentials.
 * Shows the generated password once to the admin.
 */
export async function resetStudentPasswordAndEmail(
  studentId,
  revokeSessions = true,
  adminId
) {
  await connectDB();
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  if (!student.email) {
    throw new Error("Student does not have an email address configured.");
  }

  const { Course } = await import("../db/models/Course.js");
  const { renderCredentialsTemplate } = await import("../email/templates/credentials.js");
  const { sendEmail } = await import("../email/emailService.js");

  const newPassword = generateReadablePassword();
  const passwordHash = await hashPassword(newPassword);
  student.passwordHash = passwordHash;
  await student.save();

  if (revokeSessions) {
    await Session.deleteMany({ userId: studentId });
  }

  // Fetch active enrollments with course titles
  const enrollments = await Enrollment.find({
    userId: student._id,
    status: "active",
  }).lean();

  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("title")
    .lean();

  const coursesWithDates = enrollments.map((e) => {
    const c = courses.find((x) => x._id.toString() === e.courseId.toString());
    return {
      title: c?.title || "Enrolled Course",
      validUntil: e.expiresAt,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";
  const { subject, html, text } = renderCredentialsTemplate({
    studentName: student.name,
    loginId: student.loginId,
    password: newPassword,
    loginUrl: `${siteUrl}/student/login`,
    courses: coursesWithDates,
  });

  const sendResult = await sendEmail({
    to: student.email,
    subject,
    html,
    text,
    kind: "credentials",
    studentId: student._id,
    createdBy: adminId,
  });

  await logAuditEvent({
    actorId: adminId,
    action: "student.password_reset_and_emailed",
    targetType: "student",
    targetId: studentId.toString(),
    meta: {
      sessionsRevoked: revokeSessions,
      emailSent: sendResult.success,
      toEmail: student.email,
    },
  });

  return {
    success: true,
    newPassword,
    emailResult: sendResult,
  };
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
  const { Settings } = await import("../db/models/Settings.js");
  const settings = await Settings.findOne().lean();
  if (settings && settings.allowStudentPasswordChange === false) {
    throw new Error("Password changes by students are disabled by the administrator.");
  }

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
