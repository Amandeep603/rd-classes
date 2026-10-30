import "server-only";
import { env } from "../env.js";
import { parseVimeoUrl } from "@/lib/utils/vimeoParser";

export { parseVimeoUrl };

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
