import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { Device } from "@/server/db/models/Device.js";
import PendingRequestsTable from "@/components/admin/PendingRequestsTable";
import { Smartphone, Filter } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Device Requests | RD Classes Admin",
};

export default async function DeviceRequestsPage({ searchParams }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const status = params?.status || "pending";

  await connectDB();
  const query = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const requests = await DeviceRequest.find(query)
    .populate("userId", "name loginId deviceCount deviceLimit")
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = requests.map((r) => r.userId?._id).filter(Boolean);
  const activeDevices = await Device.find({ userId: { $in: studentIds } }).lean();

  const activeDevicesMap = {};
  for (const d of activeDevices) {
    const sId = d.userId.toString();
    if (!activeDevicesMap[sId]) activeDevicesMap[sId] = [];
    activeDevicesMap[sId].push(d);
  }

  const serializedRequests = JSON.parse(JSON.stringify(requests));
  const serializedDevicesMap = JSON.parse(JSON.stringify(activeDevicesMap));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-[#FFB800]" />
            <span>Student Device Access Requests</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review and resolve student device approvals under the single-device security policy.
          </p>
        </div>

        {/* Filter links */}
        <div className="flex items-center gap-2 bg-[#131316] border border-[#222226] p-1 rounded-xl text-xs font-semibold">
          <Link
            href="/admin/device-requests?status=pending"
            className={`px-3 py-1.5 rounded-lg transition ${
              status === "pending"
                ? "bg-[#FFB800] text-[#0A0A0B]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pending
          </Link>
          <Link
            href="/admin/device-requests?status=approved"
            className={`px-3 py-1.5 rounded-lg transition ${
              status === "approved"
                ? "bg-[#FFB800] text-[#0A0A0B]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Approved
          </Link>
          <Link
            href="/admin/device-requests?status=rejected"
            className={`px-3 py-1.5 rounded-lg transition ${
              status === "rejected"
                ? "bg-[#FFB800] text-[#0A0A0B]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Rejected
          </Link>
          <Link
            href="/admin/device-requests?status=all"
            className={`px-3 py-1.5 rounded-lg transition ${
              status === "all"
                ? "bg-[#FFB800] text-[#0A0A0B]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All
          </Link>
        </div>
      </div>

      <PendingRequestsTable
        requests={serializedRequests}
        activeDevicesMap={serializedDevicesMap}
      />
    </div>
  );
}
