import "server-only";
import fs from "fs";
import path from "path";

export async function sendWithConsole({ to, subject, html, text }) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Console email driver is refused in production mode. Configure SMTP or Resend driver."
    );
  }

  const dir = path.resolve(".local-emails");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeTo = to.replace(/[^a-z0-9@._-]/gi, "_");
  const baseFilename = `${timestamp}_${safeTo}`;

  const htmlPath = path.join(dir, `${baseFilename}.html`);
  const textPath = path.join(dir, `${baseFilename}.txt`);

  fs.writeFileSync(htmlPath, html || "", "utf8");
  fs.writeFileSync(textPath, text || "", "utf8");

  // Per spec: print ONLY recipient and subject in console, never secrets or passwords
  console.log(`[Email Console Driver] To: ${to} | Subject: "${subject}" | Stored: .local-emails/${baseFilename}`);

  return {
    messageId: `console-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  };
}
