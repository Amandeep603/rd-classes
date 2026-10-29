import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    await requireAdmin();

    const sampleData = [
      {
        "Full Name": "Rahul Sharma",
        "Email Address": "rahul.sharma@example.com",
        "Phone Number": "9876543210",
      },
      {
        "Full Name": "Pooja Verma",
        "Email Address": "pooja.verma@example.com",
        "Phone Number": "9812345678",
      },
      {
        "Full Name": "Aman Deep",
        "Email Address": "aman.deep@example.com",
        "Phone Number": "9898989898",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="rd_classes_students_template.xlsx"',
      },
    });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
