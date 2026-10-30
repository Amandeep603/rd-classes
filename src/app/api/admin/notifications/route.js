import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device } from "@/lib/models/Device";
import { getAdminNotifications } from "@/server/services/notificationService.js";

export async function GET(request) {
  try {
    const auth = await getCurrentAdmin();
    if (!auth || auth.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [{ notifications, unreadCount }, pendingDeviceCount] = await Promise.all([
      getAdminNotifications(20),
      Device.countDocuments({ status: "pending" }).catch(() => 0),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pendingDeviceCount,
    });
  } catch (err) {
    if (err?.digest === "HANGING_PROMISE_REJECTION" || err?.message?.includes("prerender")) {
      throw err;
    }
    console.error("[GET /api/admin/notifications] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
