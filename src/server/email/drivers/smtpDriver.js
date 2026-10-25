import "server-only";
import nodemailer from "nodemailer";

let cachedTransporter = null;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  // port 465 = implicit TLS; port 587 = STARTTLS
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

export async function sendWithSmtp({ to, subject, html, text, fromName, fromAddress }) {
  const transporter = getTransporter();

  const from = fromName && fromAddress
    ? `"${fromName}" <${fromAddress}>`
    : fromAddress || process.env.SMTP_USER || "no-reply@rd-classes.in";

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
  };
}
