/**
 * Asia/Kolkata (IST) Timezone Utilities
 */

/**
 * Normalizes an enrollment expiration date to the end of that day in Asia/Kolkata (23:59:59.999 IST).
 * E.g., for "2026-12-31" -> 2026-12-31T23:59:59.999+05:30 (18:29:59.999 UTC)
 */
export function toISTEndOfDay(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  // Format YYYY-MM-DD in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);
}

/**
 * Formats a date in Asia/Kolkata (IST) with en-IN locale.
 */
export function formatISTDate(date, options = {}) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options,
  });
}

/**
 * Formats a timestamp with date and time in Asia/Kolkata (IST) with en-IN locale.
 */
export function formatISTDateTime(date, options = {}) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options,
  });
}
