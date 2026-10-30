import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { getStudentNotifications } from "@/server/services/notificationService.js";

export async function GET() {
  const auth = await getCurrentStudent();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();

    const enrollments = await Enrollment.find({
      userId: auth.user._id,
      status: "active",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select("courseId")
      .lean();

    const activeCourseIds = enrollments.map((e) => e.courseId).filter(Boolean);

    const data = await getStudentNotifications(auth.user._id, activeCourseIds, 10);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

