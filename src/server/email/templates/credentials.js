import "server-only";

export function renderCredentialsTemplate({
  studentName,
  loginId,
  password,
  loginUrl,
  courses = [],
  whatsappPhone = "918368545620",
}) {
  const subject = "Your RD Classes login details";

  const cleanPhone = (whatsappPhone || "918368545620").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello Sir, this is ${studentName} (${loginId}).`
  )}`;

  const coursesListText =
    courses.length > 0
      ? courses
          .map(
            (c) =>
              `- ${c.title}${c.validUntil ? ` (Valid until: ${new Date(c.validUntil).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })})` : ""}`
          )
          .join("\n")
      : "- Enrolled Courses (Active)";

  const coursesListHtml =
    courses.length > 0
      ? `<ul style="margin: 8px 0; padding-left: 20px; color: #1E293B;">
          ${courses
            .map(
              (c) =>
                `<li style="margin-bottom: 4px;"><strong>${escapeHtml(c.title)}</strong>${
                  c.validUntil
                    ? ` <span style="color: #64748B; font-size: 13px;">(Valid until: ${new Date(c.validUntil).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })})</span>`
                    : ""
                }</li>`
            )
            .join("")}
        </ul>`
      : `<p style="margin: 8px 0; color: #1E293B;">All assigned course curriculum modules</p>`;

  const text = `Hello ${studentName},

Welcome to RD Classes! Here are your student portal login details:

Login ID: ${loginId}
Password: ${password}

Portal Link: ${loginUrl}

Assigned Courses:
${coursesListText}

Important Rule:
Your account works on one approved device. To use another device, please ask Sir for approval.

WhatsApp Contact:
${whatsappUrl}

Security Notice:
Do not share these details with anyone.

Best regards,
Ronak Dugar
RD Classes`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0B2545; padding: 28px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FFC21A; color: #0B2545; font-weight: 900; font-size: 20px; padding: 6px 14px; border-radius: 8px; letter-spacing: 0.5px;">
                RD CLASSES
              </div>
              <p style="margin: 8px 0 0 0; color: #E2E8F0; font-size: 13px; font-weight: 500;">
                Accountancy Mastery for Class 11 &amp; 12 CBSE
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
                Welcome to RD Classes. Your student portal account is ready. You can now access your video lectures, concept notes, and mock tests.
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #FFFDF5; border: 1px solid #FDE68A; border-left: 4px solid #FFC21A; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B45309; letter-spacing: 0.5px;">Login ID</span>
                      <div style="font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 16px; font-weight: 700; color: #0F172A; margin-top: 2px;">
                        ${escapeHtml(loginId)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B45309; letter-spacing: 0.5px;">Password</span>
                      <div style="font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 16px; font-weight: 700; color: #0B2545; background-color: #FFFFFF; border: 1px dashed #FCD34D; border-radius: 8px; padding: 8px 12px; margin-top: 4px; display: inline-block;">
                        ${escapeHtml(password)}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Login CTA Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${escapeHtml(loginUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0B2545; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(11, 37, 69, 0.2);">
                  Sign in to Student Portal &rarr;
                </a>
              </div>

              <!-- Assigned Courses -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                <span style="font-size: 12px; font-weight: 700; color: #0B2545; text-transform: uppercase; letter-spacing: 0.5px;">
                  Assigned Courses
                </span>
                ${coursesListHtml}
              </div>

              <!-- Device Lock Rule Notice -->
              <div style="background-color: #F1F5F9; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #334155; font-size: 12px; line-height: 1.5;">
                  <strong>One-Device Rule:</strong> Your account works on one approved device. To use another device, please ask Sir for approval.
                </p>
              </div>

              <!-- WhatsApp Support -->
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 13px;">
                Need help or have questions? <a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" style="color: #0066FF; font-weight: 600; text-decoration: underline;">Chat with Sir on WhatsApp</a>.
              </p>

              <!-- Security Notice -->
              <p style="margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #DC2626; font-size: 11px; font-weight: 600;">
                &#9888; Security notice: Do not share these details with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #64748B; font-size: 11px;">
                &copy; ${new Date().getFullYear()} RD Classes. All rights reserved.
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

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
