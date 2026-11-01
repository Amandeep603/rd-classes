import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { dryRunDeleteAllStudents } from "@/server/services/studentAdminService.js";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const report = await dryRunDeleteAllStudents();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

