import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { backupStudentsAndDependents } from "@/server/services/studentAdminService.js";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const backupResult = await backupStudentsAndDependents();
    return NextResponse.json(backupResult);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

