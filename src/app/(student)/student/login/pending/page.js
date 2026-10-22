import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import PendingDeviceCard from "@/components/student/PendingDeviceCard";

export const instant = false;

export const metadata = {
  title: "Device Pending Approval | RD Classes",
};

export default async function PendingPage({ searchParams }) {
  const params = await searchParams;
  const deviceId = params?.deviceId;

  let request = null;
  if (deviceId) {
    await connectDB();
    request = await DeviceRequest.findOne({ deviceId, status: "pending" })
      .sort({ createdAt: -1 })
      .lean();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0C]">
      <PendingDeviceCard
        deviceLabel={request?.label || "This Browser Device"}
        requestTime={request?.createdAt || new Date()}
      />
    </div>
  );
}
