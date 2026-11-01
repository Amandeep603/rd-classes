import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { bulkResetAndEmailCredentials } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "No student IDs provided." },
        { status: 400 }
      );
    }

    // Limit to max 5 students per request to comfortably fit serverless execution limits
    const chunk = studentIds.slice(0, 5);

    const result = await bulkResetAndEmailCredentials({
      studentIds: chunk,
      adminId: auth.user._id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

