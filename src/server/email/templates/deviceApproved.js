import "server-only";

export function renderDeviceApprovedTemplate({
  studentName,
  loginId,
  deviceLabel,
  loginUrl,
  whatsappPhone = "918368545620",
}) {
  const subject = "Your new device was approved - RD Classes";

  const cleanPhone = (whatsappPhone || "918368545620").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello Sir, this is ${studentName} (${loginId}).`
  )}`;

  const text = `Hello ${studentName},

Your device approval request has been approved by Sir.

Device: ${deviceLabel || "Approved Device"}
Login ID: ${loginId}

You can now log in to the student portal on this device:
${loginUrl}

If you did not request this device change, please message Sir immediately on WhatsApp:
${whatsappUrl}

Best regards,
RD Classes`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0B2545; padding: 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FFC21A; color: #0B2545; font-weight: 900; font-size: 18px; padding: 6px 12px; border-radius: 8px;">
                RD CLASSES
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="display: inline-block; background-color: #DCFCE7; color: #166534; font-size: 12px; font-weight: 800; padding: 4px 12px; rounded-full; border-radius: 9999px; margin-bottom: 16px;">
                &#10003; DEVICE APPROVED
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0B2545;">
                Hello ${escapeHtml(studentName)},
              </h1>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Your new device request has been reviewed and approved by Ronak Sir.
              </p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #64748B;">Device</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">
                  ${escapeHtml(deviceLabel || "Primary Device")}
                </div>
                <div style="font-size: 12px; color: #64748B; margin-top: 8px;">Student ID</div>
                <div style="font-family: monospace; font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">
                  ${escapeHtml(loginId)}
                </div>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${escapeHtml(loginUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0B2545; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 9999px;">
                  Log In Now &rarr;
                </a>
              </div>

              <p style="margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 12px;">
                If you did not request this device approval, please message Sir immediately on WhatsApp.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 16px; text-align: center; border-top: 1px solid #E2E8F0;">
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

export function renderTestTemplate({ toEmail, driverName }) {
  const subject = "RD Classes - Test Email Delivery";
  const text = `Hello,

This is a test email sent from the RD Classes administration panel.
Driver: ${driverName}
Timestamp: ${new Date().toISOString()}

If you received this message, your email driver configuration is working properly!

Best regards,
RD Classes System`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 20px; color: #0f172a;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
    <h2 style="color: #0b2545; margin-top: 0;">RD Classes Email Test</h2>
    <p>This is a test email successfully dispatched from the RD Classes administration portal.</p>
    <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px;">
      Driver: <strong>${escapeHtml(driverName)}</strong><br/>
      Recipient: <strong>${escapeHtml(toEmail)}</strong><br/>
      Date: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
    </div>
  </div>
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
