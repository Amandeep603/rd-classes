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
  RotateCcw,
  Layers,
  HelpCircle,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import Modal from "@/components/admin/ui/Modal";
import Link from "next/link";

function getDeviceIcon(type = "", os = "") {
  const normType = String(type).toLowerCase();
  const normOs = String(os).toLowerCase();
  if (normOs.includes("ipad") || normType === "tablet") {
    return <Tablet className="w-4 h-4 text-slate-600 shrink-0" />;
  }
  if (normType === "mobile" || normOs.includes("ios") || normOs.includes("android")) {
    return <Smartphone className="w-4 h-4 text-slate-600 shrink-0" />;
  }
  return <Laptop className="w-4 h-4 text-slate-600 shrink-0" />;
}

export default function DeviceRequestsView({ initialStatus = "pending" }) {
  const [currentTab, setCurrentTab] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Approve modal state
  const [selectedForApprove, setSelectedForApprove] = useState(null);
  const [approveMode, setApproveMode] = useState("additional"); // "additional" | "replace" | "same_device"
  const [replaceDeviceId, setReplaceDeviceId] = useState("");
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject modal state
  const [selectedForReject, setSelectedForReject] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Reconsider state
  const [reconsideringId, setReconsideringId] = useState(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  // Auto-refresh: 20 seconds while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        setRefreshIndex((i) => i + 1);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = new URLSearchParams();
        q.set("status", currentTab);
        if (search.trim()) q.set("search", search.trim());

        const res = await fetch(`/api/admin/device-requests?${q.toString()}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
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

  const handleOpenApproveModal = (req, defaultMode = "additional") => {
    setSelectedForApprove(req);
    setApproveMode(defaultMode);
    const approvedDevices = req.currentApprovedDevices || [];
    if (approvedDevices.length > 0) {
      setReplaceDeviceId(approvedDevices[0].deviceId);
      setTargetDeviceId(approvedDevices[0].deviceId);
    } else {
      setReplaceDeviceId("");
      setTargetDeviceId("");
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedForApprove) return;
    setApproving(true);
    try {
      const res = await fetch(
        `/api/admin/device-requests/${selectedForApprove._id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: approveMode,
            replaceDeviceId: approveMode === "replace" ? replaceDeviceId : null,
            targetDeviceId: approveMode === "same_device" ? targetDeviceId : null,
          }),
        }
      );
      if (res.ok) {
        setSelectedForApprove(null);
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json().catch(() => ({}));
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
      const res = await fetch(
        `/api/admin/device-requests/${selectedForReject._id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: rejectNote }),
        }
      );
      if (res.ok) {
        setSelectedForReject(null);
        setRejectNote("");
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to reject device.");
      }
    } catch (e) {
      alert("Error rejecting device: " + e.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleReconsider = async (reqId) => {
    setReconsideringId(reqId);
    try {
      const res = await fetch(`/api/admin/device-requests/${reqId}/reconsider`, {
        method: "POST",
      });
      if (res.ok) {
        setRefreshIndex((i) => i + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to reconsider device.");
      }
    } catch (e) {
      alert("Error reconsidering device: " + e.message);
    } finally {
      setReconsideringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approval Requests"
        description="Enforce single-device learning policy. Authorize new student devices, replace old ones, or add aliases."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Device Requests", href: "/admin/device-requests" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/devices"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              All Approved Devices
            </Link>
            <button
              onClick={() => setRefreshIndex((i) => i + 1)}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Tabs and Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 border-b md:border-b-0 pb-3 md:pb-0 border-slate-100 overflow-x-auto">
          <button
            onClick={() => setCurrentTab("pending")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "rejected"
                ? "bg-[#0A192F] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Rejected
            <span className="text-slate-400 font-normal">({counts.rejected})</span>
          </button>

          <button
            onClick={() => setCurrentTab("all")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "all"
                ? "bg-[#0A192F] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Requests
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or login ID..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading && requests.length === 0 ? (
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
        <div className="space-y-4">
          {requests.map((req) => {
            const student = req.student || {};
            const approvedDevices = req.currentApprovedDevices || [];
            const reqLabel = req.label || `${req.osFamily || "Device"} · ${req.browserName || "Browser"}`;
            const reqScreen =
              req.profile?.screenMajor && req.profile?.screenMinor
                ? `${req.profile.screenMajor}x${req.profile.screenMinor}`
                : "Standard";
            const reqLoc =
              [req.city, req.region, req.country].filter(Boolean).join(", ") ||
              "Approx. location unavailable";
            const attemptTime = req.lastAttemptAt || req.createdAt;

            return (
              <div
                key={req._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header: Student & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A192F] text-[#FFB800] font-bold flex items-center justify-center text-sm shrink-0">
                      {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {student.name || "Student"}{" "}
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          ({student.loginId})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Phone: {student.phone || "—"} &bull; Allowed Limit:{" "}
                        {student.maxDevices || 1} &bull; Approved Now:{" "}
                        {approvedDevices.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        req.status === "pending"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {req.status?.toUpperCase()}
                    </span>
                    {req.decidedAt && (
                      <span className="text-[11px] text-slate-400">
                        Decided by {req.decidedBy || "Admin"} on{" "}
                        {new Date(req.decidedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: NEW Device */}
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        {getDeviceIcon(req.deviceType, req.osFamily)}
                        NEW Requesting Device
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Attempts: {req.attemptCount || 1}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-sm">{reqLabel}</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <strong>OS:</strong> {req.osFamily || req.osName} {req.osVersion} &bull;{" "}
                        <strong>Browser:</strong> {req.browserName} {req.browserVersion}
                      </div>
                      <div>
                        <strong>Screen:</strong> {reqScreen}{" "}
                        {req.model ? `&bull; Model: ${req.model}` : ""}
                      </div>
                      <div>
                        <strong>IP:</strong> {req.ip || "127.0.0.1"} &bull;{" "}
                        <strong>Location:</strong> {reqLoc}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Last attempt: {attemptTime ? new Date(attemptTime).toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Already Approved Device(s) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Current Approved Device(s) ({approvedDevices.length})
                    </span>

                    {approvedDevices.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-2">
                        Student currently has no approved devices.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {approvedDevices.map((ad, idx) => (
                          <div
                            key={ad._id || idx}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-0.5"
                          >
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {getDeviceIcon(ad.deviceType, ad.osFamily || ad.os)}
                              {ad.deviceLabel || ad.label || "Approved Device"}
                            </div>
                            <div>
                              OS: {ad.osFamily || ad.os} &bull; Browser: {ad.browser || ad.browserName} &bull; Screen:{" "}
                              {ad.profile?.screenMajor && ad.profile?.screenMinor
                                ? `${ad.profile.screenMajor}x${ad.profile.screenMinor}`
                                : "Standard"}
                              {ad.model ? ` &bull; Model: ${ad.model}` : ""}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              IP: {ad.lastIp || ad.ip} &bull; Approx. Location:{" "}
                              {[ad.city, ad.country].filter(Boolean).join(", ") || "—"} &bull; Last used:{" "}
                              {ad.lastUsedAt ? new Date(ad.lastUsedAt).toLocaleDateString() : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Why Flagged Section */}
                {Array.isArray(req.flags) && req.flags.length > 0 && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <div className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      Why Flagged:
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-800 space-y-0.5">
                      {req.flags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rejection Note (if rejected) */}
                {req.rejectionReason && (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600">
                    <strong>Declined Reason:</strong> {req.rejectionReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {req.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(req, "additional")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve as Additional
                      </button>

                      {approvedDevices.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(req, "replace")}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            Replace Old Device
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(req, "same_device")}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-sm inline-flex items-center gap-1"
                            title="Adds this screen profile/token to the student's existing device (for external monitors or browser desktop mode)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Approve as Same Device (Alias)
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedForReject(req);
                          setRejectNote("");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {req.status === "rejected" && (
                    <button
                      type="button"
                      disabled={reconsideringId === req._id}
                      onClick={() => handleReconsider(req._id)}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reconsider (Move to Pending)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {selectedForApprove && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForApprove(null)}
          title="Approve Device Request"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <p className="font-semibold text-emerald-800">
                Approving device for {selectedForApprove.student?.name || "Student"}
              </p>
              <p className="mt-0.5 text-emerald-700 font-medium">
                {selectedForApprove.label || "Requested Device"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Choose Approval Action:
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="additional"
                    checked={approveMode === "additional"}
                    onChange={(e) => setApproveMode(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <strong className="block text-slate-800">Approve as Additional Device</strong>
                    <span className="text-slate-500">
                      Increases student&apos;s allowed device limit and permits both devices to log in normally.
                    </span>
                  </div>
                </label>

                {(selectedForApprove.currentApprovedDevices || []).length > 0 && (
                  <>
                    <label className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="mode"
                        value="replace"
                        checked={approveMode === "replace"}
                        onChange={(e) => setApproveMode(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="block text-slate-800">Replace Old Device</strong>
                        <span className="text-slate-500">
                          Revokes authorization for an existing device and immediately terminates its active sessions.
                        </span>
                      </div>
                    </label>

                    {approveMode === "replace" && (
                      <div className="pl-6 pt-1 pb-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Select which approved device to revoke:
                        </label>
                        <select
                          value={replaceDeviceId}
                          onChange={(e) => setReplaceDeviceId(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                        >
                          {(selectedForApprove.currentApprovedDevices || []).map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.deviceLabel || d.label} ({d.osFamily || d.os} &bull; last used:{" "}
                              {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleDateString() : "—"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="mode"
                        value="same_device"
                        checked={approveMode === "same_device"}
                        onChange={(e) => setApproveMode(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <strong className="block text-slate-800">
                          Approve as Same Device (Alias)
                        </strong>
                        <span className="text-slate-500">
                          Links this hardware profile to the existing device without creating a new device slot. Use for external monitors or Desktop Mode.
                        </span>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={approving}
                onClick={() => setSelectedForApprove(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={handleConfirmApprove}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {approving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Approval
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedForReject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForReject(null)}
          title="Reject Device Request"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
              <p className="font-semibold text-rose-800">
                Reject device for {selectedForReject.student?.name || "Student"}?
              </p>
              <p className="mt-0.5 text-rose-700">
                The student will see: &quot;Your request for this device was declined. Please contact RD Classes.&quot;
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Reason / Internal Note (Optional):
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Unrecognized location, suspect credential sharing..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-rose-500 h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={rejecting}
                onClick={() => setSelectedForReject(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {rejecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
