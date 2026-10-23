import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { Device } from "@/server/db/models/Device.js";
import PortalDeviceRequestsView from "@/components/portal/admin/PortalDeviceRequestsView.jsx";

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
    .populate("userId", "name loginId studentCode deviceCount deviceLimit")
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
    <PortalDeviceRequestsView
      requests={serializedRequests}
      activeDevicesMap={serializedDevicesMap}
      currentStatus={status}
    />
  );
}

