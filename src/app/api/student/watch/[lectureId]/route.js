import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { isLectureFree } from "@/server/services/lectureService.js";
import { getStudentCourseAccess } from "@/server/services/studentAccessService.js";
import { Progress } from "@/server/db/models/Progress.js";

// In-memory sliding window rate limiter: 60 req/minute per student or per IP
const watchRateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 60;

function checkRateLimit(key) {
  const now = Date.now();
  const timestamps = watchRateLimitMap.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recent.length >= MAX_REQUESTS_PER_MIN) {
    return false;
  }

  recent.push(now);
  watchRateLimitMap.set(key, recent);

  // Periodic cleanup if map grows
  if (watchRateLimitMap.size > 2000) {
    for (const [k, arr] of watchRateLimitMap.entries()) {
      if (!arr.some((t) => now - t < RATE_LIMIT_WINDOW)) {
        watchRateLimitMap.delete(k);
      }
    }
  }

  return true;
}

export async function GET(request, { params }) {
  const { lectureId } = await params;
  if (!lectureId) {
    return NextResponse.json({ error: "Missing lecture ID" }, { status: 400 });
  }

  const auth = await getCurrentStudent();
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateKey = auth?.user?._id ? `user:${auth.user._id}` : `ip:${clientIp}`;
  if (!checkRateLimit(rateKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Retry-After": "60",
        },
      }
    );
  }

  await connectDB();
  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture || lecture.status === "archived") {
    return NextResponse.json(
      { error: "Lecture not found" },
      {
        status: 404,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  const isFree = isLectureFree(lecture);
  let isEnrolled = false;
  let studentMeta = null;

  if (auth?.user) {
    const access = await getStudentCourseAccess(auth);
    isEnrolled = access.isEnrolledInCourse(lecture.courseId);
    if (access.student) {
      studentMeta = {
        name: access.student.name,
        loginId: access.student.loginId,
        phone: access.student.phone || "",
      };
    }
  }

  // ACCESS RULE: Can be watched if isFree === true (anyone) OR enrolled student
  if (!isFree && !isEnrolled) {
    const errorMessage = auth?.user
      ? "This lecture is not part of your enrolled courses"
      : "Forbidden. This lecture is for enrolled students.";
    return NextResponse.json(
      {
        error: errorMessage,
        notEnrolled: Boolean(auth?.user),
        isFree: false,
        locked: true,
      },
      {
        status: 403,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  if (!lecture.vimeoId || lecture.vimeoId.trim() === "") {
    return NextResponse.json(
      {
        error: "Video coming soon. No video uploaded yet.",
        isFree,
        locked: false,
        hasVideo: false,
      },
      {
        status: 404,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  // Retrieve saved progress if student logged in
  let savedPositionSec = 0;
  let completed = false;
  if (auth?.user?._id) {
    const progress = await Progress.findOne({
      userId: auth.user._id,
      lectureId: lecture._id,
    }).lean();
    savedPositionSec = progress?.positionSec || progress?.watchedSeconds || 0;
    completed = Boolean(progress?.completed);
  }

  // Build secure Vimeo player URL with embed parameters
  // like=0, share=0, watchlater=0, title=0, byline=0, portrait=0, vimeo_logo=0, pip=0, dnt=1, playsinline=1
  const hashParam = lecture.vimeoHash ? `h=${encodeURIComponent(lecture.vimeoHash)}&` : "";
  const playerUrl = `https://player.vimeo.com/video/${encodeURIComponent(
    lecture.vimeoId
  )}?${hashParam}like=0&share=0&watchlater=0&title=0&byline=0&portrait=0&vimeo_logo=0&pip=0&dnt=1&playsinline=1`;

  // Note: NEVER return raw vimeoId or vimeoHash to the client!
  return NextResponse.json(
    {
      success: true,
      data: {
        playerUrl,
        durationSec: lecture.durationSeconds || lecture.durationSec || 0,
        savedPositionSec,
        completed,
        student: studentMeta,
      },
    },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    }
  );
}
