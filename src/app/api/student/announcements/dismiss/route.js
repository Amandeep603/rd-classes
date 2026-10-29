import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { User } from "@/lib/models/User";

export async function POST(request) {
  const auth = await getCurrentUser();
  if (!auth?.user || auth.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { announcementId } = body;
    if (!announcementId) {
      return NextResponse.json({ error: "Missing announcementId" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndUpdate(auth.user._id, {
      $addToSet: { dismissedAnnouncementIds: announcementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

