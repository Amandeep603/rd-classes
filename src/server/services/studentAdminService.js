import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import connectDB from "../../lib/mongodb.ts";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { Session } from "../../lib/models/Session.ts";
import { Enrollment } from "../../lib/models/Enrollment.ts";
import { Course } from "../../lib/models/Course.ts";
import { ActivityLog } from "../../lib/models/ActivityLog.ts";
import { LectureProgress } from "../../lib/models/LectureProgress.ts";

/**
 * Generates a 10-character strong password without confusing glyphs (0, O, 1, l, I).
 */
export function generatePassword() {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  let pwd = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

/**
 * Generates the next sequential student loginId (e.g., RD-2026-001).
 */
export async function getNextLoginId() {
  await connectDB();
  const year = new Date().getFullYear();
  const prefix = `RD-${year}-`;

  const highestStudent = await User.findOne({
    loginId: new RegExp(`^${prefix}\\d+$`),
  })
    .sort({ loginId: -1 })
    .collation({ locale: "en", numericOrdering: true })
    .lean();

  let nextSeq = 1;
  if (highestStudent?.loginId) {
    const parts = highestStudent.loginId.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      nextSeq = num + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

/**
 * Generates N consecutive login IDs for batch import.
 */
export async function getNextLoginIds(count = 1) {
  await connectDB();
  const year = new Date().getFullYear();
  const prefix = `RD-${year}-`;

  const highestStudent = await User.findOne({
    loginId: new RegExp(`^${prefix}\\d+$`),
  })
    .sort({ loginId: -1 })
    .collation({ locale: "en", numericOrdering: true })
    .lean();

  let startSeq = 1;
  if (highestStudent?.loginId) {
    const parts = highestStudent.loginId.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      startSeq = num + 1;
    }
  }

  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(`${prefix}${String(startSeq + i).padStart(3, "0")}`);
  }
  return ids;
}

/**
 * Normalizes and extracts header keys regardless of case or minor spelling variations.
 */
function normalizeHeaderKey(header) {
  const clean = String(header || "").trim().toLowerCase();
  if (/^(name|full\s*name|student\s*name|student)$/.test(clean)) return "name";
  if (/^(email|email\s*address|mail)$/.test(clean)) return "email";
  if (/^(phone|phone\s*number|mobile|mobile\s*number|contact)$/.test(clean)) return "phone";
  return clean;
}

/**
 * Parses and validates an uploaded Excel or CSV file.
 * Returns row-level validation results.
 */
export async function parseAndValidateImport(fileBuffer) {
  await connectDB();

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  // Pre-fetch all existing students' phones and emails to detect DB duplicates
  const existingStudents = await User.find(
    { role: "student" },
    { email: 1, phone: 1 }
  ).lean();

  const dbEmails = new Set(
    existingStudents
      .map((s) => s.email?.toLowerCase().trim())
      .filter(Boolean)
  );
  const dbPhones = new Set(
    existingStudents
      .map((s) => String(s.phone || "").replace(/\D/g, "").slice(-10))
      .filter((p) => p.length === 10)
  );

  const seenFileEmails = new Set();
  const seenFilePhones = new Set();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const results = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNumber = i + 2; // Accounting for 1-based index and header row

    // Map headers
    let name = "";
    let email = "";
    let phone = "";

    for (const [key, val] of Object.entries(raw)) {
      const normalized = normalizeHeaderKey(key);
      const strVal = String(val !== undefined && val !== null ? val : "").trim();
      if (normalized === "name") name = strVal;
      else if (normalized === "email") email = strVal;
      else if (normalized === "phone") phone = strVal;
    }

    const errors = [];

    // 1. Validate Name
    if (!name) {
      errors.push("Missing student name");
    }

    // 2. Validate Phone
    const cleanPhone = phone.replace(/\D/g, "");
    let standardPhone = cleanPhone;
    if (cleanPhone.length > 10 && cleanPhone.startsWith("91")) {
      standardPhone = cleanPhone.slice(2);
    }

    if (!phone) {
      errors.push("Missing phone number");
    } else if (standardPhone.length !== 10) {
      errors.push("Phone must be exactly 10 digits");
    } else {
      if (seenFilePhones.has(standardPhone)) {
        errors.push("Duplicate phone number in file");
      } else if (dbPhones.has(standardPhone)) {
        errors.push("Phone already registered in database");
      }
    }

    // 3. Validate Email (optional or required)
    const normalizedEmail = email.toLowerCase().trim();
    if (email) {
      if (!emailRegex.test(email)) {
        errors.push("Invalid email format");
      } else {
        if (seenFileEmails.has(normalizedEmail)) {
          errors.push("Duplicate email in file");
        } else if (dbEmails.has(normalizedEmail)) {
          errors.push("Email already registered in database");
        }
      }
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validCount++;
      if (standardPhone) seenFilePhones.add(standardPhone);
      if (normalizedEmail) seenFileEmails.add(normalizedEmail);
    } else {
      invalidCount++;
    }

    results.push({
      rowNumber,
      name,
      email: normalizedEmail,
      phone: standardPhone || phone,
      valid: isValid,
      errors,
    });
  }

  return {
    rows: results,
    totalCount: rawRows.length,
    validCount,
    invalidCount,
  };
}

