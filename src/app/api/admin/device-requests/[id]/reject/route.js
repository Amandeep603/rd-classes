import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { rejectDeviceRequest } from "@/server/auth/deviceService.js";

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));

    const note = body.note || "";
    const result = await rejectDeviceRequest(id, note, admin.user._id);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
