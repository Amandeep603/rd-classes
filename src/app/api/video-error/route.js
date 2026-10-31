import { NextResponse } from "next/server";

// In-memory rate limiter for video error reports (max 30 per minute per IP)
const errorRateMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ERRORS_PER_MIN = 30;

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const now = Date.now();
    const timestamps = errorRateMap.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

    if (recent.length >= MAX_ERRORS_PER_MIN) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    recent.push(now);
    errorRateMap.set(ip, recent);

    const body = await request.json().catch(() => ({}));
    const { code, errorName, errorMessage, lectureId } = body;

    // Sanitize: ensure no vimeoId or hash is logged
    const cleanName = String(errorName || "").slice(0, 100).replace(/(\d{6,})/g, "[REDACTED]");
    const cleanMsg = String(errorMessage || "").slice(0, 300).replace(/(\d{6,})/g, "[REDACTED]");
    const cleanCode = String(code || "E:unknown").slice(0, 20);

    console.warn(`[VIDEO_PLAYER_ERROR] code=${cleanCode} name="${cleanName}" msg="${cleanMsg}" lecture=${lectureId || "unknown"} ip=${ip}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

