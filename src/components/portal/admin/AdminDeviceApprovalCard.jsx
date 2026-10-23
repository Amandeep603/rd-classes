"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  Check,
  X,
  Clock,
  MoreVertical,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import {
  approveDeviceRequestAction,
  rejectDeviceRequestAction,
} from "@/server/actions/admin.devices.actions.js";

export default function AdminDeviceApprovalCard({
  requests = [],
  activeDevicesMap = {},
}) {
  const [selectedForApprove, setSelectedForApprove] = useState(null);
  const [selectedForReject, setSelectedForReject] = useState(null);

  // Approval form state
  const [approveMode, setApproveMode] = useState("add"); // "add" | "replace" | "raise-and-add"
  const [replaceDeviceId, setReplaceDeviceId] = useState("");
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [approveError, setApproveError] = useState("");

  // Reject form state
  const [rejectNote, setRejectNote] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const openApproveModal = (req) => {
    setSelectedForApprove(req);
    setApproveError("");
    const student = req.userId;
    const isLimitReached =
      student && student.deviceCount >= student.deviceLimit;
    const studentDevices = activeDevicesMap[student?._id] || [];

    if (isLimitReached) {
      setApproveMode("replace");
      setReplaceDeviceId(studentDevices[0]?.deviceId || "");
    } else {
      setApproveMode("add");
    }
  };

  const handleApproveSubmit = async () => {
    if (!selectedForApprove) return;
    setSubmittingApprove(true);
    setApproveError("");

    const fd = new FormData();
    fd.append("mode", approveMode);
    if (approveMode === "replace") {
      fd.append("replaceDeviceId", replaceDeviceId);
    }

    try {
      const res = await approveDeviceRequestAction(selectedForApprove._id, fd);
      if (res?.success) {
        setSelectedForApprove(null);
      } else {
        setApproveError(res?.error || "Failed to approve request.");
      }
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedForReject) return;
    setSubmittingReject(true);

    const fd = new FormData();
    fd.append("note", rejectNote);

    try {
      const res = await rejectDeviceRequestAction(selectedForReject._id, fd);
      if (res?.success) {
        setSelectedForReject(null);
        setRejectNote("");
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  const [mountedTime, setMountedTime] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setMountedTime(Date.now());
    });
  }, []);


  const formatTimeAgo = (date) => {
    if (!date) return "";
    if (!mountedTime) return "recently";
    const ms = mountedTime - new Date(date).getTime();
    const mins = Math.floor(ms / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };


  const pendingList = requests.slice(0, 3);

  return (
    <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-2xs">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#111827]">
              Device Approval Requests
            </h2>
            <p className="text-xs text-[#6B7280]">
              Students requesting to pair an unapproved phone or computer.
            </p>
          </div>
        </div>

        <Link
          href="/admin/device-requests"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      {pendingList.length > 0 ? (
        <div className="space-y-4">
          {pendingList.map((req) => {
            const student = req.userId;
            const initials = student?.name
              ? student.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "ST";

            const timeAgo = formatTimeAgo(req.createdAt);

            return (
              <div
                key={req._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black/5 bg-neutral-50/70 p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Initials Avatar */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-[#78350F] font-bold text-sm shrink-0 shadow-2xs">
                    {initials}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#111827]">
                        {student?.name || "Student"}
                      </span>
                      {student?.studentCode && (
                        <span className="rounded-md bg-white border border-black/8 px-1.5 py-0.2 text-[10px] font-bold text-[#6B7280]">
                          {student.studentCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap">
                      <Smartphone className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                      <span className="font-medium text-[#374151]">
                        {req.label || "Browser Device"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>

                    {req.studentNote && (
                      <p className="text-xs italic text-[#4B5563] pt-0.5 line-clamp-1">
                        &ldquo;{req.studentNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openApproveModal(req)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition-colors shadow-2xs"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedForReject(req);
                      setRejectNote("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-200 px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-red-100 hover:text-red-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Reject</span>
                  </button>

                  {student?._id && (
                    <Link
                      href={`/admin/students/${student._id}`}
                      className="rounded-xl p-1.5 text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5"
                      aria-label="Student details"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-[#6B7280]">
          No pending device requests at this time. All clear!
        </div>
      )}

      {/* APPROVE MODAL */}
      {selectedForApprove && (
        <Dialog
          isOpen={Boolean(selectedForApprove)}
          onClose={() => setSelectedForApprove(null)}
          title="Approve Device Request"
          description={`Student: ${selectedForApprove.userId?.name} (${selectedForApprove.userId?.loginId})`}
        >
          {approveError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              {approveError}
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-3 text-xs text-[#374151] border border-black/5">
              <div>
                <strong>Device to pair:</strong> {selectedForApprove.label}
              </div>
              {selectedForApprove.studentNote && (
                <div className="mt-1 italic text-[#6B7280]">
                  Student note: &ldquo;{selectedForApprove.studentNote}&rdquo;
                </div>
              )}
            </div>

            {/* Mode selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#374151]">
                Approval Strategy
              </label>

              {/* Option A: Add new device */}
              <label
                className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer transition-colors ${
                  approveMode === "add"
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-white border-black/10"
                }`}
              >
                <input
                  type="radio"
                  name="approveMode"
                  value="add"
                  checked={approveMode === "add"}
                  onChange={() => setApproveMode("add")}
                  className="mt-0.5 text-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#111827]">
                    Add as additional device
                  </div>
                  <div className="text-[#6B7280]">
                    Current slots: {selectedForApprove.userId?.deviceCount || 0} /{" "}
                    {selectedForApprove.userId?.deviceLimit || 1}
                  </div>
                </div>
              </label>

              {/* Option B: Replace existing */}
              <label
                className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer transition-colors ${
                  approveMode === "replace"
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-white border-black/10"
                }`}
              >
                <input
                  type="radio"
                  name="approveMode"
                  value="replace"
                  checked={approveMode === "replace"}
                  onChange={() => setApproveMode("replace")}
                  className="mt-0.5 text-amber-500"
                />
                <div className="text-xs flex-1">
                  <div className="font-bold text-[#111827]">
                    Replace an existing device
                  </div>
                  <div className="text-[#6B7280] mb-2">
                    Revokes selected device and logs out its sessions.
                  </div>

                  {approveMode === "replace" && (
                    <select
                      value={replaceDeviceId}
                      onChange={(e) => setReplaceDeviceId(e.target.value)}
                      className="w-full rounded-lg border border-black/10 p-2 text-xs text-[#111827] bg-white"
                    >
                      {(
                        activeDevicesMap[selectedForApprove.userId?._id] || []
                      ).map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || d.deviceId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              {/* Option C: Raise limit */}
              {(selectedForApprove.userId?.deviceLimit || 1) < 3 && (
                <label
                  className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer transition-colors ${
                    approveMode === "raise-and-add"
                      ? "bg-amber-50/70 border-amber-300"
                      : "bg-white border-black/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="approveMode"
                    value="raise-and-add"
                    checked={approveMode === "raise-and-add"}
                    onChange={() => setApproveMode("raise-and-add")}
                    className="mt-0.5 text-amber-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-[#111827]">
                      Raise device limit to{" "}
                      {(selectedForApprove.userId?.deviceLimit || 1) + 1} and approve
                    </div>
                    <div className="text-[#6B7280]">
                      Allows the student to use an additional simultaneous device.
                    </div>
                  </div>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/5">
              <Button
                variant="ghost"
                onClick={() => setSelectedForApprove(null)}
              >
                Cancel
              </Button>
              <Button
                variant="yellow"
                onClick={handleApproveSubmit}
                loading={submittingApprove}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* REJECT MODAL */}
      {selectedForReject && (
        <Dialog
          isOpen={Boolean(selectedForReject)}
          onClose={() => setSelectedForReject(null)}
          title="Reject Device Request"
          description={`Reject request for ${selectedForReject.userId?.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                Reason / Note for Student (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Please use your registered laptop for Accountancy lectures."
                className="w-full rounded-xl border border-black/10 p-3 text-xs text-[#111827]"
              />
              <p className="mt-1 text-[11px] text-[#6B7280]">
                This note will be shown on the student&apos;s screen.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-black/5">
              <Button
                variant="ghost"
                onClick={() => setSelectedForReject(null)}
              >
                Cancel
              </Button>
              <Button
                variant="soft-red"
                onClick={handleRejectSubmit}
                loading={submittingReject}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
