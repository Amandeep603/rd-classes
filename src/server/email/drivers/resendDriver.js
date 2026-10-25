import "server-only";

export async function sendWithResend({ to, subject, html, text, fromName, fromAddress }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const from = fromName && fromAddress
    ? `${fromName} <${fromAddress}>`
    : fromAddress || "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Resend API error: ${res.statusText}`);
  }

  return {
    messageId: data.id,
  };
}
