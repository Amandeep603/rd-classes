"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Shield,
  Smartphone,
  Trash2,
  RefreshCcw,
  LogOut,
  Key,
  BookOpen,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  updateStudentProfileAction,
  blockStudentAction,
  unblockStudentAction,
  resetStudentPasswordAction,
} from "@/server/actions/admin.students.actions.js";
import {
  removeDeviceAction,
  resetAllDevicesAction,
  setDeviceLimitAction,
  logoutAllSessionsAction,
} from "@/server/actions/admin.devices.actions.js";
import { enrollStudentAction, revokeEnrollmentAction } from "@/server/actions/admin.students.actions.js";

export default function StudentDetailView({
  student,
  devices = [],
  sessions = [],
  enrollments = [],
  recentActivity = [],
  allCourses = [],
}) {
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone || "");
  const [deviceLimit, setDeviceLimit] = useState(student.deviceLimit || 1);
  const [newPassword, setNewPassword] = useState("");
  const [revokeOnReset, setRevokeOnReset] = useState(true);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState("");
  const [msg, setMsg] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    await updateStudentProfileAction(student._id, null, fd);
    setMsg("Profile updated.");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    const fd = new FormData();
    fd.append("newPassword", newPassword);
    if (revokeOnReset) fd.append("revokeSessions", "on");
    await resetStudentPasswordAction(student._id, null, fd);
    setMsg("Password reset successfully.");
    setNewPassword("");
  };

  const handleLimitChange = async (e) => {
    const val = Number(e.target.value);
    setDeviceLimit(val);
    await setDeviceLimitAction(student._id, val);
    setMsg(`Device limit updated to ${val}.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Students List</span>
      </Link>

      {/* Header Info */}
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
            {student.status === "blocked" ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/60">
                Blocked
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            ID: <span className="text-[#FFB800]">{student.loginId}</span> • Phone: {student.phone || "None"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {student.status === "blocked" ? (
            <button
              onClick={() => unblockStudentAction(student._id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
            >
              Unblock Student
            </button>
          ) : (
            <button
              onClick={() => blockStudentAction(student._id)}
              className="px-4 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-bold rounded-xl transition"
            >
              Block Student
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Password */}
        <div className="space-y-6">
          {/* Edit Profile */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FFB800]" />
              <span>Edit Profile</span>
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-[#2B2B33] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-[#2B2B33] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#202028] hover:bg-[#282833] text-gray-200 font-bold rounded-xl border border-[#30303D]"
              >
                Save Profile
              </button>
            </form>
          </div>

          {/* Device Limit Setting */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FFB800]" />
              <span>Device Lock Settings</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Registered slots: <strong>{student.deviceCount} / {deviceLimit}</strong>
            </p>
            <div className="text-xs space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Device Limit Allowance</label>
                <select
                  value={deviceLimit}
                  onChange={handleLimitChange}
                  className="w-full bg-[#1A1A1E] border border-[#2B2B33] rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value={1}>1 Device (Default Lock)</option>
                  <option value={2}>2 Devices</option>
                  <option value={3}>3 Devices (Max)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => resetAllDevicesAction(student._id)}
                className="w-full py-2 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset All Devices (Lost Phone)</span>
              </button>
            </div>
          </div>

          {/* Reset Password */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FFB800]" />
              <span>Reset Password</span>
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <input
                  type="text"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-[#2B2B33] rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeOnReset}
                  onChange={(e) => setRevokeOnReset(e.target.checked)}
                  className="accent-[#FFB800]"
                />
                <span>Revoke existing sessions</span>
              </label>
              <button
                type="submit"
                className="w-full py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold rounded-xl"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (2 cols): Devices, Sessions, Enrollments, Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approved Devices */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#FFB800]" />
                <span>Registered Devices ({devices.length})</span>
              </h3>
            </div>

            {devices.length === 0 ? (
              <p className="text-xs text-gray-500 py-3">No approved devices yet.</p>
            ) : (
              <div className="space-y-2">
                {devices.map((d) => (
                  <div
                    key={d.deviceId}
                    className="p-3 bg-[#17171C] border border-[#222228] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{d.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Approved: {new Date(d.approvedAt).toLocaleDateString()} • IP: {d.ip || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDeviceAction(student._id, d.deviceId)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                      title="Remove device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Active Login Sessions ({sessions.length})</span>
              </h3>
              {sessions.length > 0 && (
                <button
                  onClick={() => logoutAllSessionsAction(student._id)}
                  className="text-xs text-red-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout All Sessions</span>
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No active sessions.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess._id}
                    className="p-2.5 bg-[#17171C] rounded-xl border border-[#222228] flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono text-gray-300">IP: {sess.ip || "—"}</span>
                      <span className="text-gray-500 text-[11px] ml-2">
                        Last seen: {new Date(sess.lastSeenAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Enrollments */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FFB800]" />
              <span>Enrolled Courses ({enrollments.length})</span>
            </h3>

            {enrollments.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Not enrolled in any course.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {enrollments.map((enr) => (
                  <div
                    key={enr._id}
                    className="p-3 bg-[#17171C] rounded-xl border border-[#222228] flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{enr.courseId?.title || "Untitled"}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Status: <span className="text-emerald-400">{enr.status}</span> •{" "}
                        {enr.expiresAt
                          ? `Expires: ${new Date(enr.expiresAt).toLocaleDateString()}`
                          : "Lifetime Access"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Recent Activity Log</span>
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No recorded audit events.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((log) => (
                  <div
                    key={log._id}
                    className="p-2.5 bg-[#17171C] rounded-xl text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-gray-200">{log.action}</span>
                      <span className="text-gray-500 text-[11px] ml-2">
                        by {log.actorId?.name || "System"}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {new Date(log.at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
