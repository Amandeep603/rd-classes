import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device, DeviceRequest, User } from "@/lib/models";

export async function GET(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const search = searchParams.get("search") || "";

    await connectDB();

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    // Query DeviceRequest collection
    const requests = await DeviceRequest.find(query)
      .populate({
        path: "studentId",
        select: "name loginId email phone maxDevices status deviceCount",
      })
      .sort({ lastAttemptAt: -1, createdAt: -1 })
      .lean();

    // Map each request and gather student IDs
    const studentIds = [];
    const mapped = requests.map((r) => {
      const student = r.studentId || r.userId;
      if (student && student._id) {
        studentIds.push(student._id);
      }
      return {
        ...r,
        student,
      };
    });

    // Fetch approved devices for these students to show side-by-side
    const approvedDevices = await Device.find({
      studentId: { $in: studentIds },
      status: "approved",
    }).lean();

    const approvedMap = {};
    for (const ad of approvedDevices) {
      const sId = (ad.studentId || ad.userId).toString();
      if (!approvedMap[sId]) approvedMap[sId] = [];
      approvedMap[sId].push(ad);
    }

    let results = mapped.map((item) => {
      const sId = item.student?._id ? item.student._id.toString() : null;
      return {
        ...item,
        currentApprovedDevices: sId ? approvedMap[sId] || [] : [],
      };
    });

    // Apply search filter
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      results = results.filter((item) => {
        const name = (item.student?.name || "").toLowerCase();
        const loginId = (item.student?.loginId || "").toLowerCase();
        const label = (item.label || "").toLowerCase();
        const model = (item.model || "").toLowerCase();
        return (
          name.includes(s) ||
          loginId.includes(s) ||
          label.includes(s) ||
          model.includes(s)
        );
      });
    }

    const pendingCount = await DeviceRequest.countDocuments({ status: "pending" });
    const approvedCount = await DeviceRequest.countDocuments({ status: "approved" });
    const rejectedCount = await DeviceRequest.countDocuments({ status: "rejected" });

    return NextResponse.json({
      requests: results,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
