import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import {
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,
} from "@/server/services/notificationService.js";

export async function POST(request) {
  const auth = await getCurrentStudent();
  if (!auth?.user || auth.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectDB();

    if (body.all) {
      const now = new Date();
      const enrollments = await Enrollment.find({
        userId: auth.user._id,
        status: "active",
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      })
        .select("courseId")
        .lean();

      const activeCourseIds = enrollments.map((e) => e.courseId).filter(Boolean);
      await markAllStudentNotificationsAsRead(auth.user._id, activeCourseIds);
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await markStudentNotificationAsRead(body.id, auth.user._id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

