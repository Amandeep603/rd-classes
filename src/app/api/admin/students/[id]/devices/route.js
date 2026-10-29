import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device, Session } from "@/lib/models";
import {
  removeDevice,
  logoutAllSessions,
} from "@/server/auth/deviceService.js";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();
    const devices = await Device.find({
      $or: [{ studentId: id }, { userId: id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const activeSessions = await Session.find({
      userId: id,
      revoked: { $ne: true },
      expiresAt: { $gt: new Date() },
    }).lean();

    return NextResponse.json({
      devices,
      activeSessionsCount: activeSessions.length,
    });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (body.action === "revoke") {
      if (!body.deviceId) {
        return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
      }
      await removeDevice(id, body.deviceId, admin.user._id);
      return NextResponse.json({ success: true });
    }

    if (body.action === "logout-all") {
      await logoutAllSessions(id, admin.user._id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
