import "server-only";
import nodemailer from "nodemailer";
import connectDB from "../../lib/mongodb.ts";
import { User } from "../../lib/models/User.ts";
import { Setting } from "../../lib/models/Setting.ts";
import EmailLog from "../db/models/EmailLog.js";
const DEFAULT_CONTACT = {
  phoneDisplay: "+91 83685 45620",
  email: "rdclasses177@gmail.com",
  whatsappPhone: "918368545620",
};

/**
 * Loads and validates server-only SMTP configuration.
 * Strips whitespace from SMTP_PASS (Google shows app passwords in groups of 4).
 * Always sets From address to SMTP_USER as Gmail rewrites other senders.
 */
export function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  const rawPort = process.env.SMTP_PORT || "465";
  const port = parseInt(rawPort, 10) || 465;
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const emailFrom = (process.env.EMAIL_FROM || "").trim();

  // Extract display name from EMAIL_FROM (e.g. 'RD Classes <foo@bar.com>' -> 'RD Classes')
  let displayName = "RD Classes";
  const nameMatch = emailFrom.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch && nameMatch[1].trim()) {
    displayName = nameMatch[1].trim();
  } else if (emailFrom && !emailFrom.includes("@")) {
    displayName = emailFrom;
  }

  const fromAddress = user;
  const fromHeader = fromAddress ? `"${displayName}" <${fromAddress}>` : "";
  const replyTo = fromAddress;

  const isConfigured = Boolean(host && user && pass);

  return {
    host: host || "smtp.gmail.com",
    port,
    secure: port === 465,
    user,
    pass,
    displayName,
    fromAddress,
    fromHeader,
    replyTo,
    isConfigured,
  };
}

/**
 * Creates a Nodemailer transporter with 15s timeout.
 */
export function createTransporter(customConfig = null) {
  const config = customConfig || getSmtpConfig();
  if (!config.isConfigured) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production" && !config.host.includes("ethereal.email"),
    },
  });
}

/**
 * Normalizes email errors into clean codes (never exposing passwords or internal details).
 */
export function normalizeErrorCode(err) {
  if (!err) return "UNKNOWN_ERROR";
  const str = String(err.message || err.code || err).toLowerCase();

  if (str.includes("535") || str.includes("username and password not accepted") || str.includes("invalid login")) {
    return "535_AUTH";
  }
  if (
    str.includes("rate") ||
    str.includes("quota") ||
    str.includes("454") ||
    str.includes("550") ||
    str.includes("421") ||
    str.includes("limit exceeded") ||
    str.includes("too many")
  ) {
    return "RATE_LIMIT";
  }
  if (str.includes("timeout") || str.includes("etimedout") || str.includes("esocket")) {
    return "TIMEOUT";
  }
  if (
    str.includes("econnrefused") ||
    str.includes("enotfound") ||
    str.includes("ehostunreach") ||
    str.includes("network")
  ) {
    return "NETWORK_ERROR";
  }
  if (str.includes("invalid email") || str.includes("recipient") || str.includes("no recipients")) {
    return "INVALID_EMAIL";
  }
  if (str.includes("email_not_configured")) {
    return "NOT_CONFIGURED";
  }

  return "SEND_FAILED";
}

/**
 * Escapes HTML characters safely.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders the official RD Classes student credentials email.
 * Includes both responsive inline-styled HTML and clean plain-text versions.
 */
