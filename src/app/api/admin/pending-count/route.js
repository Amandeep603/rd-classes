import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";

export async function GET() {
  try {
    const admin = await getCurrentUser("admin");
    if (!admin || !admin.user || admin.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const count = await DeviceRequest.countDocuments({ status: "pending" });
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
