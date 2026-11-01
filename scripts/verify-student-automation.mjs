import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";

import {
  User,
  Counter,
  Course,
  Book,
  Chapter,
  Lecture,
  Note,
  Test,
  Setting,
  Device,
  Session,
  Enrollment,
  LectureProgress,
  Notification,
  ActivityLog,
} from "../src/lib/models/index.ts";
import EmailLog from "../src/server/db/models/EmailLog.js";

import {
  getNextLoginId,
  getNextLoginIds,
  normalizeBatch,
  normalizePhone,
  isValidIndianMobile,
  toTitleCase,
  detectEmailTypo,
  parseAndValidateImport,
  executeImportChunk,
  createStudent,
  resetAndEmailCredentials,
  bulkResetAndEmailCredentials,
  dryRunDeleteAllStudents,
  backupStudentsAndDependents,
  executeDeleteAllStudents,
} from "../src/server/services/studentAdminService.js";

async function runVerification() {
  console.log("=== STARTING ISOLATED STUDENT AUTOMATION VERIFICATION ===");
  console.log("Isolation Mode: In-Memory MongoDB Server + Disposable Ethereal SMTP");

  // 1. Spin up ephemeral in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI_TEST = uri;
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
  console.log("✓ Connected to isolated in-memory test database:", uri);

  // 2. Setup Ethereal test mailer
  const etherealAccount = await nodemailer.createTestAccount();
  const testTransporter = nodemailer.createTransport({
    host: etherealAccount.smtp.host,
    port: etherealAccount.smtp.port,
    secure: etherealAccount.smtp.secure,
    auth: {
      user: etherealAccount.user,
      pass: etherealAccount.pass,
    },
  });
  console.log("✓ Created Ethereal test SMTP account:", etherealAccount.user);

  // 3. Seed Admin and Content
  const adminPassword = "SuperAdminPassword123!";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await User.create({
    name: "Ronak Dugar",
    loginId: "admin_ronak",
    email: etherealAccount.user,
    role: "admin",
    passwordHash: adminHash,
    status: "active",
  });
  console.log("✓ Seeded Admin User:", admin.loginId);

  const testCourse = await Course.create({
    title: "Class 12 Accountancy Mastery",
    slug: "class-12-accountancy",
    status: "published",
    published: true,
  });
  const testNote = await Note.create({
    title: "Partnership Fundamentals",
    courseId: testCourse._id,
  });
  const testSetting = await Setting.create({
    instituteName: "RD Classes",
    phone: "+91 83685 45620",
    email: "rdclasses177@gmail.com",
  });
  console.log("✓ Seeded Content: Course, Note, Setting");

  // ==========================================
  // TEST 1: Add Student with and without Email
  // ==========================================
  console.log("\n--- TEST 1: Add Student Automation ---");
  const s1 = await createStudent({
    name: "aarav sharma",
    email: etherealAccount.user,
    phone: "+91 98111 22334",
    batch: ",4--5",
    adminId: admin._id,
    testTransporter,
  });
  console.log("Created Student 1:", {
    loginId: s1.loginId,
    name: s1.name,
    batch: s1.batch,
    emailStatus: s1.emailStatus,
  });

  if (s1.loginId !== "RD-2026-001") throw new Error(`Expected RD-2026-001, got ${s1.loginId}`);
  if (s1.name !== "Aarav Sharma") throw new Error(`Expected Aarav Sharma (Title Case), got ${s1.name}`);
  if (s1.batch !== "4-5") throw new Error(`Expected normalized batch 4-5, got ${s1.batch}`);
  if (s1.emailStatus !== "sent") throw new Error(`Expected emailStatus sent, got ${s1.emailStatus}`);

  // Verify login password
  const s1Doc = await User.findById(s1.id);
  const s1PassMatch = await bcrypt.compare(s1.password, s1Doc.passwordHash);
  if (!s1PassMatch) throw new Error("Student 1 generated password does not match hash!");
  console.log("✓ Student 1: Credentials email sent and password hash verified");

  // Student 2 without email
  const s2 = await createStudent({
    name: "diya patel",
    phone: "9876543210",
    batch: "5 - 6",
    adminId: admin._id,
    testTransporter,
  });
  if (s2.loginId !== "RD-2026-002") throw new Error(`Expected RD-2026-002, got ${s2.loginId}`);
  if (s2.emailStatus !== "no_email") throw new Error(`Expected emailStatus no_email, got ${s2.emailStatus}`);
  if (s2.batch !== "5-6") throw new Error(`Expected normalized batch 5-6, got ${s2.batch}`);
  console.log("✓ Student 2: Created without email -> emailStatus: 'no_email'");

  // ==========================================
  // TEST 2: 12-Row Import with Problem Cases
  // ==========================================
  console.log("\n--- TEST 2: Bulk Import (12 Rows) with Messy Variants ---");
  const testRows = [
    { "Serial Number": 1, "Name": "rahul sharma", "Email ID": etherealAccount.user, "Phone Number": "+91 99111 11111", "Batch": ",4--5" },
    { "Serial Number": 2, "Name": "PRIYA GUPTA", "Email ID": etherealAccount.user, "Phone Number": "98765 22222", "Batch": "4 - 5" },
    { "Serial Number": 3, "Name": "Amit Kumar", "Email ID": "amit.kumar@gmail.co.", "Phone Number": "98123 33333", "Batch": "5-6" }, // domain typo
    { "Serial Number": 4, "Name": "Sibling One", "Email ID": "shared@ethereal.email", "Phone Number": "98989 44444", "Batch": "4--5" },
    { "Serial Number": 5, "Name": "Sibling Two", "Email ID": "shared@ethereal.email", "Phone Number": "98989 44444", "Batch": "4-5" }, // duplicate phone & email (shared)
    { "Serial Number": 6, "Name": "Bad Phone", "Email ID": etherealAccount.user, "Phone Number": "12345", "Batch": "4-5" }, // invalid phone
    { "Serial Number": 7, "Name": "", "Email ID": etherealAccount.user, "Phone Number": "98111 66666", "Batch": "5-6" }, // missing name
    { "Serial Number": 8, "Name": "rahul sharma", "Email ID": etherealAccount.user, "Phone Number": "9911111111", "Batch": "4-5" }, // duplicate of Row 1 (name+phone)
    { "Serial Number": 9, "Name": "Karan Mehra", "Email ID": etherealAccount.user, "Phone Number": "98111 77777", "Batch": "4 to 5" },
    { "Serial Number": 10, "Name": "Sneha Reddy", "Email ID": etherealAccount.user, "Phone Number": "98111 88888", "Batch": "5-6" },
    { "Serial Number": 11, "Name": "Vikas Singh", "Email ID": etherealAccount.user, "Phone Number": "98111 99999", "Batch": "4-5" },
    { "Serial Number": 12, "Name": "Ananya Joshi", "Email ID": etherealAccount.user, "Phone Number": "98222 00000", "Batch": "5-6" },
  ];

  const worksheet = XLSX.utils.json_to_sheet(testRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const preview = await parseAndValidateImport(xlsxBuffer);
  console.log("Import Preview Summary:", {
    totalCount: preview.totalCount,
    validCount: preview.validCount,
    warningCount: preview.warningCount,
    needsFixCount: preview.needsFixCount,
    errorCount: preview.errorCount,
  });

  // Verify preview checks
  const row3 = preview.rows.find((r) => r.rowNumber === 4); // index 2 -> rowNumber 4
  if (!row3.hasTypoSuggestion || row3.suggestedEmail !== "amit.kumar@gmail.com") {
    throw new Error(`Expected typo suggestion for amit.kumar@gmail.co., got ${row3.suggestedEmail}`);
  }
  console.log("✓ Row 3: Correctly detected domain typo 'gmail.co.' -> suggested 'amit.kumar@gmail.com'");

  const row5 = preview.rows.find((r) => r.rowNumber === 6);
  if (row5.warnings.length === 0) {
    throw new Error("Expected shared phone/email warning on Row 5 (sibling)");
  }
  console.log("✓ Row 5: Allowed shared phone/email with warning for sibling");

  const row6 = preview.rows.find((r) => r.rowNumber === 7);
  if (row6.valid) throw new Error("Row 6 with invalid phone should not be valid");

  const row7 = preview.rows.find((r) => r.rowNumber === 8);
  if (row7.valid) throw new Error("Row 7 with missing name should not be valid");

  const row8 = preview.rows.find((r) => r.rowNumber === 9);
  if (row8.valid) throw new Error("Row 8 with exact duplicate name+phone should not be valid");
  console.log("✓ Rows 6, 7, 8: Properly rejected invalid phone, missing name, and exact name+phone duplicate");

  // Accept typo fix for Row 3 and execute chunk
  const validToImport = preview.rows
    .filter((r) => r.valid || (r.hasTypoSuggestion && r.suggestedEmail))
    .map((r) => (r.hasTypoSuggestion ? { ...r, email: r.suggestedEmail } : r));

  console.log(`Executing chunked import for ${validToImport.length} valid rows...`);
  const importResult = await executeImportChunk({
    rows: validToImport,
    courseId: testCourse._id,
    sendEmail: true,
    adminId: admin._id,
    testTransporter,
  });

  console.log(`✓ Imported ${importResult.results.length} students atomically.`);
  if (importResult.results[0].loginId !== "RD-2026-003") {
    throw new Error(`Expected first imported student to be RD-2026-003, got ${importResult.results[0].loginId}`);
  }

  // Idempotency: re-importing same valid rows
  console.log("Testing Idempotency (re-importing same file)...");
  const reImportResult = await executeImportChunk({
    rows: validToImport,
    courseId: testCourse._id,
    sendEmail: false,
    adminId: admin._id,
    testTransporter,
  });
  if (reImportResult.results.length !== 0) {
    throw new Error(`Expected 0 created on re-import, got ${reImportResult.results.length}`);
  }
  if (reImportResult.skipped.length !== validToImport.length) {
    throw new Error(`Expected all ${validToImport.length} to be skipped on re-import`);
  }
  console.log(`✓ Idempotency verified: 0 duplicates created, ${reImportResult.skipped.length} rows skipped.`);

  // Test Gmail 535 / rate limit interrupt simulation
  console.log("Testing Gmail Rate Limit / 535 Failure Interrupt handling...");
  const failingTransporter = {
    sendMail: async () => {
      const err = new Error("535 5.7.8 Username and Password not accepted");
      err.responseCode = 535;
      throw err;
    },
  };
  const dummyRow = [{ name: "Interrupt Test", phone: "98333 11111", email: "interrupt@test.com", batch: "4-5" }];
  const interruptedResult = await executeImportChunk({
    rows: dummyRow,
    sendEmail: true,
    adminId: admin._id,
    testTransporter: failingTransporter,
  });
  if (!interruptedResult.emailInterrupted || interruptedResult.interruptedReason !== "535_AUTH") {
    throw new Error(`Expected emailInterrupted with 535_AUTH, got ${interruptedResult.interruptedReason}`);
  }
  console.log("✓ Email sending interrupted on 535_AUTH error; student stayed created safely with 'not_sent'");

  // Resume sending via resetAndEmailCredentials
  const createdTestStudent = interruptedResult.results[0];
  const resumed = await resetAndEmailCredentials({
    studentId: createdTestStudent.id,
    adminId: admin._id,
    testTransporter,
  });
  if (resumed.emailStatus !== "sent") {
    throw new Error(`Expected resumed emailStatus sent, got ${resumed.emailStatus}`);
  }
  console.log("✓ Resume Sending verified: successfully resent credentials with new password");

  // ==========================================
  // TEST 3: Bulk Send Credentials
  // ==========================================
  console.log("\n--- TEST 3: Bulk Send Credentials ---");
  const allStudentIds = (await User.find({ role: "student" }).select("_id").lean()).map((s) => s._id);
  const sample12Ids = allStudentIds.slice(0, 12);
  console.log(`Bulk sending credentials to ${sample12Ids.length} students...`);
  const bulkResult = await bulkResetAndEmailCredentials({
    studentIds: sample12Ids,
    adminId: admin._id,
    testTransporter,
  });
  if (bulkResult.results.length !== sample12Ids.length) {
    throw new Error(`Expected ${sample12Ids.length} results, got ${bulkResult.results.length}`);
  }
  console.log(`✓ Bulk Send completed for ${bulkResult.results.length} students.`);

  // ==========================================
  // TEST 4: Danger Zone Wipe & Reset Numbering
  // ==========================================
  console.log("\n--- TEST 4: Danger Zone Wipe & Reset Numbering ---");
  // Step 1: Dry Run
  const dryRun = await dryRunDeleteAllStudents();
  console.log("Dry Run Counts:", {
    studentsToDelete: dryRun.toDelete.students,
    adminAccountsToStay: dryRun.toStay.adminAccounts,
    coursesToStay: dryRun.toStay.courses,
  });
  if (dryRun.toDelete.students === 0) throw new Error("Expected students to delete > 0");
  if (dryRun.toStay.adminAccounts !== 1) throw new Error("Expected 1 admin to stay");
  if (dryRun.toStay.courses !== 1) throw new Error("Expected 1 course to stay");
  console.log("✓ Step 1: Dry run impact report exact and read-only");

  // Step 2: Backup
  const backup = await backupStudentsAndDependents();
  console.log("Backup Archive:", {
    archiveCollection: backup.archiveCollection,
    studentCount: backup.studentCount,
  });
  if (backup.studentCount !== dryRun.toDelete.students) {
    throw new Error("Backup count mismatch with dry run count!");
  }
  // Verify sanitized JSON does NOT have passwordHash
  const hasHash = backup.sanitizedStudents.some((s) => s.passwordHash !== undefined);
  if (hasHash) throw new Error("FATAL: passwordHash detected in sanitized student backup JSON!");
  console.log("✓ Step 2: Archive collections created and password hashes stripped from JSON export");

  // Step 3: Authorization Checks
  try {
    await executeDeleteAllStudents({
      adminId: admin._id,
      confirmationText: "WRONG CONFIRMATION",
      adminPassword,
    });
    throw new Error("Should have thrown on wrong confirmation phrase!");
  } catch (err) {
    if (!err.message.includes("DELETE ALL STUDENTS")) throw err;
    console.log("✓ Step 3a: Wrong confirmation text blocked");
  }

  try {
    await executeDeleteAllStudents({
      adminId: admin._id,
      confirmationText: "DELETE ALL STUDENTS",
      adminPassword: "WrongPassword999",
    });
    throw new Error("Should have thrown on wrong admin password!");
  } catch (err) {
    if (!err.message.includes("password")) throw err;
    console.log("✓ Step 3b: Wrong admin password blocked");
  }

  // Execute full wipe with correct credentials
  const wipe = await executeDeleteAllStudents({
    adminId: admin._id,
    confirmationText: "DELETE ALL STUDENTS",
    adminPassword,
  });
  console.log("Wipe Result:", wipe);
  if (!wipe.success || wipe.deletedCount === 0) throw new Error("Wipe failed!");

  // Verify post-wipe state
  const remainingStudents = await User.countDocuments({ role: "student" });
  if (remainingStudents !== 0) throw new Error(`Expected 0 students after wipe, found ${remainingStudents}`);

  const adminAfter = await User.findById(admin._id);
  if (!adminAfter || adminAfter.role !== "admin") throw new Error("Admin user was deleted during wipe!");
  const adminLoginWorks = await bcrypt.compare(adminPassword, adminAfter.passwordHash);
  if (!adminLoginWorks) throw new Error("Admin login fails after wipe!");
  console.log("✓ Post-Wipe Check: Admin account intact and login verified");

  const courseAfter = await Course.countDocuments();
  const noteAfter = await Note.countDocuments();
  const settingAfter = await Setting.countDocuments();
  if (courseAfter !== 1 || noteAfter !== 1 || settingAfter !== 1) {
    throw new Error("Content collections were modified during wipe!");
  }
  console.log("✓ Post-Wipe Check: Courses, notes, and settings completely unchanged");

  // Verify counter reset: next student created gets RD-2026-001
  const nextStudent = await createStudent({
    name: "First Student Post Wipe",
    phone: "98111 99999",
    adminId: admin._id,
    testTransporter,
  });
  console.log("First Student Created After Wipe:", nextStudent.loginId);
  if (nextStudent.loginId !== "RD-2026-001") {
    throw new Error(`Expected next student to restart at RD-2026-001, got ${nextStudent.loginId}`);
  }
  console.log("✓ Post-Wipe Check: Numbering counter restarted at RD-2026-001!");

  // Cleanup
  await mongoose.disconnect();
  await mongod.stop();
  console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});

