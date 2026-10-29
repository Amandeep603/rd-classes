/**
 * Client-safe Vimeo URL / ID parsing utilities
 */

export function parseVimeoUrl(input) {
  if (!input || typeof input !== "string") {
    return { vimeoId: "", vimeoHash: "" };
  }

  const trimmed = input.trim();

  // If already just digits
  if (/^\d+$/.test(trimmed)) {
    return { vimeoId: trimmed, vimeoHash: "" };
  }

  // player.vimeo.com/video/:id?h=:hash or player.vimeo.com/video/:id/:hash
  const playerMatch = trimmed.match(
    /player\.vimeo\.com\/video\/(\d+)(?:\/([a-zA-Z0-9]+)|\?[^#]*h=([a-zA-Z0-9]+))?/
  );
  if (playerMatch) {
    return {
      vimeoId: playerMatch[1],
      vimeoHash: playerMatch[2] || playerMatch[3] || "",
    };
  }

  // vimeo.com/:id/:hash or vimeo.com/:id
  const standardMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)(?:\/([a-zA-Z0-9]+))?/
  );
  if (standardMatch) {
    return {
      vimeoId: standardMatch[1],
      vimeoHash: standardMatch[2] || "",
    };
  }

  return { vimeoId: "", vimeoHash: "" };
}