/**
 * Confirms and executes bulk student import.
 * Returns plain-text credentials ONCE.
 */
export async function executeImport({ validRows, courseId = null, adminId }) {
  await connectDB();

  if (!validRows || validRows.length === 0) {
    throw new Error("No valid rows provided for import.");
  }

  const count = validRows.length;
  const loginIds = await getNextLoginIds(count);
  const credentials = [];
  const createdUserIds = [];

  for (let i = 0; i < count; i++) {
    const row = validRows[i];
    const loginId = loginIds[i];
    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      name: row.name.trim(),
      email: row.email ? row.email.toLowerCase().trim() : undefined,
      phone: row.phone.trim(),
      loginId,
      passwordHash,
      role: "student",
      status: "active",
      maxDevices: 1,
    });

    createdUserIds.push(user._id);

    // Optional enrollment
    if (courseId) {
      try {
        await Enrollment.create({
          studentId: user._id,
          userId: user._id,
          courseId,
          status: "active",
        });
      } catch (err) {
        console.error(`Enrollment failed for student ${user._id}:`, err);
      }
    }

    credentials.push({
      id: user._id.toString(),
      name: user.name,
      loginId,
      password: plainPassword,
      phone: user.phone || "",
      email: user.email || "",
    });
  }

  // Log in ActivityLog
  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "students.bulk_import",
      entity: "User",
      entityId: null,
      meta: {
        importedCount: count,
        courseId: courseId || null,
      },
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to write ActivityLog for bulk import:", err);
  }

  return credentials;
}

/**
 * Creates a single student with auto-generated credentials.
 * Returns the plain-text credentials ONCE.
 */
export async function createStudent({
  name,
  email,
  phone,
  loginId: customLoginId,
  courseIds = [],
  adminId,
}) {
  await connectDB();

  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Student name is required.");

  let cleanPhone = undefined;
  if (phone && String(phone).trim().length > 0) {
    const digits = String(phone).replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.");
    }
    const existingPhone = await User.findOne({ phone: digits, role: "student" });
    if (existingPhone) {
      throw new Error("Phone number is already registered for another student.");
    }
    cleanPhone = digits;
  }

  const cleanEmail = email && String(email).trim().length > 0 ? String(email).toLowerCase().trim() : undefined;
  if (cleanEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Invalid email address.");
    }
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      throw new Error("Email address is already in use.");
    }
  }

  let loginId = customLoginId?.trim();
  if (!loginId) {
    loginId = await getNextLoginId();
  } else {
    const existingId = await User.findOne({ loginId });
    if (existingId) {
      throw new Error(`Login ID "${loginId}" is already taken.`);
    }
  }

  const plainPassword = generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const student = await User.create({
    name: cleanName,
    email: cleanEmail || undefined,
    phone: cleanPhone,
    loginId,
    passwordHash,
    role: "student",
    status: "active",
    maxDevices: 1,
  });

  if (Array.isArray(courseIds) && courseIds.length > 0) {
    const enrollments = courseIds.map((cId) => ({
      studentId: student._id,
      userId: student._id,
      courseId: cId,
      status: "active",
    }));
    await Enrollment.insertMany(enrollments, { ordered: false }).catch(() => {});
  }

  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "student.created",
      entity: "User",
      entityId: student._id,
      meta: {
        studentId: student._id.toString(),
        name: student.name,
        loginId: student.loginId,
      },
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("ActivityLog error:", e);
  }

  return {
    id: student._id.toString(),
    name: student.name,
    loginId: student.loginId,
    password: plainPassword,
    phone: student.phone,
    email: student.email || "",
  };
}

/**
 * Resets student password and revokes all active sessions.
 * Returns the new plain-text password ONCE.
 */
export async function resetStudentPassword(studentId, adminId) {
  await connectDB();

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  const newPassword = generatePassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  student.passwordHash = passwordHash;
  await student.save();

  // Terminate all sessions so the student must log in with the new password
  await Session.updateMany({ userId: student._id }, { $set: { revoked: true } });
  await Session.deleteMany({ userId: student._id });

  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "student.password_reset",
      entity: "User",
      entityId: student._id,
      meta: {
        studentId: student._id.toString(),
        loginId: student.loginId,
        name: student.name,
      },
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("ActivityLog error:", e);
  }

  return {
    name: student.name,
    loginId: student.loginId,
    password: newPassword,
    phone: student.phone || "",
    email: student.email || "",
  };
}

/**
 * Permanently deletes a student along with their enrollments, devices, sessions, and progress.
 */
export async function deleteStudent(studentId, adminId) {
  await connectDB();

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  await Promise.all([
    User.deleteOne({ _id: studentId }),
    Enrollment.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
    Device.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
    Session.deleteMany({ userId: studentId }),
    LectureProgress.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
  ]);

  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "student.deleted",
      entity: "User",
      entityId: studentId,
      meta: {
        loginId: student.loginId,
        name: student.name,
      },
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("ActivityLog error:", e);
  }

  return { success: true };
}

