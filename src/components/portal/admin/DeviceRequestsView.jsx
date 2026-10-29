"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  Check,
  X,
  Clock,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Laptop,
  Tablet,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import Modal from "@/components/admin/ui/Modal";

export default function DeviceRequestsView({ initialStatus = "pending" }) {
  const [currentTab, setCurrentTab] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Approve modal state
  const [selectedForApprove, setSelectedForApprove] = useState(null);
  const [approveMode, setApproveMode] = useState("replace"); // "replace" or "add"
  const [replaceDeviceId, setReplaceDeviceId] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject modal state
  const [selectedForReject, setSelectedForReject] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = new URLSearchParams();
        q.set("status", currentTab === "rejected" ? "all" : currentTab);
        if (search.trim()) q.set("search", search.trim());

        const res = await fetch(`/api/admin/device-requests?${q.toString()}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          let list = data.requests || [];
          if (currentTab === "rejected") {
            list = list.filter((r) => r.status === "rejected" || r.status === "revoked");
          }
          setRequests(list);
          setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentTab, search, refreshIndex]);

  const handleOpenApproveModal = (req) => {
    setSelectedForApprove(req);
    const approvedDevices = req.currentApprovedDevices || [];
    if (approvedDevices.length > 0) {
      setApproveMode("replace");
      setReplaceDeviceId(approvedDevices[0].deviceId);
    } else {
      setApproveMode("add");
      setReplaceDeviceId("");
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedForApprove) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/device-requests/${selectedForApprove._id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: approveMode,
          replaceDeviceId: approveMode === "replace" ? replaceDeviceId : null,
        }),
      });
      if (res.ok) {
        setSelectedForApprove(null);
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve device.");
      }
    } catch (e) {
      alert("Error approving device: " + e.message);
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedForReject) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/device-requests/${selectedForReject._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote }),
      });
      if (res.ok) {
        setSelectedForReject(null);
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject device.");
      }
    } catch (e) {
      alert("Error rejecting device: " + e.message);
    } finally {
      setRejecting(false);
    }
  };

  const [revokingId, setRevokingId] = useState(null);

  const handleRevokeDevice = async (reqId) => {
    if (!confirm("Are you sure you want to revoke this approved device? The student will be logged out immediately.")) {
      return;
    }
    setRevokingId(reqId);
    try {
      const res = await fetch(`/api/admin/device-requests/${reqId}/revoke`, {
        method: "POST",
      });
      if (res.ok) {
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke device.");
      }
    } catch (e) {
      alert("Error revoking device: " + e.message);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approval Requests"
        description="Enforce single-device learning policy. Authorize new student devices or replace existing ones."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Device Requests", href: "/admin/device-requests" },
        ]}
      />

      {/* Tabs and Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 border-b md:border-b-0 pb-3 md:pb-0 border-slate-100">
          <button
            onClick={() => setCurrentTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "pending"
                ? "bg-[#0A192F] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending
            {counts.pending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold ml-1">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab("approved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "approved"
                ? "bg-[#0A192F] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Approved
            <span className="text-slate-400 font-normal">({counts.approved})</span>
          </button>

          <button
            onClick={() => setCurrentTab("rejected")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "rejected"
                ? "bg-[#0A192F] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Rejected / Revoked
            <span className="text-slate-400 font-normal">({counts.rejected})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or device..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFB800] mb-2" />
          Loading device requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Smartphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No {currentTab} device requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {currentTab === "pending"
              ? "All student device requests have been resolved. When a student attempts to log in from a new device, it will appear here."
              : `There are currently no ${currentTab} device records.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const student = req.student || {};
            const approvedDevices = req.currentApprovedDevices || [];
            const deviceLabel = req.deviceLabel || req.label || "Unknown Device";
            const requestedDate = req.requestedAt || req.createdAt;

            return (
              <div
                key={req._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Student info header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A192F] text-[#FFB800] font-bold flex items-center justify-center text-sm shrink-0">
                      {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{student.name || "Student"}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {student.loginId} • {student.phone || "No phone"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      req.status === "pending"
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : req.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {req.status?.toUpperCase()}
                  </span>
                </div>

                {/* Requested Device Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {req.deviceType === "mobile" ? (
                        <Smartphone className="w-4 h-4 text-slate-600" />
                      ) : req.deviceType === "tablet" ? (
                        <Tablet className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Laptop className="w-4 h-4 text-slate-600" />
                      )}
                      {deviceLabel}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {req.status === "pending" ? "Attempted: " : "Requested: "}
                      {requestedDate
                        ? new Date(requestedDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recently"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                    <div>
                      IP: {req.lastIp || req.ip || "Unknown"}
                      {(req.city || req.country) && (
                        <span className="ml-2 text-slate-600 font-sans font-medium">
                          • {[req.city, req.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    {(req.os || req.browser) && (
                      <div className="text-slate-600 font-sans">
                        {[req.os, req.browser].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Already Approved Device section */}
                <div className="text-xs space-y-1.5">
                  <span className="font-semibold text-slate-700 block">
                    Already Approved Device(s):
                  </span>
                  {approvedDevices.length === 0 ? (
                    <span className="text-slate-400 italic">None (First device)</span>
                  ) : (
                    approvedDevices.map((ad) => (
                      <div
                        key={ad._id}
                        className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 font-medium space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-semibold">
                            {ad.deviceType === "mobile" ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                            ) : ad.deviceType === "tablet" ? (
                              <Tablet className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-emerald-700" />
                            )}
                            {ad.deviceLabel || ad.label || "Approved Device"}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-x-2">
                          <span>IP: {ad.lastIp || ad.ip || "Unknown"}</span>
                          {(ad.city || ad.country) && (
                            <span className="font-sans">
                              • {[ad.city, ad.country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="font-sans text-slate-500">
                            Last used:{" "}
                            {ad.lastUsedAt
                              ? new Date(ad.lastUsedAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions for Pending */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedForReject(req);
                        setRejectNote("");
                      }}
                      className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleOpenApproveModal(req)}
                      className="px-5 py-2 text-xs font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      Approve Device
                    </button>
                  </div>
                )}

                {/* Actions for Approved */}
                {req.status === "approved" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleRevokeDevice(req._id)}
                      disabled={revokingId === req._id}
                      className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {revokingId === req._id ? "Revoking..." : "Revoke Device"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: APPROVE DEVICE ================= */}
      {selectedForApprove && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForApprove(null)}
          title="Approve Device Request"
          description={`Student: ${selectedForApprove.student?.name} (${selectedForApprove.student?.loginId})`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="text-slate-500 block">New Device to Approve:</span>
              <span className="font-semibold text-slate-900 text-sm block">
                {selectedForApprove.deviceLabel || selectedForApprove.label}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                IP: {selectedForApprove.ip || "Unknown"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Approval Policy:
              </label>

              {/* Choice 1: Replace Old Device */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#FFB800] bg-white cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="approveMode"
                  value="replace"
                  checked={approveMode === "replace"}
                  onChange={() => setApproveMode("replace")}
                  className="mt-0.5 text-[#0A192F] focus:ring-[#FFB800]"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Replace an Existing Device (Recommended)
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Revokes the old device and terminates all its active sessions immediately.
                  </span>

                  {approveMode === "replace" && (selectedForApprove.currentApprovedDevices || []).length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Select Device to Revoke:
                      </span>
                      <select
                        value={replaceDeviceId}
                        onChange={(e) => setReplaceDeviceId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        {(selectedForApprove.currentApprovedDevices || []).map((ad) => (
                          <option key={ad.deviceId} value={ad.deviceId}>
                            {ad.deviceLabel || ad.label || "Approved Device"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>

              {/* Choice 2: Allow as Additional Device */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-[#FFB800] bg-white cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="approveMode"
                  value="add"
                  checked={approveMode === "add"}
                  onChange={() => setApproveMode("add")}
                  className="mt-0.5 text-[#0A192F] focus:ring-[#FFB800]"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Allow as Additional Device
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Increments this student&apos;s allowed device limit so both old and new devices remain active.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForApprove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approving || (approveMode === "replace" && !replaceDeviceId && (selectedForApprove.currentApprovedDevices || []).length > 0)}
                className="px-5 py-2 text-xs font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {approving ? "Approving..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: REJECT DEVICE ================= */}
      {selectedForReject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForReject(null)}
          title="Reject Device Request"
          description={`Reject login request for ${selectedForReject.student?.name} (${selectedForReject.student?.loginId})`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              The student will not be allowed to log in on this device. You can provide an optional administrative note below.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason / Note (Optional)
              </label>
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Device limit reached; contact staff."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForReject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {rejecting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
