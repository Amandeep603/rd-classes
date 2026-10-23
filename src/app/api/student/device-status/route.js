import { NextResponse } from "next/server";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { getCookie, COOKIE_NAMES } from "@/server/auth/cookies.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryDeviceId = searchParams.get("deviceId");
    const cookieDeviceId = await getCookie(COOKIE_NAMES.DEVICE);

    const deviceId = queryDeviceId || cookieDeviceId;
    if (!deviceId) {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    await connectDB();
    const req = await DeviceRequest.findOne({ deviceId })
      .sort({ createdAt: -1 })
      .lean();

    if (!req) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({
      status: req.status, // "pending" | "approved" | "rejected"
      note: req.note || "",
      studentNote: req.studentNote || "",
      label: req.label || "",
      requestId: req._id.toString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
