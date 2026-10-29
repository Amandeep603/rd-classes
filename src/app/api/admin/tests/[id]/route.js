import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Test } from "@/lib/models/Test";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const test = await Test.findById(id);
    if (!test) return Response.json({ error: "Test not found" }, { status: 404 });

    if (body.title !== undefined) test.title = body.title.trim();
    if (body.courseId !== undefined) test.courseId = body.courseId || null;
    if (body.testDate !== undefined) {
      test.testDate = new Date(body.testDate);
      test.startsAt = test.testDate;
    }
    if (body.startTime !== undefined) test.startTime = body.startTime.trim();
    if (body.endTime !== undefined) test.endTime = body.endTime.trim();
    if (body.syllabus !== undefined) test.syllabus = body.syllabus.trim();
    if (body.venue !== undefined) test.venue = body.venue.trim();

    await test.save();

    return Response.json({ success: true, test });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectDB();
    await Test.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
