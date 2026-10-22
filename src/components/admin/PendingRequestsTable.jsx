"use client";

import { useState } from "react";
import ApproveDialog from "./ApproveDialog";
import { rejectDeviceRequestAction } from "@/server/actions/admin.devices.actions.js";
import { Smartphone, Check, X, Clock, User, Globe } from "lucide-react";

export default function PendingRequestsTable({ requests, activeDevicesMap = {} }) {
  const [selectedForApprove, setSelectedForApprove] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async (requestId) => {
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("note", rejectNote);
    await rejectDeviceRequestAction(requestId, fd);
    setIsSubmitting(false);
    setRejectingId(null);
    setRejectNote("");
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-8 text-center">
        <Smartphone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-300">No pending device requests</p>
        <p className="text-xs text-gray-500 mt-0.5">
          All student device authorization requests are up to date.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#131316] border border-[#222226] rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181E] border-b border-[#222226] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Device & Browser</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Requested At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D23]">
              {requests.map((r) => {
                const student = r.userId;
                const activeDevices = activeDevicesMap[student?._id] || [];

                return (
                  <tr key={r._id} className="hover:bg-[#16161B] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{student?.name || "Unknown"}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {student?.loginId} • Slots: {student?.deviceCount}/{student?.deviceLimit}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-200">{r.label}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-xs">{r.userAgent}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                        {r.ip || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {new Date(r.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rejectingId === r._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="bg-[#1C1C22] border border-[#33333F] rounded-lg px-2.5 py-1 text-xs text-white outline-none w-36"
                          />
                          <button
                            onClick={() => handleReject(r._id)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedForApprove({ request: r, activeDevices })}
                            className="px-3 py-1.5 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectingId(r._id)}
                            className="px-3 py-1.5 bg-[#201A1A] hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-[#1D1D23]">
          {requests.map((r) => {
            const student = r.userId;
            const activeDevices = activeDevicesMap[student?._id] || [];

            return (
              <div key={r._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#FFB800]" />
                      {student?.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {student?.loginId} (Slots: {student?.deviceCount}/{student?.deviceLimit})
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-[#18181E] p-2.5 rounded-xl text-xs space-y-1">
                  <div className="text-gray-300 font-semibold">{r.label}</div>
                  <div className="text-[11px] text-gray-500 font-mono">IP: {r.ip || "—"}</div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSelectedForApprove({ request: r, activeDevices })}
                    className="flex-1 py-2 bg-[#FFB800] text-[#0A0A0B] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectingId(r._id)}
                    className="flex-1 py-2 bg-[#201A1A] text-red-400 border border-red-900/40 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedForApprove && (
        <ApproveDialog
          request={selectedForApprove.request}
          activeDevices={selectedForApprove.activeDevices}
          onClose={() => setSelectedForApprove(null)}
        />
      )}
    </>
  );
}
