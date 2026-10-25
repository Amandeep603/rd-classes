"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import {
  studentCreateSchema,
  studentUpdateSchema,
  adminResetPasswordSchema,
} from "../validation/schemas.js";
import {
  createStudent,
  updateStudentProfile,
  blockStudent,
  unblockStudent,
  adminResetPassword,
} from "../services/studentService.js";

export async function createStudentAction(prevState, formData) {
  const admin = await requireAdmin();

  const courseIdsRaw = formData.getAll("courseIds");
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    loginId: formData.get("loginId"),
    password: formData.get("password"),
    deviceLimit: formData.get("deviceLimit") || 1,
    mustChangePassword: formData.get("mustChangePassword") === "on",
    courseIds: courseIdsRaw.filter(Boolean),
  };

  const parsed = studentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    const result = await createStudent(parsed.data, admin.user._id);
    revalidatePath("/admin/students");
    revalidatePath("/admin");
    return {
      success: true,
      createdStudent: result.student,
      rawPassword: result.rawPassword,
      whatsappMessage: result.whatsappMessage,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createStudentWizardAction(payload) {
  const admin = await requireAdmin();

  if (!payload?.name || typeof payload.name !== "string" || !payload.name.trim()) {
    return { success: false, error: "Student name is required." };
  }
  if (!payload?.password || typeof payload.password !== "string" || payload.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    const result = await createStudent(
      {
        name: payload.name.trim(),
        phone: payload.phone || "",
        email: payload.email || "",
        className: payload.className || "12",
        school: payload.school || "",
        loginId: payload.loginId,
        password: payload.password,
        deviceLimit: Number(payload.deviceLimit) || 1,
        mustChangePassword: !!payload.mustChangePassword,
        courseAssignments: Array.isArray(payload.courseAssignments)
          ? payload.courseAssignments
          : [],
      },
      admin.user._id
    );

    revalidatePath("/admin/students");
    revalidatePath("/admin");
    return {
      success: true,
      ...result,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function updateStudentProfileAction(studentId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
  };

  const parsed = studentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input.",
    };
  }

  try {
    await updateStudentProfile(studentId, parsed.data, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function blockStudentAction(studentId) {
  const admin = await requireAdmin();
  try {
    await blockStudent(studentId, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function unblockStudentAction(studentId) {
  const admin = await requireAdmin();
  try {
    await unblockStudent(studentId, admin.user._id);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function resetStudentPasswordAction(studentId, prevState, formData) {
  const admin = await requireAdmin();

  const raw = {
    newPassword: formData.get("newPassword"),
    revokeSessions: formData.get("revokeSessions") === "on",
  };

  const parsed = adminResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid password.",
    };
  }

  try {
    await adminResetPassword(
      studentId,
      parsed.data.newPassword,
      parsed.data.revokeSessions,
      admin.user._id
    );
    revalidatePath(`/admin/students/${studentId}`);
    return { success: true, newPassword: parsed.data.newPassword };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function enrollStudentAction(userId, courseId, expiresAt = null) {
  const admin = await requireAdmin();
  const { enrollStudentInCourse } = await import("../services/enrollmentService.js");
  try {
    await enrollStudentInCourse({
      userId,
      courseId,
      expiresAt,
      assignedBy: admin.user._id,
    });
    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function revokeEnrollmentAction(enrollmentId, userId) {
  const admin = await requireAdmin();
  const { revokeEnrollment } = await import("../services/enrollmentService.js");
  try {
    await revokeEnrollment(enrollmentId, admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sends credentials email to a student using their plaintext password from the creation response.
 * Never stores or logs the password.
 */
export async function sendCredentialsEmailAction(studentId, { password }) {
  const admin = await requireAdmin();
  if (!password || typeof password !== "string") {
    return { success: false, error: "Password is required to send credentials." };
  }

  const { User } = await import("../db/models/User.js");
  const { Enrollment } = await import("../db/models/Enrollment.js");
  const { Course } = await import("../db/models/Course.js");
  const { renderCredentialsTemplate } = await import("../email/templates/credentials.js");
  const { sendEmail } = await import("../email/emailService.js");
  const { logAuditEvent } = await import("../services/audit.js");

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    return { success: false, error: "Student not found." };
  }
  if (!student.email) {
    return { success: false, error: "Student has no email address configured." };
  }

  try {
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
      password,
      loginUrl: `${siteUrl}/student/login`,
      courses: coursesWithDates,
    });

    const result = await sendEmail({
      to: student.email,
      subject,
      html,
      text,
      kind: "credentials",
      studentId: student._id,
      createdBy: admin.user._id,
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "student.credentials_emailed",
      targetType: "student",
      targetId: student._id.toString(),
      meta: {
        toEmail: student.email,
        success: result.success,
      },
    });

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Resets a student's password, emails the new password, and shows it ONCE to the admin.
 */
export async function resetStudentPasswordAndEmailAction(studentId, revokeSessions = true) {
  const admin = await requireAdmin();
  const { resetStudentPasswordAndEmail } = await import("../services/studentService.js");

  try {
    const result = await resetStudentPasswordAndEmail(
      studentId,
      revokeSessions,
      admin.user._id
    );
    revalidatePath(`/admin/students/${studentId}`);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Checks email configuration status and daily limits.
 */
export async function checkEmailConfigAction() {
  await requireAdmin();
  const { isEmailConfigured, checkDailyQuota, getEmailConfig } = await import(
    "../email/emailConfig.js"
  );
  const configured = isEmailConfigured();
  const config = getEmailConfig();
  const quota = await checkDailyQuota();

  return {
    isConfigured: configured,
    driver: config.driver,
    dailyLimit: quota.dailyLimit,
    sentToday: quota.sentToday,
    remaining: quota.remaining,
  };
}

/**
 * Sends a test email to the specified recipient.
 */
export async function sendTestEmailAction(toEmail) {
  const admin = await requireAdmin();
  const { isEmailConfigured, getEmailConfig } = await import("../email/emailConfig.js");
  const { sendEmail } = await import("../email/emailService.js");
  const { renderTestTemplate } = await import("../email/templates/deviceApproved.js");
  const { logAuditEvent } = await import("../services/audit.js");

  if (!isEmailConfigured()) {
    return { success: false, error: "Email is not configured." };
  }

  const target = (toEmail || "").trim();
  if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return { success: false, error: "Valid email address is required." };
  }

  const config = getEmailConfig();
  const { subject, html, text } = renderTestTemplate({
    toEmail: target,
    driverName: config.driver,
  });

  try {
    const result = await sendEmail({
      to: target,
      subject,
      html,
      text,
      kind: "test",
      createdBy: admin.user._id,
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "email.test_sent",
      targetType: "system",
      targetId: "email",
      meta: { toEmail: target, driver: config.driver, success: result.success },
    });

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Bulk imports students from parsed CSV rows.
 */
export async function importStudentsFromCSVAction({ rows }) {
  const admin = await requireAdmin();
  const { importStudentsFromCSV } = await import("../services/studentService.js");

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "No rows provided for import." };
  }

  if (rows.length > 500) {
    return { success: false, error: "Maximum 500 rows allowed per import." };
  }

  try {
    const result = await importStudentsFromCSV({ rows, adminId: admin.user._id });
    revalidatePath("/admin/students");
    revalidatePath("/admin");
    return result;
  } catch (err) {
    return { success: false, error: err.message || "Bulk import failed." };
  }
}

/**
 * Sends credentials email to a chunk of up to 10 newly imported students.
 * Plaintext passwords are provided from client memory (returned once from import).
 */
export async function sendBulkImportCredentialsChunkAction({ items, batchId }) {
  const admin = await requireAdmin();
  const { isEmailConfigured, checkDailyQuota } = await import("../email/emailConfig.js");
  const { sendEmail } = await import("../email/emailService.js");
  const { renderCredentialsTemplate } = await import("../email/templates/credentials.js");
  const { Enrollment } = await import("../db/models/Enrollment.js");

  if (!isEmailConfigured()) {
    return { success: false, error: "Email delivery is not configured on this server." };
  }

  const quota = await checkDailyQuota();
  if (quota.remaining <= 0) {
    return {
      success: false,
      error: `Daily email quota of ${quota.dailyLimit} has been reached for today.`,
      quotaExhausted: true,
    };
  }

  const chunk = (items || []).slice(0, 10);
  const results = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

  for (const item of chunk) {
    if (!item.email || !item.email.trim()) {
      results.push({
        studentId: item.studentId,
        name: item.name,
        email: "",
        status: "skipped",
        reason: "no_email",
      });
      continue;
    }

    try {
      const enrollments = await Enrollment.find({
        userId: item.studentId,
        status: "active",
      })
        .populate("courseId", "title")
        .lean();

      const coursesWithDates = enrollments.map((e) => ({
        title: e.courseId?.title || "Enrolled Course",
        expiresAt: e.expiresAt,
      }));

      const { subject, html, text } = renderCredentialsTemplate({
        studentName: item.name,
        loginId: item.loginId,
        password: item.password,
        loginUrl: `${siteUrl}/student/login`,
        courses: coursesWithDates,
      });

      const emailRes = await sendEmail({
        to: item.email,
        subject,
        html,
        text,
        kind: "credentials",
        studentId: item.studentId,
        createdBy: admin.user._id,
        batchId: batchId || null,
      });

      results.push({
        studentId: item.studentId,
        name: item.name,
        email: item.email,
        status: emailRes.success ? "sent" : "failed",
        error: emailRes.error || null,
      });
    } catch (err) {
      results.push({
        studentId: item.studentId,
        name: item.name,
        email: item.email,
        status: "failed",
        error: err.message,
      });
    }
  }

  const updatedQuota = await checkDailyQuota();

  return {
    success: true,
    results,
    remainingToday: updatedQuota.remaining,
  };
}

/**
 * Resets passwords and emails new credentials to a chunk of up to 10 existing students.
 */
export async function bulkResetAndEmailCredentialsChunkAction({
  studentIds,
  revokeSessions = true,
  batchId,
}) {
  const admin = await requireAdmin();
  const { isEmailConfigured, checkDailyQuota } = await import("../email/emailConfig.js");
  const { resetStudentPasswordAndEmail } = await import("../services/studentService.js");
  const { User } = await import("../db/models/User.js");

  if (!isEmailConfigured()) {
    return { success: false, error: "Email delivery is not configured on this server." };
  }

  const quota = await checkDailyQuota();
  if (quota.remaining <= 0) {
    return {
      success: false,
      error: `Daily email quota of ${quota.dailyLimit} has been reached for today.`,
      quotaExhausted: true,
    };
  }

  const chunkIds = (studentIds || []).slice(0, 10);
  const results = [];

  for (const sId of chunkIds) {
    try {
      const student = await User.findById(sId).lean();
      if (!student) {
        results.push({ studentId: sId, status: "skipped", reason: "not_found" });
        continue;
      }

      if (!student.email) {
        results.push({
          studentId: sId,
          name: student.name,
          email: "",
          status: "skipped",
          reason: "no_email",
        });
        continue;
      }

      const res = await resetStudentPasswordAndEmail(
        sId,
        revokeSessions,
        admin.user._id,
        batchId
      );

      results.push({
        studentId: sId,
        name: student.name,
        email: student.email,
        loginId: student.loginId,
        newPassword: res.newPassword,
        status: res.emailResult?.success ? "sent" : "failed",
        error: res.emailResult?.error || null,
      });
    } catch (err) {
      results.push({
        studentId: sId,
        status: "failed",
        error: err.message,
      });
    }
  }

  const updatedQuota = await checkDailyQuota();

  return {
    success: true,
    results,
    remainingToday: updatedQuota.remaining,
  };
}

