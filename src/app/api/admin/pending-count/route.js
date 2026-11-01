import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/lib/models/DeviceRequest";
import { Device } from "@/lib/models/Device";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !admin.user || admin.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const reqCount = await DeviceRequest.countDocuments({ status: "pending" });
    const legacyCount = await Device.countDocuments({ status: "pending" });
    const count = reqCount + legacyCount;

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
