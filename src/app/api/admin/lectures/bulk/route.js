import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";
import { detectVideoProvider } from "../route.js";
import { invalidateCoursesCache } from "@/server/services/courseService.js";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { courseId, book = "", chapter = "", text = "" } = body;

    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!text || !text.trim()) {
      return Response.json({ error: "No lecture lines provided" }, { status: 400 });
    }

    await connectDB();

    const maxLec = await Lecture.findOne({ courseId })
      .sort({ position: -1 })
      .select("position")
      .lean();
    let currentPos = (maxLec?.position ?? 0) + 1;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const createdLectures = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse title and URL from patterns:
      // "Title - https://..." or "Title | https://..." or "Title, https://..." or just "https://..."
      let title = `Lecture ${currentPos}`;
      let url = "";

      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        url = urlMatch[1];
        const titlePart = line.replace(url, "").replace(/^[-|,:\s]+|[-|,:\s]+$/g, "").trim();
        if (titlePart) {
          title = titlePart;
        }
      } else {
        title = line;
      }

      const provider = detectVideoProvider(url);

      const lec = await Lecture.create({
        courseId,
        book: book.trim(),
        chapter: chapter.trim(),
        title,
        videoUrl: url,
        videoProvider: provider,
        position: currentPos,
        order: currentPos,
        status: "published",
        published: true,
      });

      createdLectures.push(lec);
      currentPos++;
    }

    await invalidateCoursesCache();

    return Response.json({
      success: true,
      count: createdLectures.length,
      lectures: createdLectures,
    });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
