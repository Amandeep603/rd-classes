import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { executeImport } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { validRows, courseId } = body;

    if (!Array.isArray(validRows) || validRows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows provided for import." },
        { status: 400 }
      );
    }

    const credentials = await executeImport({
      validRows,
      courseId: courseId || null,
      adminId: admin.user._id,
    });

    const { createAdminNotification } = await import("@/server/services/notificationService.js");
    await createAdminNotification({
      type: "student_import",
      title: "Students Imported",
      message: `Successfully imported ${credentials.length} student${credentials.length === 1 ? "" : "s"} from Excel.`,
      link: "/admin/students",
      entityId: null,
    });

    return NextResponse.json({
      success: true,
      importedCount: credentials.length,
      credentials,
    });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
