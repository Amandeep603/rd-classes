import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { executeImportChunk } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { validRows, courseId, sendEmail } = body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows provided for import." },
        { status: 400 }
      );
    }

    const result = await executeImportChunk({
      rows: validRows.slice(0, 10),
      courseId: courseId || null,
      sendEmail: sendEmail !== false,
      adminId: auth.user._id,
    });

    return NextResponse.json({
      success: true,
      importedCount: result.results.length,
      credentials: result.results,
      skipped: result.skipped,
      emailInterrupted: result.emailInterrupted,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
