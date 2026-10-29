import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { resetStudentPassword } from "@/server/services/studentAdminService.js";

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await resetStudentPassword(id, admin.user._id);
    return NextResponse.json({ success: true, credentials: result });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
