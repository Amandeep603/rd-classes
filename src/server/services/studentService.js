import "server-only";
import crypto from "crypto";
import connectDB from "../db/connect.js";
import { User } from "../db/models/User.js";
import { Device } from "../db/models/Device.js";
import { Session } from "../db/models/Session.js";
import { Enrollment } from "../db/models/Enrollment.js";
import { AuditLog } from "../db/models/AuditLog.js";
import { hashPassword, comparePassword } from "../auth/password.js";
import { encryptPassword } from "../auth/credentialEncryption.js";
import { logAuditEvent } from "./audit.js";
import { toISTEndOfDay } from "../utils/timezone.js";

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
  emailFilter = "",
  noEmail = false,
  page = 1,
  limit = 20,
} = {}) {
  await connectDB();
  const { EmailLog } = await import("../db/models/EmailLog.js");
  const query = { role: "student" };

  if (status && (status === "active" || status === "blocked")) {
    query.status = status;
  }

  const effectiveEmailFilter = emailFilter || (noEmail ? "no-email" : "");

  if (effectiveEmailFilter === "no-email") {
    query.$or = [{ email: { $exists: false } }, { email: "" }, { email: null }];
  } else if (effectiveEmailFilter === "emailed") {
    const sentStudentIds = await EmailLog.distinct("studentId", {
      kind: "credentials",
      status: "sent",
    });
    query._id = { $in: sentStudentIds };
  } else if (effectiveEmailFilter === "failed") {
    const failedStudentIds = await EmailLog.distinct("studentId", {
      kind: "credentials",
      status: "failed",
    });
    const sentStudentIds = await EmailLog.distinct("studentId", {
      kind: "credentials",
      status: "sent",
    });
    const sentSet = new Set(sentStudentIds.map((id) => id.toString()));
    const onlyFailed = failedStudentIds.filter((id) => !sentSet.has(id.toString()));
    query._id = { $in: onlyFailed };
  } else if (effectiveEmailFilter === "not-emailed") {
    const anyEmailLogs = await EmailLog.distinct("studentId", {
      kind: "credentials",
    });
    query.email = { $nin: ["", null], $exists: true };
    query._id = { $nin: anyEmailLogs };
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

  // Enrich with latest email credential status
  const studentIds = students.map((s) => s._id);
  const emailLogs = studentIds.length > 0
    ? await EmailLog.aggregate([
        { $match: { studentId: { $in: studentIds }, kind: "credentials" } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$studentId",
            latestStatus: { $first: "$status" },
            latestSentAt: { $first: "$sentAt" },
            latestError: { $first: "$error" },
          },
        },
      ])
    : [];

  const logMap = new Map(emailLogs.map((l) => [l._id.toString(), l]));

  const enrichedStudents = students.map((s) => {
    const log = logMap.get(s._id.toString());
    let emailStatus = "not-emailed";
    if (!s.email) {
      emailStatus = "no-email";
    } else if (log) {
      emailStatus = log.latestStatus; // "sent" | "failed" | "queued"
    }
    return {
      ...s,
      emailStatus,
      emailSentAt: log?.latestSentAt ? log.latestSentAt.toISOString() : null,
      emailError: log?.latestError || null,
    };
  });

  return {
    students: enrichedStudents,
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

  const hasEncryptedPassword = Boolean(student.passwordEnc?.ciphertext);
  delete student.passwordEnc;
  student.hasEncryptedPassword = hasEncryptedPassword;

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
  const { getNextLoginId } = await import("./studentCodeService.js");
  const { Course } = await import("../db/models/Course.js");

  const generatedLoginId = await getNextLoginId();
  const normalizedLoginId = (loginId || generatedLoginId).trim();

  const existing = await User.findOne({ loginId: normalizedLoginId });
  if (existing) {
    throw new Error(`A user with login ID "${normalizedLoginId}" already exists.`);
  }

  const passwordHash = await hashPassword(password);
  const passwordEnc = encryptPassword(password);

  const student = await User.create({
    role: "student",
    name: name.trim(),
    className: className || "12",
    school: (school || "").trim(),
    phone: phone && phone.trim() ? phone.trim() : undefined,
    email: email && email.trim() ? email.trim().toLowerCase() : undefined,
    loginId: normalizedLoginId,
    passwordHash,
    passwordEnc,
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
      loginId: student.loginId,
      name: student.name,
      deviceLimit: student.deviceLimit,
      enrollmentCount: assignments.length,
    },
  });

  return {
    student: {
      _id: student._id.toString(),
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
  student.passwordEnc = encryptPassword(newPassword);
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
  adminId = null,
  batchId = null
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
  student.passwordEnc = encryptPassword(newPassword);
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
    batchId: batchId || null,
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
      batchId: batchId || null,
    },
  });

  return {
    success: true,
    newPassword,
    emailResult: sendResult,
  };
}

/**
 * Imports multiple students from parsed CSV rows.
 * Validates each row, generates student code and credentials if omitted,
 * creates users and enrollments, and returns created and skipped rows.
 * Plaintext passwords are ONLY returned in this response payload for one-time display.
 */
