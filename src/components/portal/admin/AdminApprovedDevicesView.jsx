"use client";

import { useState, useEffect } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Search,
  RefreshCw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import Modal from "@/components/admin/ui/Modal";
import Link from "next/link";

function getDeviceIcon(type = "", os = "") {
  const normType = String(type).toLowerCase();
  const normOs = String(os).toLowerCase();
  if (normOs.includes("ipad") || normType === "tablet") {
    return <Tablet className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
  if (normType === "mobile" || normOs.includes("ios") || normOs.includes("android")) {
    return <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
  return <Laptop className="w-4 h-4 text-emerald-500 shrink-0" />;
}

export default function AdminApprovedDevicesView() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Revoke state
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (search.trim()) q.set("search", search.trim());
        if (deviceTypeFilter !== "all") q.set("deviceType", deviceTypeFilter);
        if (osFilter !== "all") q.set("os", osFilter);

        const res = await fetch(`/api/admin/devices?${q.toString()}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setDevices(data.devices || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search, deviceTypeFilter, osFilter, refreshIndex]);

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          deviceId: revokeTarget.deviceId,
          studentId: revokeTarget.student?._id || revokeTarget.studentId,
        }),
      });
      if (res.ok) {
        setRevokeTarget(null);
        setRefreshIndex((i) => i + 1);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Failed to revoke device.");
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approved Student Devices"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Devices", href: "/admin/devices" },
        ]}
        description="All authorized hardware devices linked to active student accounts."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/device-requests"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              View Pending Requests
            </Link>
            <button
              onClick={() => setRefreshIndex((i) => i + 1)}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
              title="Refresh devices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, login ID, device, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Types</option>
              <option value="desktop">Desktop / Laptop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>OS:</span>
            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All OS</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="iPadOS">iPadOS</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Linux">Linux</option>
            </select>
          </div>
        </div>
      </div>

      {/* Devices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && devices.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
            Loading approved devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No approved devices found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Device & Spec</th>
                  <th className="py-3 px-4">IP & Location</th>
                  <th className="py-3 px-4">Browsers Seen</th>
                  <th className="py-3 px-4">First Login / Last Used</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {devices.map((d) => {
                  const student = d.student || {};
                  const label = d.deviceLabel || d.label || "Approved Device";
                  const screen =
                    d.profile?.screenMajor && d.profile?.screenMinor
                      ? `${d.profile.screenMajor}x${d.profile.screenMinor}`
                      : "Standard";
                  const loc = [d.city, d.country].filter(Boolean).join(", ") || "Unknown Location";

                  return (
                    <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-sm">
                          {student.name || "Student"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {student.loginId || "—"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(d.deviceType, d.osFamily || d.os)}
                          <span className="font-medium text-slate-800 text-xs">{label}</span>
                          {d.inAppBrowser && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-semibold">
                              Opened from {d.inAppBrowser}
                            </span>
                          )}
                          {d.provisional && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
                              Provisional
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {d.osFamily || d.os} {d.osVersion} &bull; Screen: {screen}
                          {d.model ? ` &bull; Model: ${d.model}` : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-700">{d.lastIp || d.ip || "127.0.0.1"}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{loc}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(d.browsersSeen) && d.browsersSeen.length > 0 ? (
                            d.browsersSeen.map((b, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                              >
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">{d.browser || "Browser"}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>Used: {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleDateString() : "—"}</div>
                        <div className="text-slate-400">
                          First: {d.firstLoginAt ? new Date(d.firstLoginAt).toLocaleDateString() : "—"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRevokeTarget(null)}
          title="Revoke Approved Device"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">
                  Revoke device for {revokeTarget.student?.name || "Student"}?
                </p>
                <p className="mt-1 text-rose-700 leading-relaxed">
                  This will revoke authorization for <strong>{revokeTarget.deviceLabel || revokeTarget.label}</strong> and terminate all active student sessions immediately. The student will be required to log in from an approved device or submit a new device request.
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setRevokeTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleConfirmRevoke}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {revoking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Revoke Device
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

