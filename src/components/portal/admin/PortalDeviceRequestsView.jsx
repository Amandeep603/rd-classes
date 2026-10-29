"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Smartphone,
  Check,
  X,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import {
  approveDeviceRequestAction,
  rejectDeviceRequestAction,
} from "@/server/actions/admin.devices.actions.js";

export default function PortalDeviceRequestsView({
  requests = [],
  activeDevicesMap = {},
  currentStatus = "pending",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForApprove, setSelectedForApprove] = useState(null);
  const [selectedForReject, setSelectedForReject] = useState(null);

  // Approve dialog state
  const [approveMode, setApproveMode] = useState("add");
  const [replaceDeviceId, setReplaceDeviceId] = useState("");
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [approveError, setApproveError] = useState("");

  // Reject dialog state
  const [rejectNote, setRejectNote] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const setStatusTab = (statusKey) => {
    const params = new URLSearchParams(searchParams);
    if (statusKey) params.set("status", statusKey);
    else params.delete("status");
    router.push(`/admin/device-requests?${params.toString()}`);
  };

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

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    const name = r.userId?.name?.toLowerCase() || "";
    const login = r.userId?.loginId?.toLowerCase() || "";
    const label = r.label?.toLowerCase() || "";
    return (
      name.includes(s) ||
      login.includes(s) ||
      label.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          Device Clearance Requests
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage and review device clearance under RD Classes single-device policy
        </p>
      </div>

      {/* Toolbar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[22px] border border-black/5 bg-white p-4 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-2xl self-start">
          {[
            { id: "pending", label: "Pending" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => {
            const isActive = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-[#111827] shadow-2xs"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student or device..."
            className="w-full rounded-xl border border-black/10 py-2 pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs">
        {filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const student = req.userId;
              const initials = student?.name
                ? student.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "ST";

              return (
                <div
                  key={req._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black/5 bg-neutral-50/70 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-[#78350F] font-bold text-sm shrink-0 shadow-2xs">
                      {initials}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#111827]">
                          {student?.name || "Student"}
                        </span>
                        {student?.loginId && (
                          <span className="rounded-md bg-white border border-black/8 px-1.5 py-0.2 text-[10px] font-bold font-mono text-[#6B7280]">
                            {student.loginId}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            req.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap">
                        <Smartphone className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                        <span className="font-medium text-[#374151]">
                          {req.label || "Browser Device"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(req.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Kolkata",
                              }
                            )}
                          </span>
                        </span>
                      </div>

                      {req.studentNote && (
                        <p className="text-xs italic text-[#4B5563] pt-0.5">
                          &ldquo;{req.studentNote}&rdquo;
                        </p>
                      )}

                      {req.note && req.status === "rejected" && (
                        <p className="text-xs text-rose-600 font-medium">
                          Rejection note: {req.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Pending Requests */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openApproveModal(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition-colors shadow-2xs"
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-200 px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-red-100 hover:text-red-800 transition-colors"
                      >
                        <X className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Reject</span>
                      </button>

                      {student?._id && (
                        <Link
                          href={`/admin/students/${student._id}`}
                          className="rounded-xl p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5"
                          aria-label="Student details"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[#6B7280]">
            No {currentStatus} device requests found.
          </div>
        )}
      </div>

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