/**
 * Queries students with search, filters, course enrollment counts, and pagination.
 */
export async function getStudentsListPaginated({
  search = "",
  status = "",
  deviceFilter = "",
  courseId = "",
  page = 1,
  limit = 20,
} = {}) {
  await connectDB();

  const query = { role: "student" };

  if (status && (status === "active" || status === "blocked")) {
    query.status = status;
  }

  if (courseId) {
    const enrollments = await Enrollment.find({ courseId }).select("studentId userId").lean();
    const enrolledIds = enrollments.map((e) => e.studentId || e.userId);
    query._id = { $in: enrolledIds };
  }

  if (deviceFilter) {
    if (deviceFilter === "approved") {
      const [approvedDevices, approvedUsers] = await Promise.all([
        Device.find({ status: "approved" }).distinct("studentId"),
        Device.find({ status: "approved" }).distinct("userId"),
      ]);
      const approvedIds = [...new Set([...approvedDevices, ...approvedUsers].filter(Boolean))];
      if (query._id) {
        const existing = (query._id.$in || []).map(String);
        query._id = { $in: approvedIds.filter((id) => existing.includes(String(id))) };
      } else {
        query._id = { $in: approvedIds };
      }
    } else if (deviceFilter === "pending") {
      const [pendingDevices, pendingUsers] = await Promise.all([
        Device.find({ status: "pending" }).distinct("studentId"),
        Device.find({ status: "pending" }).distinct("userId"),
      ]);
      const pendingIds = [...new Set([...pendingDevices, ...pendingUsers].filter(Boolean))];
      if (query._id) {
        const existing = (query._id.$in || []).map(String);
        query._id = { $in: pendingIds.filter((id) => existing.includes(String(id))) };
      } else {
        query._id = { $in: pendingIds };
      }
    } else if (deviceFilter === "no-device") {
      const [anyDevices, anyUsers] = await Promise.all([
        Device.find({ status: { $in: ["approved", "pending"] } }).distinct("studentId"),
        Device.find({ status: { $in: ["approved", "pending"] } }).distinct("userId"),
      ]);
      const anyIds = [...new Set([...anyDevices, ...anyUsers].filter(Boolean))];
      if (query._id) {
        const existing = (query._id.$in || []).map(String);
        query._id = { $in: existing.filter((id) => !anyIds.map(String).includes(String(id))) };
      } else {
        query._id = { $nin: anyIds };
      }
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    const searchFilter = [
      { name: { $regex: s, $options: "i" } },
      { loginId: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
    if (query.$and) {
      query.$and.push({ $or: searchFilter });
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

  const studentIds = students.map((s) => s._id);

  // Enrollments map
  const enrollments = await Enrollment.find({
    $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
  })
    .populate("courseId", "title slug")
    .lean();

  const enrollmentsMap = {};
  for (const e of enrollments) {
    const sId = (e.studentId || e.userId).toString();
    if (!enrollmentsMap[sId]) enrollmentsMap[sId] = [];
    if (e.courseId) enrollmentsMap[sId].push(e.courseId);
  }

  // Devices map
  const devices = await Device.find({
    $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
  }).lean();

  const devicesMap = {};
  for (const d of devices) {
    const sId = (d.studentId || d.userId).toString();
    if (!devicesMap[sId]) devicesMap[sId] = [];
    devicesMap[sId].push(d);
  }

  const enrichedStudents = students.map((student) => {
    const sId = student._id.toString();
    const studentDevices = devicesMap[sId] || [];
    const approvedDevices = studentDevices.filter((d) => d.status === "approved");
    const pendingDevices = studentDevices.filter((d) => d.status === "pending");

    let deviceStatus = "no-device";
    if (pendingDevices.length > 0) deviceStatus = "pending";
    else if (approvedDevices.length > 0) deviceStatus = "approved";

    const sortedApproved = [...approvedDevices].sort(
      (a, b) =>
        new Date(a.firstLoginAt || a.approvedAt || a.createdAt).getTime() -
        new Date(b.firstLoginAt || b.approvedAt || b.createdAt).getTime()
    );
    const firstDev = sortedApproved[0] || null;

    return {
      ...student,
      enrolledCourses: enrollmentsMap[sId] || [],
      devices: studentDevices,
      deviceStatus,
      approvedDeviceCount: approvedDevices.length,
      pendingDeviceCount: pendingDevices.length,
      firstDevice: firstDev
        ? {
            type: firstDev.deviceType || "desktop",
            label: firstDev.deviceLabel || firstDev.label || "Device",
            os: firstDev.os || "",
            browser: firstDev.browser || "",
          }
        : null,
      lastLoginIp: student.lastLoginIp || (firstDev?.lastIp || firstDev?.ip || null),
    };
  });

  return {
    students: enrichedStudents,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
