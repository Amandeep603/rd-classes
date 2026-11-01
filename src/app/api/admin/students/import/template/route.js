import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import * as XLSX from "xlsx";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const sampleData = [
      {
        "Serial Number": 1,
        "Name": "Rahul Sharma",
        "Email ID": "rahul.sharma@gmail.com",
        "Phone Number": "9811122334",
        "Batch": "4-5",
      },
      {
        "Serial Number": 2,
        "Name": "Priya Gupta",
        "Email ID": "priya.gupta@gmail.com",
        "Phone Number": "9876543210",
        "Batch": "5-6",
      },
      {
        "Serial Number": 3,
        "Name": "Amit Kumar",
        "Email ID": "amit.kumar@gmail.com",
        "Phone Number": "9898989898",
        "Batch": "4-5",
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
