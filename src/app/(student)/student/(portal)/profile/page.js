import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Device } from "@/server/db/models/Device.js";
import { User } from "@/server/db/models/User.js";

import {
  User as UserIcon,
  Phone,
  Smartphone,
  ShieldCheck,
  Hash,
  GraduationCap,
  School,
  MessageCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

export const instant = false;

export const metadata = {
  title: "My Profile & Devices | RD Classes Student Portal",
};

export default async function StudentProfilePage() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();

  const [user, devices] = await Promise.all([
    User.findById(auth.user._id).lean(),
    Device.find({ userId: auth.user._id }).sort({ lastUsedAt: -1 }).lean(),
  ]);

  const currentDeviceId = auth.session.deviceId;

  const whatsappPhone =
    SITE_CONFIG?.contact?.whatsapp?.replace(/\D/g, "") || "919999999999";
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Hello Sir, I want to change or update my password or approved device for the RD Classes portal.\nStudent: ${user.name} (${user.studentCode || user.loginId})`
  )}`;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          My Profile & Security
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          View your student credentials, manage password and review your single-device registration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Details Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-black/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-900 font-extrabold text-2xl shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">
                  {user.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    Class {user.className || "12"}
                  </span>
                  <span className="text-xs text-[#6B7280]">Student</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#9CA3AF]" />
                  Student Code
                </span>
                <span className="font-mono font-bold text-[#111827] bg-neutral-100 px-2.5 py-1 rounded-lg">
                  {user.studentCode || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-[#9CA3AF]" />
                  Login ID
                </span>
                <span className="font-mono font-semibold text-[#111827]">
                  {user.loginId}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#9CA3AF]" />
                  Academic Class
                </span>
                <span className="font-bold text-[#111827]">
                  Class {user.className || "12"} Accountancy
                </span>
              </div>

              {user.school && (
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                    <School className="h-4 w-4 text-[#9CA3AF]" />
                    School
                  </span>
                  <span className="font-medium text-[#111827] text-right truncate max-w-[180px]">
                    {user.school}
                  </span>
                </div>
              )}

              {user.phone && (
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#9CA3AF]" />
                    Phone Number
                  </span>
                  <span className="font-mono text-[#111827]">{user.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-black/5 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span>Single-Device Lock Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Account Security & Contact Sir */}
        <div className="lg:col-span-7">
          <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/60 text-[#D97706]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">
                  Account Security
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Your credentials and authorized devices are managed by faculty
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8FAF7] border border-black/5 p-4 sm:p-5 space-y-3">
              <p className="text-sm font-semibold text-[#1F2937]">
                To change your password or device, contact Sir
              </p>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                For security and single-device protection, all student credentials and device approvals are maintained directly by Ronak Sir. If you lost access, changed phones, or need assistance, message Sir on WhatsApp.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  <span>Contact Sir on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Devices Section */}
      <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">
              Approved Devices ({devices.length}/{user.deviceLimit || 1})
            </h2>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              To protect lecture access, your account works only on approved devices.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            <span>To change your device, contact Sir</span>
          </a>
        </div>

        <div className="space-y-3">
          {devices.map((device) => {
            const isThisDevice = device.deviceId === currentDeviceId;
            const lastUsedStr = device.lastUsedAt
              ? new Date(device.lastUsedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })
              : "Recently";

            return (
              <div
                key={device._id}
                className={`flex items-center justify-between gap-4 rounded-2xl p-4 border transition-all ${
                  isThisDevice
                    ? "bg-amber-50/50 border-amber-200/80 shadow-2xs"
                    : "bg-neutral-50/60 border-black/5"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                      isThisDevice
                        ? "bg-[#FFC21A] text-neutral-900"
                        : "bg-neutral-200 text-[#6B7280]"
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#111827]">
                        {device.label || "Browser Device"}
                      </span>
                      {isThisDevice && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          This Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {lastUsedStr}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Approved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
