import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User, Enrollment } from "@/lib/models";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const students = await User.find({ role: "student" })
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);
    const enrollments = await Enrollment.find({
      $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
    })
      .populate("courseId", "title")
      .lean();

    const courseMap = {};
    for (const e of enrollments) {
      const sId = (e.studentId || e.userId).toString();
      if (!courseMap[sId]) courseMap[sId] = [];
      if (e.courseId?.title) courseMap[sId].push(e.courseId.title);
    }

    const headers = [
      "Login ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Allowed Devices",
      "Enrolled Courses",
      "Created At",
    ];

    const rows = students.map((s) => {
      const sId = s._id.toString();
      const coursesStr = (courseMap[sId] || []).join("; ");
      const createdStr = s.createdAt
        ? new Date(s.createdAt).toISOString().split("T")[0]
        : "";

      return [
        `"${s.loginId || ""}"`,
        `"${(s.name || "").replace(/"/g, '""')}"`,
        `"${s.email || ""}"`,
        `"${s.phone || ""}"`,
        `"${s.status || "active"}"`,
        `"${s.maxDevices || 1}"`,
        `"${coursesStr.replace(/"/g, '""')}"`,
        `"${createdStr}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rd_classes_students.csv"',
      },
    });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
