"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  BookOpen,
  Activity,
  User,
  Key,
  Shield,
  Trash2,
  RefreshCcw,
  LogOut,
  Ban,
  CheckCircle2,
  Calendar,
  Copy,
  ExternalLink,
  MessageCircle,
  Mail,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Tabs from "../ui/Tabs";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import CopyButton from "../ui/CopyButton";
import {
  updateStudentProfileAction,
  blockStudentAction,
  unblockStudentAction,
  resetStudentPasswordAction,
  resetStudentPasswordAndEmailAction,
  enrollStudentAction,
  revokeEnrollmentAction,
} from "@/server/actions/admin.students.actions.js";
import {
  removeDeviceAction,
  resetAllDevicesAction,
  setDeviceLimitAction,
  logoutAllSessionsAction,
} from "@/server/actions/admin.devices.actions.js";

export default function PortalStudentDetailView({
  student,
  devices = [],
  sessions = [],
  enrollments = [],
  recentActivity = [],
  allCourses = [],
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // Profile edit
  const [name, setName] = useState(student.name || "");
  const [phone, setPhone] = useState(student.phone || "");
  const [email, setEmail] = useState(student.email || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Device limit
  const [deviceLimit, setDeviceLimit] = useState(student.deviceLimit || 1);
  const [updatingLimit, setUpdatingLimit] = useState(false);

  // Password reset dialog & success state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetPwd, setResetPwd] = useState("");
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  // Enroll course dialog
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [validityDate, setValidityDate] = useState(() => {
    const nextYear = new Date().getFullYear() + 1;
    return `${nextYear}-03-31`;
  });
  const [enrolling, setEnrolling] = useState(false);

  // Status actions
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("email", email);
    try {
      const res = await updateStudentProfileAction(student._id, null, fd);
      if (res?.success) {
        setProfileMsg("Profile updated successfully.");
      } else {
        setProfileMsg(res?.error || "Failed to update profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSetDeviceLimit = async (newLimit) => {
    setUpdatingLimit(true);
    try {
      await setDeviceLimitAction(student._id, Number(newLimit));
      setDeviceLimit(Number(newLimit));
    } finally {
      setUpdatingLimit(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwd || resetPwd.length < 6) return;
    setResetSubmitting(true);
    const fd = new FormData();
    fd.append("newPassword", resetPwd);
    if (revokeSessions) fd.append("revokeSessions", "on");

    try {
      const res = await resetStudentPasswordAction(student._id, null, fd);
      if (res?.success) {
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://rd-classes.in";
        const waMsg = `Hello ${student.name}, your RD Classes password has been updated. Login ID: ${student.loginId} | New Password: ${resetPwd} | Portal: ${siteUrl}/student/login`;
        setResetResult({
          password: resetPwd,
          whatsappMsg: waMsg,
        });
      }
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResetPasswordAndEmail = async () => {
    const studentEmail = email || student.email;
    if (!studentEmail) {
      alert("Student does not have an email address configured. Please enter an email in Edit Profile.");
      return;
    }
    if (!confirm(`Generate a new password and email credentials directly to ${studentEmail}?`)) {
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await resetStudentPasswordAndEmailAction(student._id, revokeSessions);
      if (res?.success) {
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://rd-classes.in";
        const waMsg = `Hello ${student.name}, your RD Classes password has been updated. Login ID: ${student.loginId} | New Password: ${res.newPassword} | Portal: ${siteUrl}/student/login`;
        setResetResult({
          password: res.newPassword,
          whatsappMsg: waMsg,
          emailedTo: studentEmail,
        });
        setShowPasswordModal(true);
      } else {
        alert(res?.error || "Failed to reset password and email.");
      }
    } catch (err) {
      alert(err?.message || "An unexpected error occurred.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleBlockToggle = async () => {
    setActionLoading(true);
    try {
      if (student.status === "blocked") {
        await unblockStudentAction(student._id);
      } else {
        await blockStudentAction(student._id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to log out all active sessions for this student?")) return;
    setActionLoading(true);
    try {
      await logoutAllSessionsAction(student._id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAllDevices = async () => {
    if (!confirm("Remove all approved devices? The student will register their next device on next login.")) return;
    setActionLoading(true);
    try {
      await resetAllDevicesAction(student._id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm("Remove this device from student approval?")) return;
    try {
      await removeDeviceAction(student._id, deviceId);
    } catch (err) {
      alert(err.message || "Failed to remove device.");
    }
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourseId) return;
    setEnrolling(true);
    try {
      await enrollStudentAction(student._id, selectedCourseId, validityDate ? new Date(validityDate) : null);
      setShowEnrollModal(false);
      setSelectedCourseId("");
    } finally {
      setEnrolling(false);
    }
  };

  const handleRevokeEnrollment = async (enrollmentId) => {
    if (!confirm("Revoke access to this course?")) return;
    try {
      await revokeEnrollmentAction(enrollmentId, student._id);
    } catch (err) {
      alert(err.message || "Failed to revoke enrollment.");
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { key: "devices", label: `Devices (${devices.length}/${deviceLimit})`, icon: <Smartphone className="w-4 h-4" /> },
    { key: "courses", label: `Courses (${enrollments.length})`, icon: <BookOpen className="w-4 h-4" /> },
    { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="portal-page-container">
      {/* Top back link */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--portal-text-muted)] hover:text-[var(--portal-text-main)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Students List</span>
      </Link>

      {/* Header Profile Card */}
      <Card className="mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">{student.name}</h1>
                {student.studentCode && (
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] text-[var(--portal-text-muted)]">
                    {student.studentCode}
                  </span>
                )}
                {student.status === "blocked" ? (
                  <Badge tone="red">Blocked</Badge>
                ) : (
                  <Badge tone="green">Active</Badge>
                )}
              </div>
              <p className="text-sm text-[var(--portal-text-muted)] mt-1 flex items-center gap-3">
                <span>Login ID: <strong className="font-mono text-[var(--portal-text-main)]">{student.loginId}</strong></span>
                <span>•</span>
                <span>Class: <strong>{student.className || "12"}</strong></span>
                {student.school && (
                  <>
                    <span>•</span>
                    <span>{student.school}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResetPwd(Math.random().toString(36).slice(-8) + "!");
                setResetResult(null);
                setShowPasswordModal(true);
              }}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </Button>

            <Button
              variant="yellow"
              size="sm"
              onClick={handleResetPasswordAndEmail}
              disabled={resetSubmitting}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Reset password &amp; email</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAll}
              disabled={actionLoading}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out All</span>
            </Button>

            <Button
              variant={student.status === "blocked" ? "soft-green" : "soft-red"}
              size="sm"
              onClick={handleBlockToggle}
              disabled={actionLoading}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{student.status === "blocked" ? "Unblock Student" : "Block Student"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs bar */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-base font-bold text-[var(--portal-text-main)] mb-4">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="portal-input"
                  required
                />
              </FormField>

              <FormField label="Phone Number (WhatsApp)">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="portal-input"
                  placeholder="9876543210"
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="portal-input"
                  placeholder="student@example.com"
                />
              </FormField>

              {profileMsg && (
                <p className="text-xs font-semibold text-[var(--portal-text-main)]">{profileMsg}</p>
              )}

              <Button type="submit" variant="yellow" size="sm" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-bold text-[var(--portal-text-main)] mb-4">Account Metadata</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[var(--portal-card-border)]">
                <span className="text-[var(--portal-text-muted)]">Login ID</span>
                <span className="font-mono font-bold text-[var(--portal-text-main)]">{student.loginId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--portal-card-border)]">
                <span className="text-[var(--portal-text-muted)]">Student Code</span>
                <span className="font-mono font-bold text-[var(--portal-text-main)]">{student.studentCode || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--portal-card-border)]">
                <span className="text-[var(--portal-text-muted)]">Last Login</span>
                <span className="text-[var(--portal-text-main)]">
                  {student.lastLoginAt
                    ? new Date(student.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                    : "Never logged in"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--portal-card-border)]">
                <span className="text-[var(--portal-text-muted)]">Active Sessions</span>
                <span className="font-bold text-[var(--portal-text-main)]">{sessions.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--portal-text-muted)]">Single-Device Lock</span>
                <Badge tone="yellow">Strict 1-Device</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Devices */}
      {activeTab === "devices" && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-[var(--portal-text-main)]">Approved Devices</h2>
              <p className="text-xs text-[var(--portal-text-muted)] mt-1">
                Currently using {devices.length} of {deviceLimit} allowed slot(s).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--portal-text-muted)]">Max Slots:</span>
                <select
                  value={deviceLimit}
                  onChange={(e) => handleSetDeviceLimit(e.target.value)}
                  disabled={updatingLimit}
                  className="portal-input !w-auto !py-1 !text-xs font-bold"
                >
                  <option value={1}>1 Device (Standard)</option>
                  <option value={2}>2 Devices</option>
                  <option value={3}>3 Devices</option>
                </select>
              </div>
              {devices.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleResetAllDevices}>
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </Button>
              )}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-10 bg-[var(--portal-bg-page)] rounded-xl border border-dashed border-[var(--portal-card-border)]">
              <Smartphone className="w-8 h-8 mx-auto text-[var(--portal-text-muted)] mb-2" />
              <p className="text-sm font-semibold text-[var(--portal-text-main)]">No approved devices yet</p>
              <p className="text-xs text-[var(--portal-text-muted)] mt-1 max-w-sm mx-auto">
                The student&apos;s first logged in device will be automatically paired and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((dev) => (
                <div
                  key={dev._id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--portal-tint-blue-bg)] border border-[var(--portal-tint-blue-border)] flex items-center justify-center text-[var(--portal-tint-blue-icon)]">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--portal-text-main)]">{dev.label || "Approved Device"}</p>
                      <p className="text-xs text-[var(--portal-text-muted)] mt-0.5">
                        First used: {new Date(dev.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                        {dev.lastUsedAt && (
                          <> • Last active: {new Date(dev.lastUsedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="soft-red"
                    size="sm"
                    onClick={() => handleRemoveDevice(dev.deviceId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Courses */}
      {activeTab === "courses" && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-[var(--portal-text-main)]">Course Enrollments</h2>
              <p className="text-xs text-[var(--portal-text-muted)] mt-1">
                Courses this student is authorized to stream.
              </p>
            </div>
            <Button variant="yellow" size="sm" onClick={() => setShowEnrollModal(true)}>
              + Assign Course
            </Button>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-10 bg-[var(--portal-bg-page)] rounded-xl border border-dashed border-[var(--portal-card-border)]">
              <BookOpen className="w-8 h-8 mx-auto text-[var(--portal-text-muted)] mb-2" />
              <p className="text-sm font-semibold text-[var(--portal-text-main)]">No active enrollments</p>
              <p className="text-xs text-[var(--portal-text-muted)] mt-1">Assign a course to grant student access.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enr) => (
                <div
                  key={enr._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)]"
                >
                  <div>
                    <h3 className="text-sm font-bold text-[var(--portal-text-main)]">
                      {enr.courseId?.title || "Untitled Course"}
                    </h3>
                    <p className="text-xs text-[var(--portal-text-muted)] mt-1 flex flex-wrap items-center gap-3">
                      <span>Status: <strong className="capitalize text-emerald-600 font-semibold">{enr.status}</strong></span>
                      <span>•</span>
                      <span>
                        Valid until: <strong>
                          {enr.expiresAt
                            ? new Date(enr.expiresAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                            : "Lifetime"}
                        </strong>
                      </span>
                      {enr.paymentNote?.amount && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold">
                            Fee: ₹{enr.paymentNote.amount} ({enr.paymentNote.mode || "WhatsApp"})
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <Button
                    variant="soft-red"
                    size="sm"
                    onClick={() => handleRevokeEnrollment(enr._id)}
                  >
                    Revoke Access
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Activity */}
      {activeTab === "activity" && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-[var(--portal-text-main)] mb-4">Security & Audit History</h2>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-[var(--portal-text-muted)] py-4">No logged activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-lg bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] text-xs flex items-center justify-between"
                >
                  <div>
                    <strong className="font-semibold text-[var(--portal-text-main)] font-mono">{log.action}</strong>
                    <span className="text-[var(--portal-text-muted)] ml-2">
                      by {log.actorId?.name || "System"}
                    </span>
                  </div>
                  <span className="text-[var(--portal-text-muted)]">
                    {new Date(log.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Password Reset Modal */}
      <Dialog
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Student Password"
        description={`Set a new temporary password for ${student.name}.`}
      >
        {resetResult ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div className="flex items-center justify-between font-bold text-sm text-emerald-800 mb-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Successfully</span>
                </div>
                {resetResult.emailedTo && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Emailed to {resetResult.emailedTo}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-700">
                Shown once only. Provide these credentials to the student:
              </p>
              <div className="mt-3 flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-200">
                <span className="font-mono text-sm font-bold text-emerald-900">{resetResult.password}</span>
                <CopyButton text={resetResult.password} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)]">
              <p className="text-xs text-[var(--portal-text-muted)] mb-2 font-semibold">Prefilled WhatsApp message:</p>
              <p className="text-xs text-[var(--portal-text-main)] font-mono bg-white p-2.5 rounded-lg border border-[var(--portal-card-border)] select-all mb-3">
                {resetResult.whatsappMsg}
              </p>
              {student.phone ? (
                <a
                  href={`https://wa.me/91${student.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(resetResult.whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send to Student on WhatsApp</span>
                </a>
              ) : (
                <CopyButton text={resetResult.whatsappMsg} className="w-full !justify-center" />
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <FormField label="New Password" required hint="Must be at least 6 characters.">
              <input
                type="text"
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                className="portal-input font-mono"
                required
              />
            </FormField>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--portal-text-muted)]">
              <input
                type="checkbox"
                checked={revokeSessions}
                onChange={(e) => setRevokeSessions(e.target.checked)}
                className="rounded accent-[var(--portal-accent-yellow)]"
              />
              <span>Log out student from all active sessions immediately</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="yellow" size="sm" disabled={resetSubmitting}>
                {resetSubmitting ? "Resetting..." : "Confirm Reset"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Enroll Course Modal */}
      <Dialog
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Assign Course"
        description={`Grant ${student.name} access to a course.`}
      >
        <div className="space-y-4 pt-2">
          <FormField label="Select Course" required>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="portal-input"
            >
              <option value="">-- Choose Course --</option>
              {allCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Access Validity Date" hint="Default is end of current academic year.">
            <input
              type="date"
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              className="portal-input"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowEnrollModal(false)}>
              Cancel
            </Button>
            <Button
              variant="yellow"
              size="sm"
              disabled={!selectedCourseId || enrolling}
              onClick={handleEnrollCourse}
            >
              {enrolling ? "Assigning..." : "Assign Course"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
