import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { reconsiderDeviceRequest } from "@/server/auth/deviceService.js";

export async function POST(request, { params }) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authenticated) return auth.response;

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await reconsiderDeviceRequest(
      id,
      auth.user._id,
      auth.user.name || "Admin"
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

