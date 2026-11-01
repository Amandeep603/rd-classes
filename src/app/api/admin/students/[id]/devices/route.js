import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device, DeviceRequest, Session } from "@/lib/models";
import {
  removeDevice,
  approveDeviceRequest,
  rejectDeviceRequest,
  reconsiderDeviceRequest,
} from "@/server/auth/deviceService.js";

export async function GET(request, { params }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authenticated) return auth.response;

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();

    const [devices, requests, activeSessions] = await Promise.all([
      Device.find({
        $or: [{ studentId: id }, { userId: id }],
      })
        .sort({ lastUsedAt: -1, createdAt: -1 })
        .lean(),
      DeviceRequest.find({
        $or: [{ studentId: id }, { userId: id }],
      })
        .sort({ lastAttemptAt: -1, createdAt: -1 })
        .lean(),
      Session.find({
        userId: id,
        revoked: { $ne: true },
        expiresAt: { $gt: new Date() },
      }).lean(),
    ]);

    const approved = devices.filter((d) => d.status === "approved");
    const pending = [
      ...requests.filter((r) => r.status === "pending"),
      ...devices.filter((d) => d.status === "pending"),
    ];
    const rejected = [
      ...requests.filter((r) => r.status === "rejected"),
      ...devices.filter((d) => d.status === "rejected"),
    ];

    return NextResponse.json({
      success: true,
      devices,
      approved,
      pending,
      rejected,
      activeSessionsCount: activeSessions.length,
      activeSessionDeviceIds: activeSessions.map((s) => s.deviceId),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authenticated) return auth.response;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));
    const adminId = auth.user._id;
    const adminName = auth.user.name || "Admin";

    if (body.action === "revoke") {
      if (!body.deviceId) {
        return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
      }
      await removeDevice(id, body.deviceId, adminId, adminName);
      return NextResponse.json({ success: true, message: "Device revoked successfully." });
    }

    if (body.action === "approve") {
      const reqId = body.requestId || body.deviceId;
      await approveDeviceRequest(
        reqId,
        {
          mode: body.mode || "additional",
          replaceDeviceId: body.replaceDeviceId || null,
          targetDeviceId: body.targetDeviceId || null,
        },
        adminId,
        adminName
      );
      return NextResponse.json({ success: true, message: "Device approved successfully." });
    }

    if (body.action === "reject") {
      const reqId = body.requestId || body.deviceId;
      await rejectDeviceRequest(reqId, body.note || "", adminId, adminName);
      return NextResponse.json({ success: true, message: "Device rejected successfully." });
    }

    if (body.action === "reconsider") {
      const reqId = body.requestId || body.deviceId;
      await reconsiderDeviceRequest(reqId, adminId, adminName);
      return NextResponse.json({ success: true, message: "Device reconsidered successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