export function renderCredentialsEmail({
  studentName,
  loginId,
  password,
  siteUrl = "https://www.rd-classes.in",
  settings = null,
}) {
  const subject = "Your RD Classes student login";
  const loginUrl = `${siteUrl.replace(/\/+$/, "")}/student-login`;

  const contactPhone = settings?.phone || SITE_CONFIG.contact.phoneDisplay || "+91 83685 45620";
  const contactEmail = settings?.email || SITE_CONFIG.contact.email || "rdclasses177@gmail.com";
  const rawWhatsApp = settings?.whatsapp || settings?.whatsappNumber || SITE_CONFIG.contact.whatsappPhone || "918368545620";
  const cleanWhatsApp = String(rawWhatsApp).replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello Sir, this is ${studentName} (${loginId}). I received my student login.`
  )}`;

  // Plain Text Version
  const text = `Hello ${studentName},

Welcome to RD Classes! Here are your student portal login details:

========================================
Login ID : ${loginId}
Password : ${password}
========================================

Student Portal URL:
${loginUrl}

Three Short Steps to Get Started:
1. Open the website: ${siteUrl}
2. Click "Student Login" (or visit ${loginUrl})
3. Enter your Login ID and Password above

Important Device Rule:
Your account works on one approved device. The first device used is registered; contact RD Classes to change it.

Contact & Support:
- Phone: ${contactPhone}
- Email: ${contactEmail}
- WhatsApp: ${whatsappUrl}

Security Notice:
Do not share your login with anyone.

Note:
Check your Spam/Promotions folder if you cannot find this mail.

Best regards,
Ronak Dugar
RD Classes for Accountancy
Sector 9, Faridabad
`;

  // Mobile-Friendly Inline-Styled HTML Version
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Navy Brand Header Banner -->
          <tr>
            <td style="background-color: #0B2545; padding: 28px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FFC83A; color: #0B2545; font-weight: 900; font-size: 20px; padding: 6px 14px; border-radius: 8px; letter-spacing: 0.5px;">
                RD CLASSES
              </div>
              <p style="margin: 8px 0 0 0; color: #E2E8F0; font-size: 13px; font-weight: 500;">
                Accountancy Coaching for Class 11 &amp; 12 CBSE &bull; Sector 9, Faridabad
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0B2545;">
                Hello ${escapeHtml(studentName)},
              </h1>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Welcome to RD Classes. Your student portal account is ready. Below are your unique login credentials to access lectures, concept notes, and test materials.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #FFFDF5; border: 1px solid #FDE68A; border-left: 4px solid #FFC83A; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B45309; letter-spacing: 0.5px;">Login ID</span>
                      <div style="font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 18px; font-weight: 700; color: #0B2545; margin-top: 2px;">
                        ${escapeHtml(loginId)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B45309; letter-spacing: 0.5px;">Password</span>
                      <div style="font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 18px; font-weight: 700; color: #0B2545; background-color: #FFFFFF; border: 1px dashed #FCD34D; border-radius: 8px; padding: 8px 12px; margin-top: 4px; display: inline-block;">
                        ${escapeHtml(password)}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 3 Short Steps -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #0B2545; text-transform: uppercase; letter-spacing: 0.5px;">
                  Three Short Steps to Get Started
                </h2>
                <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
                  <li style="margin-bottom: 6px;">Open the website: <a href="${escapeHtml(siteUrl)}" target="_blank" style="color: #0B2545; font-weight: 600;">${escapeHtml(siteUrl)}</a></li>
                  <li style="margin-bottom: 6px;">Click on <strong>Student Login</strong> in the navigation header</li>
                  <li>Enter your <strong>Login ID</strong> and <strong>Password</strong> shown above</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 26px 0;">
                <a href="${escapeHtml(loginUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0B2545; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(11, 37, 69, 0.2);">
                  Sign in to Student Portal &rarr;
                </a>
              </div>

              <!-- Device Lock Rule Notice -->
              <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1E3A8A; font-size: 12.5px; line-height: 1.5;">
                  <strong>One Approved Device:</strong> Your account works on one approved device. The first device used is registered; contact RD Classes to change it.
                </p>
              </div>

              <!-- Contact & Support -->
              <div style="background-color: #F8FAFC; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; font-size: 12.5px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0B2545; margin-bottom: 4px;">Need assistance?</div>
                <div>Phone: <strong>${escapeHtml(contactPhone)}</strong> &bull; Email: <strong>${escapeHtml(contactEmail)}</strong></div>
                <div style="margin-top: 4px;">
                  <a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" style="color: #0D9488; font-weight: 700; text-decoration: underline;">
                    Connect with Ronak Sir on WhatsApp &rarr;
                  </a>
                </div>
              </div>

              <!-- Spam Folder Reminder -->
              <p style="margin: 0 0 16px 0; color: #64748B; font-size: 12px; font-style: italic;">
                Tip: Check your Spam or Promotions folder if you ever miss updates from us.
              </p>

              <!-- Security Notice -->
              <div style="padding-top: 14px; border-top: 1px solid #E2E8F0; color: #DC2626; font-size: 12px; font-weight: 700;">
                &#9888; Security Notice: Do not share your login with anyone.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 18px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #64748B; font-size: 11px;">
                &copy; ${new Date().getFullYear()} RD Classes for Accountancy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Sends a single email with one retry on transient errors.
 * Never logs passwords, bodies, or SMTP values.
 */
export async function sendEmailDirect({
  to,
  subject,
  html,
  text,
  studentId = null,
  kind = "credentials",
  customTransporter = null,
}) {
  const config = getSmtpConfig();
  if (!config.isConfigured && !customTransporter) {
    return {
      success: false,
      errorCode: "NOT_CONFIGURED",
    };
  }

  const transporter = customTransporter || createTransporter(config);
  const fromHeader = config.fromHeader || `"${config.displayName}" <${config.user || "no-reply@rd-classes.in"}>`;
  const replyTo = config.replyTo || config.user;

  const mailOptions = {
    from: fromHeader,
    to: to.toLowerCase().trim(),
    replyTo,
    subject,
    text,
    html,
  };

  let attempts = 0;
  let lastError = null;

  while (attempts < 2) {
    attempts++;
    try {
      const info = await transporter.sendMail(mailOptions);

      // Log success without sensitive data
      console.log(`[MAIL] studentId=${studentId || "none"} status=sent to=${to.slice(0, 3)}***`);

      // Record in EmailLog if available
      try {
        await connectDB();
        await EmailLog.create({
          kind,
          toEmail: to.toLowerCase().trim(),
          studentId,
          status: "sent",
          attempts,
          sentAt: new Date(),
        });
      } catch (logErr) {
        // Non-blocking log write
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err) {
      lastError = err;
      const code = normalizeErrorCode(err);

      // Only retry on transient network/timeout errors on attempt 1
      const isTransient = code === "TIMEOUT" || code === "NETWORK_ERROR";
      if (attempts === 1 && isTransient) {
        console.warn(`[MAIL] Transient failure (${code}), retrying once...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      break;
    }
  }

  const errorCode = normalizeErrorCode(lastError);
  console.error(`[MAIL] studentId=${studentId || "none"} status=failed code=${errorCode}`);

  try {
    await connectDB();
    await EmailLog.create({
      kind,
      toEmail: to.toLowerCase().trim(),
      studentId,
      status: "failed",
      error: errorCode,
      attempts,
    });
  } catch {
    // Non-blocking
  }

  return {
    success: false,
    errorCode,
  };
}

/**
 * Sends a student's credentials email, updates their emailStatus in the database,
 * and returns the outcome.
 */
export async function sendStudentCredentialsEmail({
  student,
  plainPassword,
  customTransporter = null,
}) {
  if (!student.email || !String(student.email).trim()) {
    if (student._id) {
      await connectDB();
      await User.updateOne(
        { _id: student._id },
        {
          $set: {
            emailStatus: "no_email",
            emailError: null,
          },
        }
      );
    }
    return {
      success: false,
      errorCode: "NO_EMAIL",
    };
  }

  await connectDB();
  const settings = await Setting.findOne().lean().catch(() => null);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.rd-classes.in";
  const { subject, text, html } = renderCredentialsEmail({
    studentName: student.name,
    loginId: student.loginId,
    password: plainPassword,
    siteUrl,
    settings,
  });

  const result = await sendEmailDirect({
    to: student.email,
    subject,
    html,
    text,
    studentId: student._id,
    kind: "credentials",
    customTransporter,
  });

  if (student._id) {
    if (result.success) {
      await User.updateOne(
        { _id: student._id },
        {
          $set: {
            emailStatus: "sent",
            emailSentAt: new Date(),
            emailError: null,
          },
        }
      );
    } else {
      await User.updateOne(
        { _id: student._id },
        {
          $set: {
            emailStatus: "failed",
            emailError: result.errorCode,
          },
        }
      );
    }
  }

  return result;
}

/**
 * Sends a test email to verify SMTP configuration from Admin Settings.
 */
export async function sendTestEmail({
  to,
  adminId = null,
  customTransporter = null,
}) {
  const config = getSmtpConfig();
  if (!config.isConfigured && !customTransporter) {
    return {
      success: false,
      errorCode: "NOT_CONFIGURED",
      error: "SMTP configuration is incomplete in environment variables.",
    };
  }

  const subject = "RD Classes - SMTP Test Email";
  const text = `This is a test email sent from RD Classes Admin Settings.
Your SMTP configuration (${config.host}:${config.port}) is working correctly!

Timestamp: ${new Date().toISOString()}
`;
  const html = `<div style="font-family: sans-serif; padding: 20px; background-color: #F8FAFC; color: #0F172A;">
    <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #E2E8F0;">
      <h2 style="color: #0B2545; margin-top: 0;">SMTP Test Successful &#10004;</h2>
      <p style="color: #475569; font-size: 14px;">This is a test email from the <strong>RD Classes</strong> portal.</p>
      <div style="background: #F1F5F9; padding: 12px; border-radius: 8px; font-size: 13px; font-family: monospace;">
        Host: ${escapeHtml(config.host)}<br>
        Port: ${escapeHtml(String(config.port))}<br>
        Sender: ${escapeHtml(config.fromHeader)}<br>
        Timestamp: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      </div>
      <p style="color: #10B981; font-weight: 700; margin-bottom: 0;">Email delivery is working properly.</p>
    </div>
  </div>`;

  return sendEmailDirect({
    to,
    subject,
    html,
    text,
    kind: "test",
    customTransporter,
  });
}
