import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Device } from "@/server/db/models/Device.js";
import { User } from "@/server/db/models/User.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Settings as Setting } from "@/server/db/models/Settings.js";
import { logoutStudentAction } from "@/server/actions/auth.actions.js";
import {
  User as UserIcon,
  Mail,
  Phone,
  Smartphone,
  ShieldCheck,
  Hash,
  GraduationCap,
  MessageCircle,
  LogOut,
  BookOpen,
  Sparkles,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "My Profile | RD Classes Student Portal",
};

export default async function StudentProfilePage() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();
  const now = new Date();

  const [user, devices, enrollments, setting] = await Promise.all([
    User.findById(auth.user._id).lean(),
    Device.find({
      $or: [{ userId: auth.user._id }, { studentId: auth.user._id }],
    })
      .sort({ updatedAt: -1 })
      .lean(),
    Enrollment.find({
      userId: auth.user._id,
      status: "active",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate("courseId", "title slug classLabel category")
      .lean(),
    Setting.findOne().lean(),
  ]);

  const whatsappPhone =
    setting?.whatsappNumber || setting?.whatsapp || "918368545620";
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hello RD Classes, I would like to request assistance regarding my student account.\nName: ${user.name} (${user.loginId})`
  )}`;

  const activeCourses = enrollments
    .map((e) => ({
      ...e.courseId,
      expiresAt: e.expiresAt,
    }))
    .filter(Boolean);

  const approvedDevice = devices.find((d) => d.status === "approved") || devices[0] || null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Student Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            Your enrolled courses and single-device access status
          </p>
        </div>

        {/* Logout Button */}
        <form action={logoutStudentAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 px-4 py-2 text-xs font-bold text-red-700 transition-colors shadow-2xs active:scale-98 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-600" />
            <span>Logout</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Read-Only Profile Card (Name, email, phone, login ID) */}
        <div className="md:col-span-6 space-y-6">
          <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-black/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-900 font-extrabold text-2xl shadow-xs">
                {user.name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-[#111827] truncate">
                  {user.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                    Class {user.className || "12"}
                  </span>
                  <span className="text-xs text-[#6B7280]">Accountancy Student</span>
                </div>
              </div>
            </div>

            {/* Read-Only Fields */}
            <div className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-[#9CA3AF]" />
                  Full Name
                </span>
                <span className="font-bold text-[#111827]">{user.name}</span>
              </div>

              {/* Email */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#9CA3AF]" />
                  Email
                </span>
                <span className="font-mono text-[#111827] truncate max-w-[200px]">
                  {user.email || "—"}
                </span>
              </div>

              {/* Phone */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#9CA3AF]" />
                  Phone Number
                </span>
                <span className="font-mono text-[#111827]">
                  {user.phone || "—"}
                </span>
              </div>

              {/* Login ID */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#6B7280] flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#9CA3AF]" />
                  Login ID
                </span>
                <span className="font-mono font-bold text-[#111827] bg-neutral-100 px-2.5 py-1 rounded-lg">
                  {user.loginId}
                </span>
              </div>


            </div>

            <div className="pt-3 border-t border-black/5 text-[11px] text-[#6B7280]">
              Personal details and password cannot be modified directly in the student portal. To update, contact Sir.
            </div>
          </div>
        </div>

        {/* Approved Device Card */}
        <div className="md:col-span-6 space-y-6">
          <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/60 text-[#D97706]">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#111827]">
                  Approved Device
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Approved &amp; Active</span>
                </span>
              </div>
            </div>

            {/* Approved Device Info */}
            <div className="rounded-2xl bg-neutral-50 p-4 border border-black/5 space-y-2">
              <div className="text-xs font-bold text-[#111827]">
                {approvedDevice?.deviceName || approvedDevice?.label || "Primary Device"}
              </div>
              <div className="text-[11px] font-mono text-[#6B7280] break-all">
                Device ID: {approvedDevice?.deviceId || auth.session.deviceId}
              </div>
              {approvedDevice?.lastUsedAt && (
                <div className="text-[11px] text-[#6B7280]">
                  Last active: {new Date(approvedDevice.lastUsedAt).toLocaleDateString("en-IN")}
                </div>
              )}
            </div>

            {/* Required Note */}
            <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/70 text-xs text-amber-900 leading-relaxed space-y-2">
              <p className="font-semibold">
                Your account works on one approved device. To use another device, contact RD Classes.
              </p>
              <p className="text-[11px] text-amber-800/90">
                If you change your laptop or phone, message Sir on WhatsApp to authorize the new device.
              </p>
            </div>

            <div className="pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-2xs transition-colors"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Contact RD Classes on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-extrabold text-[#111827]">
            Enrolled Courses ({activeCourses.length})
          </h2>
        </div>

        {activeCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {activeCourses.map((course) => {
              const expiryStr = course.expiresAt
                ? new Date(course.expiresAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Full Academic Year";

              return (
                <div
                  key={course._id}
                  className="rounded-2xl border border-black/5 bg-neutral-50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {course.classLabel || "Class 12"}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#111827]">
                    {course.title}
                  </h3>

                  <div className="text-[11px] text-[#6B7280]">
                    Validity: {expiryStr}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#6B7280]">
            No enrolled courses currently active.
          </div>
        )}
      </div>
    </div>
  );
}