export async function importStudentsFromCSV({ rows = [], adminId }) {
  await connectDB();
  const { Course } = await import("../db/models/Course.js");
  const { getNextLoginId } = await import("./studentCodeService.js");

  const availableCourses = await Course.find({ published: true })
    .select("_id title slug")
    .lean();

  const courseMap = new Map();
  availableCourses.forEach((c) => {
    courseMap.set(c.slug.toLowerCase(), c);
    courseMap.set(c._id.toString(), c);
    courseMap.set(c.title.toLowerCase().trim(), c);
  });

  const created = [];
  const skipped = [];
  const seenLoginIdsInBatch = new Set();

  // Academic year default validity: 31 March of next year
  const currentYear = new Date().getFullYear();
  const defaultValidity = new Date(currentYear + 1, 2, 31, 23, 59, 59);

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 1;
    const name = (row.name || "").toString().trim();

    if (!name) {
      skipped.push({ rowNumber: rowNum, name: "Unknown", error: "Student name is required." });
      continue;
    }

    const email = (row.email || "").toString().trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped.push({ rowNumber: rowNum, name, error: `Invalid email address "${email}".` });
      continue;
    }

    let phone = (row.phone || "").toString().replace(/[^0-9]/g, "");
    if (phone && phone.length > 15) {
      phone = phone.slice(0, 15);
    }

    const className = (row.class || row.className || "12").toString().trim();
    const school = (row.school || "").toString().trim();

    let deviceLimit = parseInt(row.deviceLimit, 10);
    if (isNaN(deviceLimit) || deviceLimit < 1) deviceLimit = 1;
    if (deviceLimit > 3) deviceLimit = 3;

    // Parse validUntil
    let expiresAt = defaultValidity;
    if (row.validUntil) {
      const parsedDate = new Date(row.validUntil);
      if (isNaN(parsedDate.getTime())) {
        skipped.push({ rowNumber: rowNum, name, error: `Invalid validity date "${row.validUntil}". Use YYYY-MM-DD.` });
        continue;
      }
      if (parsedDate < new Date()) {
        skipped.push({ rowNumber: rowNum, name, error: `Validity date "${row.validUntil}" cannot be in the past.` });
        continue;
      }
      expiresAt = toISTEndOfDay(parsedDate);
    }

    // Parse courses
    const assignedCourses = [];
    if (row.courses) {
      const tokens = row.courses
        .toString()
        .split(/[,;]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      let courseError = null;
      for (const token of tokens) {
        const found = courseMap.get(token);
        if (!found) {
          courseError = `Unknown course "${token}".`;
          break;
        }
        if (!assignedCourses.some((c) => c._id.toString() === found._id.toString())) {
          assignedCourses.push(found);
        }
      }
      if (courseError) {
        skipped.push({ rowNumber: rowNum, name, error: courseError });
        continue;
      }
    }

    // Login ID
    let rawLoginId = (row.loginId || "").toString().trim();
    let loginId = rawLoginId;

    if (!loginId) {
      loginId = await getNextLoginId();
    }

    if (seenLoginIdsInBatch.has(loginId)) {
      skipped.push({ rowNumber: rowNum, name, error: `Duplicate login ID "${loginId}" within CSV.` });
      continue;
    }

    const existingUser = await User.findOne({ loginId }).lean();
    if (existingUser) {
      skipped.push({ rowNumber: rowNum, name, error: `Login ID "${loginId}" is already registered in the system.` });
      continue;
    }

    seenLoginIdsInBatch.add(loginId);

    // Password
    let rawPassword = (row.password || "").toString().trim();
    if (!rawPassword) {
      rawPassword = generateReadablePassword();
    } else if (rawPassword.length < 6) {
      skipped.push({ rowNumber: rowNum, name, error: "Password must be at least 6 characters." });
      continue;
    }

    try {
      const passwordHash = await hashPassword(rawPassword);
      const passwordEnc = encryptPassword(rawPassword);
      const student = await User.create({
        role: "student",
        name,
        className,
        school,
        phone: phone || undefined,
        email: email || undefined,
        loginId,
        passwordHash,
        passwordEnc,
        deviceLimit,
        deviceCount: 0,
        mustChangePassword: false,
        status: "active",
        createdBy: adminId,
      });

      if (assignedCourses.length > 0) {
        const enrollments = assignedCourses.map((c) => ({
          userId: student._id,
          courseId: c._id,
          status: "active",
          startsAt: new Date(),
          expiresAt,
          assignedBy: adminId,
        }));
        await Enrollment.insertMany(enrollments);
      }

      created.push({
        studentId: student._id.toString(),
        name: student.name,
        email: student.email,
        phone: student.phone,
        loginId: student.loginId,
        rawPassword,
        className: student.className,
        courses: assignedCourses.map((c) => c.title),
        deviceLimit: student.deviceLimit,
      });
    } catch (err) {
      skipped.push({ rowNumber: rowNum, name, error: err.message || "Failed to create student." });
    }
  }

  await logAuditEvent({
    actorId: adminId,
    action: "students.bulk_imported",
    targetType: "student",
    targetId: "bulk",
    meta: {
      totalRows: rows.length,
      createdCount: created.length,
      skippedCount: skipped.length,
    },
  });

  return {
    success: true,
    created,
    skipped,
  };
}

