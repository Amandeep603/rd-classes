import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device, User } from "@/lib/models";
import { removeDevice } from "@/server/auth/deviceService.js";

export async function GET(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const deviceType = searchParams.get("deviceType") || "";
    const os = searchParams.get("os") || "";

    await connectDB();

    const query = { status: "approved" };
    if (deviceType && deviceType !== "all") {
      query.deviceType = deviceType;
    }
    if (os && os !== "all") {
      query.$or = [{ osFamily: os }, { os: new RegExp(os, "i") }];
    }

    const devices = await Device.find(query)
      .populate({
        path: "studentId",
        select: "name loginId email phone maxDevices status",
      })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .lean();

    let results = devices.map((d) => ({
      ...d,
      student: d.studentId || d.userId,
    }));

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      results = results.filter((item) => {
        const studentName = (item.student?.name || "").toLowerCase();
        const studentLoginId = (item.student?.loginId || "").toLowerCase();
        const label = (item.deviceLabel || item.label || "").toLowerCase();
        const model = (item.model || "").toLowerCase();
        const ip = (item.lastIp || item.ip || "").toLowerCase();
        return (
          studentName.includes(s) ||
          studentLoginId.includes(s) ||
          label.includes(s) ||
          model.includes(s) ||
          ip.includes(s)
        );
      });
    }

    return NextResponse.json({
      success: true,
      devices: results,
      totalCount: results.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, studentId, deviceId } = body;

    if (action === "revoke") {
      if (!studentId || !deviceId) {
        return NextResponse.json(
          { error: "studentId and deviceId are required." },
          { status: 400 }
        );
      }

      await removeDevice(studentId, deviceId, auth.user._id, auth.user.name || "Admin");
      return NextResponse.json({ success: true, message: "Device revoked successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

