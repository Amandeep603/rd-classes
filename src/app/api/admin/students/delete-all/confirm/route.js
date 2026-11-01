import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { executeDeleteAllStudents } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { confirmationText, adminPassword } = body;

    const result = await executeDeleteAllStudents({
      adminId: auth.user._id,
      confirmationText,
      adminPassword,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

