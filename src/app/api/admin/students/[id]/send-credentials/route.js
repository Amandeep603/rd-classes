import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { resetAndEmailCredentials } from "@/server/services/studentAdminService.js";

export async function POST(request, { params }) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const credentials = await resetAndEmailCredentials({
      studentId: id,
      adminId: auth.user._id,
    });

    return NextResponse.json({
      success: true,
      credentials,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

