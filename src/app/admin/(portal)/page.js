import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { User } from "@/server/db/models/User.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { Device } from "@/server/db/models/Device.js";
import { Session } from "@/server/db/models/Session.js";
import { Course } from "@/server/db/models/Course.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import StatsOverview from "@/components/admin/StatsOverview";
import PendingRequestsTable from "@/components/admin/PendingRequestsTable";
import { Smartphone, ArrowRight } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Admin Dashboard | RD Classes",
};

export default async function AdminDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  await connectDB();

  const [
    studentsCount,
    pendingRequestsCount,
    activeSessionsCount,
    coursesCount,
    lecturesCount,
    pendingRequests,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    DeviceRequest.countDocuments({ status: "pending" }),
    Session.countDocuments(),
    Course.countDocuments({ published: true }),
    Lecture.countDocuments({ published: true }),
    DeviceRequest.find({ status: "pending" })
      .populate("userId", "name loginId deviceCount deviceLimit")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  // Load active devices map for pending students
  const studentIds = pendingRequests.map((r) => r.userId?._id).filter(Boolean);
  const activeDevices = await Device.find({ userId: { $in: studentIds } }).lean();

  const activeDevicesMap = {};
  for (const d of activeDevices) {
    const sId = d.userId.toString();
    if (!activeDevicesMap[sId]) activeDevicesMap[sId] = [];
    activeDevicesMap[sId].push(d);
  }

  const serializedRequests = JSON.parse(JSON.stringify(pendingRequests));
  const serializedDevicesMap = JSON.parse(JSON.stringify(activeDevicesMap));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Overview of active students, single-device access authorizations, and course lectures.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-10">
        <StatsOverview
          stats={{
            studentsCount,
            pendingRequestsCount,
            activeSessionsCount,
            coursesCount,
            lecturesCount,
          }}
        />
      </div>

      {/* Latest Pending Device Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#FFB800]" />
            <span>Latest Pending Device Requests</span>
          </h2>

          <Link
            href="/admin/device-requests"
            className="text-xs font-semibold text-[#FFB800] hover:underline flex items-center gap-1"
          >
            <span>View All ({pendingRequestsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <PendingRequestsTable
          requests={serializedRequests}
          activeDevicesMap={serializedDevicesMap}
        />
      </div>
    </div>
  );
}
