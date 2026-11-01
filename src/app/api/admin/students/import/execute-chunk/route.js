import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { executeImportChunk } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { rows, courseId, sendEmail } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided for import chunk." },
        { status: 400 }
      );
    }

    // Limit to max 10 rows per chunk
    const chunk = rows.slice(0, 10);

    const result = await executeImportChunk({
      rows: chunk,
      courseId: courseId || null,
      sendEmail: sendEmail !== false,
      adminId: auth.user._id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

