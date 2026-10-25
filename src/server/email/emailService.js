import "server-only";
import connectDB from "@/server/db/connect";
import EmailLog from "@/server/db/models/EmailLog";
import { getEmailConfig, isEmailConfigured, checkDailyQuota } from "./emailConfig";
import { sendWithConsole } from "./drivers/consoleDriver";
import { sendWithSmtp } from "./drivers/smtpDriver";
import { sendWithResend } from "./drivers/resendDriver";

/**
 * Dispatches an email, enforces daily limits, records EmailLog, never exposes plaintext passwords.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  kind = "test",
  studentId = null,
  createdBy = null,
  batchId = null,
}) {
  await connectDB();

  const config = getEmailConfig();

  // Validate configured
  if (!isEmailConfigured()) {
    throw new Error("Email service is not configured.");
  }

  // Check daily limit (Asia/Kolkata day)
  const quota = await checkDailyQuota();
  if (!quota.canSend) {
    throw new Error(
      `Daily email limit reached (${quota.sentToday}/${quota.dailyLimit} sent today). Please try again tomorrow or contact administrator.`
    );
  }

  // Create EmailLog in queued state
  const log = await EmailLog.create({
    kind,
    toEmail: to.toLowerCase().trim(),
    studentId,
    status: "queued",
    batchId,
    createdBy,
    attempts: 1,
  });

  try {
    let result;
    if (config.driver === "console") {
      result = await sendWithConsole({ to, subject, html, text });
    } else if (config.driver === "smtp") {
      result = await sendWithSmtp({
        to,
        subject,
        html,
        text,
        fromName: config.fromName,
        fromAddress: config.fromAddress,
      });
    } else if (config.driver === "resend") {
      result = await sendWithResend({
        to,
        subject,
        html,
        text,
        fromName: config.fromName,
        fromAddress: config.fromAddress,
      });
    } else {
      throw new Error(`Unsupported email driver: "${config.driver}"`);
    }

    log.status = "sent";
    log.sentAt = new Date();
    await log.save();

    return {
      success: true,
      logId: log._id.toString(),
      messageId: result?.messageId,
    };
  } catch (err) {
    // Sanitize error: never persist passwords or auth credentials
    const rawError = err?.message || "Unknown error";
    const sanitizedError = rawError
      .replace(/password[:=]\s*[^\s]+/gi, "password:***")
      .replace(/auth[^\s]+/gi, "auth:***")
      .substring(0, 450);

    log.status = "failed";
    log.error = sanitizedError;
    await log.save();

    return {
      success: false,
      logId: log._id.toString(),
      error: sanitizedError,
    };
  }
}
