import "server-only";
import { env } from "../env.js";

/**
 * Parses Vimeo ID and optional privacy hash from various Vimeo URL formats.
 * Supported examples:
 * - https://vimeo.com/123456789/abcdef1234
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789?h=abcdef1234
 * - 123456789
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

  // player.vimeo.com/video/:id?h=:hash
  const playerMatch = trimmed.match(
    /player\.vimeo\.com\/video\/(\d+)(?:\?[^#]*h=([a-zA-Z0-9]+))?/
  );
  if (playerMatch) {
    return {
      vimeoId: playerMatch[1],
      vimeoHash: playerMatch[2] || "",
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

  return { vimeoId: trimmed, vimeoHash: "" };
}

/**
 * Fetches video metadata from Vimeo API v3.
 * Degrades gracefully if token is missing or invalid.
 */
export async function fetchVimeoMetadata(vimeoId) {
  const token = env.VIMEO_ACCESS_TOKEN;
  if (!token || !vimeoId) {
    return { success: false, error: "VIMEO_ACCESS_TOKEN not configured." };
  }

  try {
    const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Vimeo API error (HTTP ${res.status}): ${res.statusText}`,
      };
    }

    const data = await res.json();
    const thumbnail =
      data.pictures?.sizes?.[data.pictures.sizes.length - 1]?.link ||
      data.pictures?.base_link ||
      "";

    return {
      success: true,
      title: data.name || "",
      durationSec: data.duration || 0,
      description: data.description || "",
      thumbnail,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to contact Vimeo API.",
    };
  }
}
