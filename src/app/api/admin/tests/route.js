import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Test } from "@/lib/models/Test";

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    await connectDB();
    const filter = courseId && courseId !== "all" ? { courseId } : {};

    const tests = await Test.find(filter)
      .populate("courseId", "title slug")
      .sort({ testDate: -1, startsAt: -1, createdAt: -1 })
      .lean();

    return Response.json({ success: true, tests });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    await connectDB();

    const testDate = body.testDate ? new Date(body.testDate) : new Date();

    const test = await Test.create({
      courseId: body.courseId || null,
      title: body.title.trim(),
      testDate,
      startsAt: testDate,
      startTime: (body.startTime || "10:00 AM").trim(),
      endTime: (body.endTime || "01:00 PM").trim(),
      syllabus: (body.syllabus || "").trim(),
      venue: (body.venue || "RD Classes, Sector 9 Centre").trim(),
    });

    try {
      const { createStudentNotification } = await import("@/server/services/notificationService.js");
      await createStudentNotification({
        type: "mock_test_scheduled",
        title: `Mock Test Scheduled: ${test.title}`,
        message: `${test.startTime} - ${test.endTime} · ${test.venue}`,
        courseId: test.courseId || null,
        link: "/student/tests",
        entityId: test._id.toString(),
      });
    } catch {
      // ignore
    }

    return Response.json({ success: true, test }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
