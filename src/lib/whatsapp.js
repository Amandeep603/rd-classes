export function formatWhatsAppMessage({
  template,
  courseTitle = "",
  studentName = "",
  loginId = "",
  link = "",
}) {
  const defaultTemplate =
    "Hello Ronak Sir, I would like to get access to *{course}* at RD Classes.\n{studentLine}Course link: {link}\nPlease guide me about the next steps.";

  const rawTemplate = template && template.trim() ? template : defaultTemplate;

  const studentLine = studentName
    ? `Student: ${studentName}${loginId ? ` (${loginId})` : ""}\n`
    : "";

  return rawTemplate
    .replace(/{course}/g, courseTitle)
    .replace(/{name}/g, studentName || "Student")
    .replace(/{loginId}/g, loginId || "")
    .replace(/{link}/g, link)
    .replace(/{studentLine}/g, studentLine);
}

export function buildWhatsAppUrl({ phone, message }) {
  const digits = (phone || "918368545620").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppUrl(message = "", phone = "918368545620") {
  const digits = (phone || "918368545620").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
