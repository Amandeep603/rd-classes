import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device } from "@/lib/models/Device";
import { removeDevice } from "@/server/auth/deviceService.js";

export async function POST(request, context) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await context.params;
    await connectDB();

    const device = await Device.findById(id);
    if (!device) {
      return NextResponse.json({ error: "Device record not found." }, { status: 404 });
    }

    const studentId = device.studentId || device.userId;
    await removeDevice(studentId, device.deviceId, auth.user._id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

