import "server-only";
import connectDB from "@/server/db/connect";
import EmailLog from "@/server/db/models/EmailLog";

export function getEmailConfig() {
  const driver = (process.env.EMAIL_DRIVER || "console").toLowerCase();
  const fromName = process.env.EMAIL_FROM_NAME || "RD Classes";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "";
  const dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || "400", 10);

  return {
    driver,
    fromName,
    fromAddress,
    dailyLimit,
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
  };
}

export function isEmailConfigured() {
  const config = getEmailConfig();
  if (config.driver === "console") {
    // Console driver is valid in development / test
    return process.env.NODE_ENV !== "production";
  }
  if (config.driver === "smtp") {
    return !!(config.smtpHost && config.fromAddress);
  }
  if (config.driver === "resend") {
    return !!(config.resendApiKey && config.fromAddress);
  }
  return false;
}

/**
 * Returns the Date object representing 00:00:00.000 today in Asia/Kolkata timezone (UTC+5:30).
 */
export function getStartOfTodayIST() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);
  const istYear = istTime.getUTCFullYear();
  const istMonth = istTime.getUTCMonth();
  const istDate = istTime.getUTCDate();
  // Midnight IST converted back to UTC
  return new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0) - istOffsetMs);
}

/**
 * Counts successful emails sent today (Asia/Kolkata day).
 */
export async function getTodaySentEmailCount() {
  await connectDB();
  const startOfToday = getStartOfTodayIST();
  return EmailLog.countDocuments({
    status: "sent",
    sentAt: { $gte: startOfToday },
  });
}

/**
 * Checks remaining daily quota and throws or returns status.
 */
export async function checkDailyQuota() {
  const config = getEmailConfig();
  const sentToday = await getTodaySentEmailCount();
  const remaining = Math.max(0, config.dailyLimit - sentToday);
  const canSend = remaining > 0;

  return {
    dailyLimit: config.dailyLimit,
    sentToday,
    remaining,
    canSend,
  };
}
