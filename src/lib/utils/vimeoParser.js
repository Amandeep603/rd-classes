/**
 * Client-safe & server-safe Vimeo URL / embed parser.
 * Supports:
 * - <iframe> embed code: <iframe src="https://player.vimeo.com/video/1040854407?h=59f81bc26c"...
 * - Player URL: https://player.vimeo.com/video/1040854407?h=59f81bc26c
 * - Direct URL: https://vimeo.com/1040854407/59f81bc26c or https://vimeo.com/1040854407
 * - Pure ID: 1040854407
 */
export function parseVimeoUrl(input) {
  if (!input || typeof input !== "string") {
    return { vimeoId: "", vimeoHash: "", isValid: false };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { vimeoId: "", vimeoHash: "", isValid: false };
  }

  // Pure digits
  if (/^\d{6,}$/.test(trimmed)) {
    return { vimeoId: trimmed, vimeoHash: "", isValid: true };
  }

  // Extract from <iframe> src if present
  let target = trimmed;
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    target = iframeSrcMatch[1];
  }

  // player.vimeo.com/video/:id?h=:hash or /:id/:hash
  const playerMatch = target.match(
    /player\.vimeo\.com\/video\/(\d+)(?:\/([a-zA-Z0-9]+)|\?[^#]*h=([a-zA-Z0-9]+))?/i
  );
  if (playerMatch) {
    return {
      vimeoId: playerMatch[1],
      vimeoHash: playerMatch[2] || playerMatch[3] || "",
      isValid: true,
    };
  }

  // vimeo.com/:id/:hash or vimeo.com/:id
  const standardMatch = target.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)(?:\/([a-zA-Z0-9]+))?/i
  );
  if (standardMatch) {
    return {
      vimeoId: standardMatch[1],
      vimeoHash: standardMatch[2] || "",
      isValid: true,
    };
  }

  return { vimeoId: "", vimeoHash: "", isValid: false };
}

export function buildVimeoEmbedUrl(vimeoId, vimeoHash) {
  if (!vimeoId) return "";
  const hashParam = vimeoHash ? `h=${encodeURIComponent(vimeoHash)}&` : "";
  return `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}?${hashParam}dnt=1&title=0&byline=0&portrait=0&playsinline=1`;
}

