import { connection } from "next/server";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { User } from "@/server/db/models/User.js";
import PendingDeviceView from "@/components/portal/auth/PendingDeviceView";

export const instant = false;

export const metadata = {
  title: "Device Pending Approval | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PendingPage({ searchParams }) {
  await connection();
  const params = await searchParams;
  const deviceId = params?.deviceId;

  let request = null;
  let student = null;

  if (deviceId) {
    await connectDB();
    const rawReq = await DeviceRequest.findOne({ deviceId })
      .sort({ createdAt: -1 })
      .lean();

    if (rawReq) {
      request = JSON.parse(JSON.stringify(rawReq));
      const rawUser = await User.findById(rawReq.userId).lean();
      if (rawUser) {
        student = JSON.parse(JSON.stringify(rawUser));
      }
    }
  }

  return (
    <PendingDeviceView
      initialRequest={request}
      studentName={student?.name || "Student"}
      studentCode={student?.studentCode || ""}
    />
  );
}
