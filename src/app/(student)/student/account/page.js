import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Device } from "@/server/db/models/Device.js";
import ChangePasswordForm from "@/components/student/ChangePasswordForm";
import DeviceList from "@/components/student/DeviceList";
import { User, Phone, ShieldCheck, Hash } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "My Account & Security | RD Classes",
};

export default async function StudentAccountPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    redirect("/student/login");
  }

  const rawDevices = await Device.find({ userId: auth.user._id })
    .sort({ lastUsedAt: -1 })
    .lean();
  const devices = JSON.parse(JSON.stringify(rawDevices));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Security
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage your RD Classes portal credentials and view your registered single-device access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-[#131316] border border-[#222226] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] mb-4">
              <User className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white">{auth.user.name}</h2>
            <p className="text-xs text-[#FFB800] font-semibold mt-0.5">
              Enrolled Student
            </p>

            <div className="mt-5 space-y-3 text-xs border-t border-[#1F1F24] pt-4">
              <div>
                <span className="text-gray-400 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5 text-gray-500" />
                  <span>Login ID (Read-only)</span>
                </span>
                <span className="font-mono font-semibold text-white bg-[#1A1A1E] px-2.5 py-1 rounded-md border border-[#26262C] block">
                  {auth.user.loginId}
                </span>
              </div>

              {auth.user.phone && (
                <div>
                  <span className="text-gray-400 flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    <span>Registered Phone</span>
                  </span>
                  <span className="font-mono text-gray-200 block">
                    {auth.user.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1F1F24] flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Account Active & Secured</span>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>

      {/* Approved Devices List */}
      <DeviceList
        devices={devices}
        currentDeviceId={auth.session.deviceId}
        deviceLimit={auth.user.deviceLimit}
      />
    </div>
  );
}
