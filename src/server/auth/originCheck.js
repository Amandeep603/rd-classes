import "server-only";

/**
 * Validates Origin and/or Referer headers on state-changing requests.
 * Protects against cross-site request forgery (CSRF).
 */
export function verifyOriginOrReferer(headersList) {
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const hostHeader = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();

  // If neither is present (e.g. non-browser API test without headers), permit or flag
  if (!origin && !referer) {
    return true;
  }

  const isAllowedHost = (urlStr) => {
    if (!urlStr) return true;
    try {
      const u = new URL(urlStr);
      const h = u.hostname.toLowerCase();
      return (
        h === host ||
        h === "www.rd-classes.in" ||
        h === "rd-classes.in" ||
        h === "rd-classes-sandy.vercel.app" ||
        h.endsWith(".vercel.app") ||
        h === "localhost" ||
        h === "127.0.0.1"
      );
    } catch {
      return false;
    }
  };

  if (origin && !isAllowedHost(origin)) {
    return false;
  }

  if (referer && !isAllowedHost(referer)) {
    return false;
  }

  return true;
}

