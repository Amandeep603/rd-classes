import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { approveDeviceRequest } from "@/server/auth/deviceService.js";

export async function POST(request, { params }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authenticated) return auth.response;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));

    const mode = body.mode || "additional"; // "additional" | "replace" | "same_device"
    const replaceDeviceId = body.replaceDeviceId || null;
    const targetDeviceId = body.targetDeviceId || null;

    const result = await approveDeviceRequest(
      id,
      { mode, replaceDeviceId, targetDeviceId },
      auth.user._id,
      auth.user.name || "Admin"
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
