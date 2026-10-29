import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Device, User } from "@/lib/models";

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

    const devices = await Device.find(query)
      .populate({
        path: "studentId",
        select: "name loginId email phone maxDevices status",
      })
      .sort({ requestedAt: -1, createdAt: -1 })
      .lean();

    // Map each device and resolve student details
    const mapped = [];
    const studentIds = [];

    for (const d of devices) {
      const student = d.studentId || d.userId;
      if (student) {
        studentIds.push(student._id);
      }
      mapped.push({
        ...d,
        student,
      });
    }

    // Fetch approved devices for these students to show "already approved device"
    const approvedDevices = await Device.find({
      $or: [
        { studentId: { $in: studentIds } },
        { userId: { $in: studentIds } },
      ],
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

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      results = results.filter((item) => {
        const name = (item.student?.name || "").toLowerCase();
        const loginId = (item.student?.loginId || "").toLowerCase();
        const label = (item.deviceLabel || item.label || "").toLowerCase();
        return name.includes(s) || loginId.includes(s) || label.includes(s);
      });
    }

    const pendingCount = await Device.countDocuments({ status: "pending" });
    const approvedCount = await Device.countDocuments({ status: "approved" });
    const rejectedCount = await Device.countDocuments({ status: { $in: ["rejected", "revoked"] } });

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
