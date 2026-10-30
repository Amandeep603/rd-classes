import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth/session.js";
import { markNotificationsAsRead } from "@/server/services/notificationService.js";

export async function POST(req) {
  try {
    const auth = await getCurrentAdmin();
    if (!auth || auth.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    const result = await markNotificationsAsRead({ notificationId, markAll });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/notifications/read] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
