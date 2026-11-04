import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb.ts";
import {
  User,
  Device,
  DeviceRequest,
  Session,
  Enrollment,
  Course,
  ActivityLog,
  LectureProgress,
  Notification,
  Book,
  Chapter,
  Lecture,
  Note,
  Test,
  ResultPdf,
  Topper,
  GalleryItem,
  Announcement,
  Enquiry,
  Setting,
  Counter,
} from "../../lib/models/index.ts";
import EmailLog from "../db/models/EmailLog.js";
import { formatDeviceLabel } from "../../lib/utils/deviceLabel.js";
import {
  sendStudentCredentialsEmail,
  sendEmailDirect,
  renderCredentialsEmail,
  getSmtpConfig,
} from "../email/mailer.js";

/**
 * Normalizes batch strings (e.g. ",4--5", "4 - 5" -> "4-5", Excel date serial 46117 -> "4-5", 46148 -> "5-6").
 */
export function normalizeBatch(val) {
  if (val === undefined || val === null || val === "") return "";

  // If val is a Date object (e.g. from XLSX parser with cellDates: true)
  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${val.getMonth() + 1}-${val.getDate()}`;
  }

  const rawStr = String(val).trim();
  if (!rawStr) return "";

  // Handle Excel date serials (e.g. 46117 -> 4-5, 46148 -> 5-6)
  if (/^\d{4,6}$/.test(rawStr)) {
    const num = Number(rawStr);
    if (num >= 30000 && num <= 70000) {
      try {
        if (XLSX.SSF?.parse_date_code) {
          const parsed = XLSX.SSF.parse_date_code(num);
          if (parsed && parsed.m && parsed.d) {
            return `${parsed.m}-${parsed.d}`;
          }
        }
      } catch {
        // Fall back to date math
      }
      try {
        const utcDate = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(utcDate.getTime())) {
          return `${utcDate.getUTCMonth() + 1}-${utcDate.getUTCDate()}`;
        }
      } catch {
        // Fall through
      }
    }
  }

  let s = rawStr;
  // Strip leading/trailing punctuation (like commas, extra dashes)
  s = s.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").trim();
  // Standardize multiple dashes, en-dashes, or spaces between numbers
  s = s.replace(/(\d+)\s*[-–—]+\s*(\d+)/g, "$1-$2");
  s = s.replace(/(\d+)\s+to\s+(\d+)/gi, "$1-$2");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Normalizes phone numbers by stripping +91, spaces, dashes, leading 0.
 */
export function normalizePhone(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Validates 10-digit Indian mobile number starting with 6, 7, 8, or 9.
 */
export function isValidIndianMobile(digits) {
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Converts name to Title Case without changing letter spelling.
 */
export function toTitleCase(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|\/|-|\.)\S/g, (match) => match.toUpperCase())
    .replace(/\s+/g, " ");
}

/**
 * Detects common typos in email domains (gmail.co, gamil.com, etc.).
 */
export function detectEmailTypo(rawEmail) {
  if (!rawEmail) return null;
  const email = String(rawEmail).trim().toLowerCase();
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return null;

  const localPart = email.slice(0, atIndex);
  let domain = email.slice(atIndex + 1).replace(/\.+$/, ""); // strip trailing dots

  const typoMap = {
    "gmail.co": "gmail.com",
    "gamil.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "gmai.com": "gmail.com",
    "hotmial.com": "hotmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
  };

  if (domain === "gmail.co" || domain.startsWith("gmail.co.")) {
    return `${localPart}@gmail.com`;
  }
  if (typoMap[domain]) {
    return `${localPart}@${typoMap[domain]}`;
  }

  return null;
}

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
 * Generates N consecutive login IDs atomically using Counter model.
 */
export async function getNextLoginIds(count = 1) {
  await connectDB();
  const year = new Date().getFullYear();
  const prefix = `RD-${year}-`;
  const counterId = `studentLoginId_${year}`;

  const existingCounter = await Counter.findById(counterId);
  if (!existingCounter) {
    const highestStudent = await User.findOne({
      loginId: new RegExp(`^${prefix}\\d+$`),
    })
      .sort({ loginId: -1 })
      .collation({ locale: "en", numericOrdering: true })
      .lean();

    let initialSeq = 0;
    if (highestStudent?.loginId) {
      const parts = highestStudent.loginId.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) initialSeq = num;
    }

    await Counter.findOneAndUpdate(
      { _id: counterId },
      { $setOnInsert: { seq: initialSeq } },
      { upsert: true, returnDocument: "after" }
    );
  }

  const updatedCounter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: count } },
    { upsert: true, returnDocument: "after" }
  );

  const endSeq = updatedCounter.seq;
  const startSeq = endSeq - count + 1;

  const ids = [];
  for (let s = startSeq; s <= endSeq; s++) {
    ids.push(`${prefix}${String(s).padStart(3, "0")}`);
  }
  return ids;
}

/**
 * Generates the next sequential student loginId (e.g., RD-2026-001).
 */
export async function getNextLoginId() {
  const ids = await getNextLoginIds(1);
  return ids[0];
}

/**
 * Normalizes header keys regardless of case or minor spelling variations.
 */
function normalizeHeaderKey(header) {
  const clean = String(header || "").trim().toLowerCase();
  if (/^(s\.?\s*no\.?|sr\.?\s*no\.?|serial(\s*number)?)$/.test(clean)) return "serial";
  if (/^(name|student(\s*name)?|full\s*name)$/.test(clean)) return "name";
  if (/^(email(\s*id)?|email\s*address|mail)$/.test(clean)) return "email";
  if (/^(phone(\s*number)?|mobile(\s*number)?|contact(\s*number)?)$/.test(clean)) return "phone";
  if (/^(batch(\s*timing|\s*slot)?|slot|timing|class\s*time)$/.test(clean)) return "batch";
  if (/^(course|course\s*name)$/.test(clean)) return "course";
  return clean;
}

/**
 * Parses and validates an uploaded Excel or CSV file.
 * Returns row-level validation results with typo suggestions and duplicate checks.
 */
export async function parseAndValidateImport(fileBuffer) {
  await connectDB();

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  // Pre-fetch existing students to detect DB duplicates
  const existingStudents = await User.find(
    { role: "student" },
    { name: 1, email: 1, phone: 1 }
  ).lean();

  const dbEmails = new Set(
    existingStudents
      .map((s) => s.email?.toLowerCase().trim())
      .filter(Boolean)
  );
  const dbPhones = new Set(
    existingStudents
      .map((s) => normalizePhone(s.phone))
      .filter((p) => p.length === 10)
  );
  const dbNamePhones = new Set(
    existingStudents
      .map((s) => `${toTitleCase(s.name)}__${normalizePhone(s.phone)}`)
      .filter((np) => np.length > 12)
  );

  const seenFilePhones = new Map(); // phone -> rowNumber
  const seenFileEmails = new Map(); // email -> rowNumber
  const seenFileNamePhones = new Set();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const results = [];
  let validCount = 0;
  let warningCount = 0;
  let needsFixCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNumber = i + 2;

    let serial = "";
    let name = "";
    let email = "";
    let phone = "";
    let batch = "";
    let course = "";

    for (const [key, val] of Object.entries(raw)) {
      const normalized = normalizeHeaderKey(key);
      const strVal = String(val !== undefined && val !== null ? val : "").trim();
      if (normalized === "serial") serial = strVal;
      else if (normalized === "name") name = strVal;
      else if (normalized === "email") email = strVal;
      else if (normalized === "phone") phone = strVal;
      else if (normalized === "batch") batch = strVal;
      else if (normalized === "course") course = strVal;
    }

    const cleanedName = toTitleCase(name);
    const cleanedPhone = normalizePhone(phone);
    const cleanedEmail = email ? email.toLowerCase().trim() : "";
    const cleanedBatch = normalizeBatch(batch);
    const parsedSerial = parseInt(serial, 10) || i + 1;

    const errors = [];
    const warnings = [];
    let hasTypoSuggestion = false;
    let suggestedEmail = null;

    // 1. Validate Name
    if (!cleanedName) {
      errors.push("Missing student name");
    }

    // 2. Validate Phone
    if (!cleanedPhone) {
      errors.push("Missing phone number");
    } else if (!isValidIndianMobile(cleanedPhone)) {
      errors.push("Phone must be a valid 10-digit Indian mobile (starts with 6-9)");
    }

    // 3. Exact Name + Phone Duplicate is an ERROR
    const namePhoneKey = `${cleanedName}__${cleanedPhone}`;
    if (cleanedName && cleanedPhone && isValidIndianMobile(cleanedPhone)) {
      if (seenFileNamePhones.has(namePhoneKey) || dbNamePhones.has(namePhoneKey)) {
        errors.push("Duplicate student: name and phone already registered");
      } else {
        seenFileNamePhones.add(namePhoneKey);
      }

      // Shared phone is a WARNING only
      if (seenFilePhones.has(cleanedPhone)) {
        warnings.push(`Shared phone with row ${seenFilePhones.get(cleanedPhone)} (siblings/parents)`);
      } else if (dbPhones.has(cleanedPhone)) {
        warnings.push("Phone already registered for another student (shared contact)");
      } else {
        seenFilePhones.set(cleanedPhone, rowNumber);
      }
    }

    // 4. Validate Email
    if (cleanedEmail) {
      const typoFix = detectEmailTypo(cleanedEmail);
      const isFormatValid =
        !cleanedEmail.endsWith(".") &&
        /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanedEmail);

      if (typoFix) {
        hasTypoSuggestion = true;
        suggestedEmail = typoFix;
        errors.push(`Invalid email domain typo. Suggested: ${typoFix}`);
      } else if (!isFormatValid) {
        errors.push("Invalid email format");
      } else {
        // Shared email is a WARNING only
        if (seenFileEmails.has(cleanedEmail)) {
          warnings.push(`Shared email with row ${seenFileEmails.get(cleanedEmail)} (siblings/parents)`);
        } else if (dbEmails.has(cleanedEmail)) {
          warnings.push("Email already registered for another student (shared contact)");
        } else {
          seenFileEmails.set(cleanedEmail, rowNumber);
        }
      }
    }

    let status = "ok";
    const isValid = errors.length === 0;

    if (!isValid) {
      if (hasTypoSuggestion) {
        status = "needs_fix";
        needsFixCount++;
      } else {
        status = "error";
        errorCount++;
      }
    } else if (warnings.length > 0) {
      status = "warning";
      warningCount++;
      validCount++;
    } else {
      status = "ok";
      validCount++;
    }

    results.push({
      rowNumber,
      serial: parsedSerial,
      name: cleanedName,
      rawName: name,
      email: cleanedEmail,
      rawEmail: email,
      suggestedEmail,
      hasTypoSuggestion,
      phone: cleanedPhone,
      rawPhone: phone,
      batch: cleanedBatch,
      rawBatch: batch,
      course,
      valid: isValid,
      status,
      errors,
      warnings,
    });
  }

  return {
    rows: results,
    totalCount: rawRows.length,
    validCount,
    warningCount,
    needsFixCount,
    errorCount,
  };
}

/**
 * Confirms and executes bulk student import in 10-row chunks.
 * Created students are immediately emailed (1s throttle), passwords returned ONCE to browser.
 */
export async function executeImportChunk({
  rows,
  courseId = null,
  sendEmail = true,
  adminId,
  testTransporter = null,
}) {
  await connectDB();

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No rows provided for import chunk.");
  }

  const rowsToCreate = [];
  const skipped = [];

  for (const row of rows) {
    const cleanName = toTitleCase(row.name);
    const cleanPhone = normalizePhone(row.phone);
    const existing = await User.findOne({
      name: cleanName,
      phone: cleanPhone,
      role: "student",
    }).lean();

    if (existing) {
      skipped.push({
        rowNumber: row.rowNumber,
        name: cleanName,
        phone: cleanPhone,
        reason: "Already registered in database",
      });
    } else {
      rowsToCreate.push({
        ...row,
        name: cleanName,
        phone: cleanPhone,
        batch: normalizeBatch(row.batch),
      });
    }
  }

  const results = [];
  let emailInterrupted = false;
  let interruptedReason = null;

  if (rowsToCreate.length > 0) {
    const loginIds = await getNextLoginIds(rowsToCreate.length);

    for (let i = 0; i < rowsToCreate.length; i++) {
      const row = rowsToCreate[i];
      const loginId = loginIds[i];
      const plainPassword = generatePassword();
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const cleanEmail = row.email ? row.email.toLowerCase().trim() : undefined;

      const user = await User.create({
        name: row.name,
        email: cleanEmail || undefined,
        phone: row.phone,
        batch: row.batch || undefined,
        importSerial: row.serial || undefined,
        loginId,
        passwordHash,
        role: "student",
        status: "active",
        maxDevices: 1,
        emailStatus: cleanEmail ? "not_sent" : "no_email",
      });

      if (courseId) {
        try {
          await Enrollment.create({
            studentId: user._id,
            userId: user._id,
            courseId,
            status: "active",
          });
        } catch (err) {
          console.error("Course enrollment error:", err);
        }
      }

      results.push({
        id: user._id.toString(),
        name: user.name,
        loginId,
        password: plainPassword,
        phone: user.phone || "",
        email: user.email || "",
        batch: user.batch || "",
        emailStatus: user.emailStatus,
        emailError: null,
      });
    }

    if (sendEmail) {
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        if (!item.email || emailInterrupted) continue;

        const emailOutcome = await sendStudentCredentialsEmail({
          student: {
            _id: item.id,
            name: item.name,
            loginId: item.loginId,
            email: item.email,
          },
          plainPassword: item.password,
          customTransporter: testTransporter,
        });

        item.emailStatus = emailOutcome.success ? "sent" : "failed";
        item.emailError = emailOutcome.success ? null : emailOutcome.errorCode;

        // If Gmail auth fails (535) or hits rate limit, stop sending immediately
        if (
          !emailOutcome.success &&
          (emailOutcome.errorCode === "535_AUTH" || emailOutcome.errorCode === "RATE_LIMIT")
        ) {
          emailInterrupted = true;
          interruptedReason = emailOutcome.errorCode;
          console.warn(`[IMPORT CHUNK] Email sending interrupted: ${emailOutcome.errorCode}`);
          break;
        }

        // Throttle 1 second between email sends
        if (i < results.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    try {
      await ActivityLog.create({
        actorId: adminId,
        action: "students.bulk_import_chunk",
        entity: "User",
        entityId: null,
        meta: {
          createdCount: results.length,
          skippedCount: skipped.length,
          emailInterrupted,
          interruptedReason,
        },
        createdAt: new Date(),
      });
    } catch {}
  }

  return {
    success: true,
    results,
    skipped,
    emailInterrupted,
    interruptedReason,
  };
}

/**
 * Creates a single student with auto-generated credentials and optional credentials email.
 */
export async function createStudent({
  name,
  email,
  phone,
  batch,
  loginId: customLoginId,
  courseIds = [],
  sendEmail = true,
  adminId,
  testTransporter = null,
}) {
  await connectDB();

  const cleanName = toTitleCase(name);
  if (!cleanName) throw new Error("Student name is required.");

  let cleanPhone = undefined;
  if (phone && String(phone).trim().length > 0) {
    cleanPhone = normalizePhone(phone);
    if (!isValidIndianMobile(cleanPhone)) {
      throw new Error("Phone number must be an Indian mobile (10 digits starting with 6-9).");
    }
    const existingStudent = await User.findOne({ name: cleanName, phone: cleanPhone, role: "student" });
    if (existingStudent) {
      throw new Error("A student with the same name and phone number already exists.");
    }
  }

  const cleanEmail = email && String(email).trim().length > 0 ? String(email).toLowerCase().trim() : undefined;
  if (cleanEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Invalid email address format.");
    }
  }

  const normalizedBatch = normalizeBatch(batch);

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
  const initialEmailStatus = cleanEmail ? (sendEmail ? "not_sent" : "not_sent") : "no_email";

  let student;
  try {
    student = await User.create({
      name: cleanName,
      email: cleanEmail || undefined,
      phone: cleanPhone,
      batch: normalizedBatch || undefined,
      loginId,
      passwordHash,
      role: "student",
      status: "active",
      maxDevices: 1,
      emailStatus: initialEmailStatus,
    });
  } catch (err) {
    if (err && (err.code === 11000 || String(err.message).includes("E11000") || String(err.message).includes("duplicate key"))) {
      throw new Error(`Login ID "${loginId}" is already taken.`);
    }
    throw err;
  }

  if (Array.isArray(courseIds) && courseIds.length > 0) {
    const enrollments = courseIds.map((cId) => ({
      studentId: student._id,
      userId: student._id,
      courseId: cId,
      status: "active",
    }));
    await Enrollment.insertMany(enrollments, { ordered: false }).catch(() => {});
  }

  if (cleanEmail && sendEmail) {
    await sendStudentCredentialsEmail({
      student,
      plainPassword,
      customTransporter: testTransporter,
    });
    const refreshed = await User.findById(student._id).select("emailStatus emailError emailSentAt").lean();
    if (refreshed) {
      student.emailStatus = refreshed.emailStatus;
      student.emailError = refreshed.emailError;
      student.emailSentAt = refreshed.emailSentAt;
    }
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
        emailStatus: student.emailStatus,
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
    phone: student.phone || "",
    email: student.email || "",
    batch: student.batch || "",
    emailStatus: student.emailStatus,
    emailError: student.emailError || null,
  };
}

/**
 * Resets student password and emails the new credentials.
 * Revokes all active sessions. Returns new credentials ONCE.
 */
export async function resetAndEmailCredentials({
  studentId,
  adminId,
  testTransporter = null,
}) {
  await connectDB();

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  const newPassword = generatePassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  student.passwordHash = passwordHash;
  await student.save();

  await Session.updateMany({ userId: student._id }, { $set: { revoked: true } });
  await Session.deleteMany({ userId: student._id });

  if (student.email && String(student.email).trim()) {
    await sendStudentCredentialsEmail({
      student,
      plainPassword: newPassword,
      customTransporter: testTransporter,
    });
    const refreshed = await User.findById(student._id).select("emailStatus emailError emailSentAt").lean();
    if (refreshed) {
      student.emailStatus = refreshed.emailStatus;
      student.emailError = refreshed.emailError;
      student.emailSentAt = refreshed.emailSentAt;
    }
  } else {
    student.emailStatus = "no_email";
    student.emailError = null;
    await student.save();
  }

  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "student.credentials_reset_and_emailed",
      entity: "User",
      entityId: student._id,
      meta: {
        loginId: student.loginId,
        emailStatus: student.emailStatus,
        emailError: student.emailError,
      },
      createdAt: new Date(),
    });
  } catch {}

  return {
    id: student._id.toString(),
    name: student.name,
    loginId: student.loginId,
    password: newPassword,
    phone: student.phone || "",
    email: student.email || "",
    emailStatus: student.emailStatus,
    emailError: student.emailError || null,
  };
}

/**
 * Bulk reset and email credentials in chunks of up to 5 students with 1s throttle.
 */
export async function bulkResetAndEmailCredentials({
  studentIds,
  adminId,
  testTransporter = null,
}) {
  await connectDB();

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("No student IDs provided.");
  }

  const results = [];
  for (let i = 0; i < studentIds.length; i++) {
    const sId = studentIds[i];
    try {
      const res = await resetAndEmailCredentials({
        studentId: sId,
        adminId,
        testTransporter,
      });
      results.push({ success: true, student: res });
    } catch (err) {
      results.push({ success: false, studentId: sId, error: err.message });
    }

    if (i < studentIds.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { success: true, results };
}

/**
 * Resets student password without email (legacy helper).
 */
export async function resetStudentPassword(studentId, adminId) {
  return resetAndEmailCredentials({ studentId, adminId });
}

/**
 * Permanently deletes a single student and dependents.
 */
export async function deleteStudent(studentId, adminId) {
  await connectDB();

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new Error("Student not found.");
  }

  await Promise.all([
    User.deleteOne({ _id: studentId, role: "student" }),
    Enrollment.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
    Device.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
    Session.deleteMany({ userId: studentId }),
    LectureProgress.deleteMany({ $or: [{ studentId }, { userId: studentId }] }),
    Notification.deleteMany({ $or: [{ recipientRole: "student" }, { studentId }] }),
    EmailLog.deleteMany({ studentId }),
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
 * Danger Zone Step 1: Read-only dry run calculating exact counts of toDelete vs toStay.
 */
export async function dryRunDeleteAllStudents() {
  await connectDB();

  const studentCount = await User.countDocuments({ role: "student" });
  const studentDocs = await User.find({ role: "student" }).select("_id").lean();
  const studentIds = studentDocs.map((s) => s._id);

  const [
    deviceCount,
    sessionCount,
    progressCount,
    enrollmentCount,
    notificationCount,
    emailLogCount,
  ] = await Promise.all([
    Device.countDocuments({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    Session.countDocuments({ userId: { $in: studentIds } }),
    LectureProgress.countDocuments({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    Enrollment.countDocuments({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    Notification.countDocuments({ $or: [{ recipientRole: "student" }, { studentId: { $in: studentIds } }] }),
    EmailLog.countDocuments({ studentId: { $in: studentIds } }),
  ]);

  const [
    adminCount,
    courseCount,
    bookCount,
    chapterCount,
    lectureCount,
    noteCount,
    testCount,
    resultCount,
    topperCount,
    galleryCount,
    announcementCount,
    enquiryCount,
    settingCount,
  ] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    Course.countDocuments(),
    Book.countDocuments(),
    Chapter.countDocuments(),
    Lecture.countDocuments(),
    Note.countDocuments(),
    Test.countDocuments(),
    ResultPdf.countDocuments(),
    Topper.countDocuments(),
    GalleryItem.countDocuments(),
    Announcement.countDocuments(),
    Enquiry.countDocuments(),
    Setting.countDocuments(),
  ]);

  return {
    toDelete: {
      students: studentCount,
      devices: deviceCount,
      sessions: sessionCount,
      lectureProgress: progressCount,
      enrollments: enrollmentCount,
      studentNotifications: notificationCount,
      emailLogs: emailLogCount,
    },
    toStay: {
      adminAccounts: adminCount,
      courses: courseCount,
      books: bookCount,
      chapters: chapterCount,
      lectures: lectureCount,
      notes: noteCount,
      tests: testCount,
      results: resultCount,
      toppers: topperCount,
      gallery: galleryCount,
      announcements: announcementCount,
      enquiries: enquiryCount,
      settings: settingCount,
    },
  };
}

/**
 * Danger Zone Step 2: Copies affected documents to archive collections and prepares sanitized JSON.
 */
export async function backupStudentsAndDependents() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not ready.");
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const mins = pad(now.getMinutes());
  const timestamp = `${year}${month}${day}_${hours}${mins}`;

  const studentDocs = await User.find({ role: "student" }).lean();
  if (studentDocs.length === 0) {
    throw new Error("No students found to backup.");
  }
  const studentIds = studentDocs.map((s) => s._id);

  const archiveName = `students_archive_${timestamp}`;
  await db.collection(archiveName).insertMany(studentDocs);
  const verifyCount = await db.collection(archiveName).countDocuments();
  if (verifyCount !== studentDocs.length) {
    throw new Error(`Backup count mismatch: expected ${studentDocs.length}, got ${verifyCount}`);
  }

  const devices = await Device.find({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }).lean();
  if (devices.length > 0) {
    await db.collection(`devices_archive_${timestamp}`).insertMany(devices);
  }

  const sessions = await Session.find({ userId: { $in: studentIds } }).lean();
  if (sessions.length > 0) {
    await db.collection(`sessions_archive_${timestamp}`).insertMany(sessions);
  }

  const enrollments = await Enrollment.find({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }).lean();
  if (enrollments.length > 0) {
    await db.collection(`enrollments_archive_${timestamp}`).insertMany(enrollments);
  }

  const progress = await LectureProgress.find({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }).lean();
  if (progress.length > 0) {
    await db.collection(`progress_archive_${timestamp}`).insertMany(progress);
  }

  // Sanitized students for JSON download (NEVER exposing password hashes)
  const sanitizedStudents = studentDocs.map((s) => {
    const { passwordHash, ...rest } = s;
    return rest;
  });

  return {
    success: true,
    timestamp,
    archiveCollection: archiveName,
    studentCount: studentDocs.length,
    sanitizedStudents,
  };
}

/**
 * Danger Zone Step 3: Verifies confirmation phrase and admin password, then wipes role=student and restarts counter.
 */
export async function executeDeleteAllStudents({
  adminId,
  confirmationText,
  adminPassword,
}) {
  await connectDB();

  if (confirmationText !== "DELETE ALL STUDENTS") {
    throw new Error("Confirmation text does not match 'DELETE ALL STUDENTS'.");
  }

  const admin = await User.findById(adminId);
  if (!admin || admin.role !== "admin") {
    throw new Error("Unauthorized: Only an admin can perform this operation.");
  }

  const isPasswordValid = await bcrypt.compare(adminPassword, admin.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Incorrect admin password.");
  }

  const studentDocs = await User.find({ role: "student" }).select("_id").lean();
  if (studentDocs.length === 0) {
    throw new Error("No students found to delete.");
  }
  const studentIds = studentDocs.map((s) => s._id);

  // Delete dependents first
  await Promise.all([
    Device.deleteMany({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    Session.deleteMany({ userId: { $in: studentIds } }),
    Enrollment.deleteMany({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    LectureProgress.deleteMany({ $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }] }),
    Notification.deleteMany({ $or: [{ recipientRole: "student" }, { studentId: { $in: studentIds } }] }),
    EmailLog.deleteMany({ studentId: { $in: studentIds } }),
  ]);

  // Strictly delete role === "student"
  const deleteResult = await User.deleteMany({ role: "student" });

  // Reset counter sequence so next student is RD-2026-001
  const year = new Date().getFullYear();
  await Counter.findOneAndUpdate(
    { _id: `studentLoginId_${year}` },
    { $set: { seq: 0 } },
    { upsert: true }
  );
  await Counter.findOneAndUpdate(
    { _id: "studentLoginId" },
    { $set: { seq: 0 } },
    { upsert: true }
  );

  // Audit log entry (no personal data)
  try {
    await ActivityLog.create({
      actorId: adminId,
      action: "danger_zone.delete_all_students",
      entity: "User",
      entityId: null,
      meta: {
        deletedStudentsCount: deleteResult.deletedCount,
        year,
      },
      createdAt: new Date(),
    });
  } catch {}

  // Verify admin account remains intact
  const verifyAdmin = await User.findById(adminId);
  if (!verifyAdmin || verifyAdmin.role !== "admin") {
    throw new Error("Fatal: Admin account integrity check failed!");
  }

  return {
    success: true,
    deletedCount: deleteResult.deletedCount,
    nextLoginId: `RD-${year}-001`,
  };
}

/**
 * Queries students with search, status, batch, deviceFilter, courseId, and pagination.
 */
export async function getStudentsListPaginated({
  search = "",
  status = "",
  batch = "",
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

  if (batch && batch.trim()) {
    query.batch = batch.trim();
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
      { batch: { $regex: s, $options: "i" } },
    ];
    if (query.$and) {
      query.$and.push({ $or: searchFilter });
    } else {
      query.$or = searchFilter;
    }
  }

  const skip = (page - 1) * limit;

  const [students, total, distinctBatches] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
    User.find({
      role: "student",
      batch: { $exists: true, $ne: null, $ne: "" },
    }).distinct("batch"),
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

  // Devices and Requests map
  const [devices, requests] = await Promise.all([
    Device.find({
      $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
    }).lean(),
    DeviceRequest.find({
      $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
    }).lean(),
  ]);

  const devicesMap = {};
  for (const d of devices) {
    const sId = (d.studentId || d.userId).toString();
    if (!devicesMap[sId]) devicesMap[sId] = [];
    devicesMap[sId].push(d);
  }

  const requestsMap = {};
  for (const r of requests) {
    const sId = (r.studentId || r.userId).toString();
    if (!requestsMap[sId]) requestsMap[sId] = [];
    requestsMap[sId].push(r);
  }

  const enrichedStudents = students.map((student) => {
    const sId = student._id.toString();
    const studentDevices = devicesMap[sId] || [];
    const studentReqs = requestsMap[sId] || [];
    const approvedDevices = studentDevices.filter((d) => d.status === "approved");
    const pendingDevices = [
      ...studentDevices.filter((d) => d.status === "pending"),
      ...studentReqs.filter((r) => r.status === "pending"),
    ];

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
            label:
              firstDev.deviceLabel ||
              firstDev.label ||
              `${firstDev.osFamily || firstDev.os || "Device"} · ${
                firstDev.browserName || firstDev.browser || "Browser"
              }`,
            os: firstDev.osFamily || firstDev.os || "",
            browser: firstDev.browserName || firstDev.browser || "",
            model: firstDev.model || "",
            ip: firstDev.lastIp || firstDev.ip || firstDev.firstIp || "",
            city: firstDev.city || "",
            country: firstDev.country || "",
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
    batches: distinctBatches.filter(Boolean).sort(),
  };
}
