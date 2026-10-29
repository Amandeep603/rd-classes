import "server-only";

function getVimeoToken() {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token || !token.trim()) {
    throw new Error(
      "VIMEO_ACCESS_TOKEN is not configured in .env. Please set your Vimeo Access Token."
    );
  }
  return token.trim();
}

/**
 * Fetch helper with rate-limit retry support.
 * Never logs or exposes the Authorization header.
 */
async function vimeoFetch(endpoint, options = {}, retries = 2) {
  const token = getVimeoToken();
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.vimeo.com${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    Authorization: `bearer ${token}`,
    Accept: "application/vnd.vimeo.*+json;version=3.4",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 429 && retries > 0) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "2", 10);
      const waitMs = Math.min(Math.max(retryAfter * 1000, 1000), 5000);
      await new Promise((r) => setTimeout(r, waitMs));
      return vimeoFetch(endpoint, options, retries - 1);
    }

    if (res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({}));
      const msg =
        data.developer_message ||
        data.error ||
        "Vimeo token unauthorized or missing required scopes.";
      throw new Error(
        `Vimeo Authentication Failed: ${msg}. Please ensure your token has Public and Private scopes.`
      );
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.developer_message ||
          data.error ||
          `Vimeo API error (Status ${res.status})`
      );
    }

    return await res.json();
  } catch (err) {
    if (retries > 0 && err.message?.includes("fetch failed")) {
      await new Promise((r) => setTimeout(r, 1000));
      return vimeoFetch(endpoint, options, retries - 1);
    }
    throw err;
  }
}

/**
 * Fetches all projects (folders) with pagination.
 * Returns array of normalized folder objects and a hierarchical tree.
 */
export async function getVimeoFolders() {
  const allProjects = [];
  let nextUrl = "/me/projects?per_page=100";

  while (nextUrl) {
    const data = await vimeoFetch(nextUrl);
    if (Array.isArray(data.data)) {
      allProjects.push(...data.data);
    }
    nextUrl = data.paging?.next || null;
  }

  // Normalize projects
  const folders = allProjects.map((p) => {
    const id = p.uri?.split("/").pop();
    const parentUri = p.metadata?.connections?.parent_folder?.uri || null;
    const parentId = parentUri ? parentUri.split("/").pop() : null;
    const ancestorNames =
      p.metadata?.connections?.ancestor_path?.map((a) => a.name) || [];

    return {
      id,
      name: p.name,
      uri: p.uri,
      videoCount: p.metadata?.connections?.videos?.total || 0,
      parent: parentId,
      parentUri,
      ancestors: ancestorNames,
    };
  });

  // Natural sort by name
  folders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  // Build tree
  const folderMap = new Map();
  folders.forEach((f) => folderMap.set(f.id, { ...f, children: [] }));

  const tree = [];
  folders.forEach((f) => {
    const node = folderMap.get(f.id);
    if (f.parent && folderMap.has(f.parent)) {
      folderMap.get(f.parent).children.push(node);
    } else {
      tree.push(node);
    }
  });

  return { folders, tree };
}

/**
 * Fetches all videos for a folder with pagination.
 * Extracts video id, privacy hash, duration, thumbnails, and privacy warnings.
 */
export async function getVimeoFolderVideos(folderId) {
  if (!folderId) throw new Error("Folder ID is required.");

  const allVideos = [];
  let nextUrl = `/me/projects/${folderId}/videos?per_page=100&fields=uri,name,link,player_embed_url,duration,created_time,privacy,pictures.sizes`;

  while (nextUrl) {
    const data = await vimeoFetch(nextUrl);
    if (Array.isArray(data.data)) {
      allVideos.push(...data.data);
    }
    nextUrl = data.paging?.next || null;
  }

  const normalized = allVideos.map((v) => {
    const vimeoId = v.uri?.split("/").pop();

    // Extract privacy hash from player_embed_url or link
    let vimeoHash = "";
    if (v.player_embed_url) {
      try {
        const u = new URL(v.player_embed_url);
        vimeoHash = u.searchParams.get("h") || "";
      } catch {
        // ignore
      }
    }
    if (!vimeoHash && v.link) {
      const match = v.link.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        vimeoHash = match[1];
      }
    }

    const privacyView = v.privacy?.view || "anybody";
    const embedPrivacy = v.privacy?.embed || "public";

    // Warning if video is public or embed privacy is not restricted
    const isPublicWarning =
      privacyView === "anybody" || embedPrivacy === "public";

    // Best thumbnail
    const thumbSizes = v.pictures?.sizes || [];
    const thumbnail =
      thumbSizes[2]?.link ||
      thumbSizes[1]?.link ||
      thumbSizes[0]?.link ||
      "";

    return {
      vimeoId,
      name: v.name,
      uri: v.uri,
      link: v.link,
      playerEmbedUrl: v.player_embed_url || "",
      vimeoHash,
      duration: Number(v.duration) || 0,
      createdTime: v.created_time,
      privacyView,
      embedPrivacy,
      thumbnail,
      isPublicWarning,
    };
  });

  // Natural sort by name so "class 2" comes before "class 10"
  normalized.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  return normalized;
}

/**
 * Clean title helper: removes file extensions (.mp4, .mov, etc) and trims.
 */
export function cleanVideoTitle(rawName) {
  if (!rawName) return "Untitled Lecture";
  return rawName.replace(/\.(mp4|mov|avi|mkv|webm|m4v)$/i, "").trim();
}

/**
 * Parse Part number: extracts from "Class 10", "Part 2", etc.
 */
export function parsePartNumber(title, defaultIndex = 1) {
  if (!title) return defaultIndex;
  const matchClass = title.match(
    /(?:class|part|lecture|lec|session|ch|no\.?|#)\s*(\d+)/i
  );
  if (matchClass && matchClass[1]) {
    const num = parseInt(matchClass[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  const matchTrailing = title.match(/\b(\d+)\b/);
  if (matchTrailing && matchTrailing[1]) {
    const num = parseInt(matchTrailing[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return defaultIndex;
}

