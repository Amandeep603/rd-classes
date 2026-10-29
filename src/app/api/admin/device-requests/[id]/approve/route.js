import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { approveDeviceRequest } from "@/server/auth/deviceService.js";

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));

    const mode = body.mode || "add"; // "replace" or "add"
    const replaceDeviceId = body.replaceDeviceId || null;

    const result = await approveDeviceRequest(
      id,
      { mode, replaceDeviceId },
      admin.user._id
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
