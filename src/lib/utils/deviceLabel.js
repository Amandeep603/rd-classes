/**
 * Formats and sanitizes a device label.
 * If model is empty, 1 char long, or "K", show "Android phone" instead of "K (Android)".
 * Replaces variations like "K (Android)", "k (android)", or standalone "K".
 */
export function formatDeviceLabel(rawLabel, { model = "", os = "", deviceType = "" } = {}) {
  const cleanModel = (model || "").trim();
  const isGenericModel = !cleanModel || cleanModel.length <= 1 || cleanModel.toLowerCase() === "k";

  if (!rawLabel || typeof rawLabel !== "string") {
    if (os === "Android" || deviceType === "mobile" || isGenericModel) {
      return "Android phone";
    }
    return "Device";
  }

  let label = rawLabel.trim();

  // If label is "K" or 1 char or empty
  if (label.length <= 1 || label.toLowerCase() === "k") {
    return "Android phone";
  }

  // Replace "K (Android)" or "k (android)" anywhere in string
  label = label.replace(/\bk\s*\(\s*android\s*\)/gi, "Android phone");
  label = label.replace(/^k\s*\(\s*android\s*\)/i, "Android phone");

  // If label starts with "K ·"
  label = label.replace(/^k\s*·/i, "Android phone ·");

  return label;
}

export default formatDeviceLabel;

