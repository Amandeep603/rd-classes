"use client";

import { useState } from "react";
import { Check, Smartphone, X, AlertTriangle } from "lucide-react";
import { approveDeviceRequestAction } from "@/server/actions/admin.devices.actions.js";

export default function ApproveDialog({ request, activeDevices = [], onClose }) {
  const [mode, setMode] = useState("add");
  const [replaceDeviceId, setReplaceDeviceId] = useState(activeDevices[0]?.deviceId || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("mode", mode);
    if (mode === "replace") {
      formData.append("replaceDeviceId", replaceDeviceId);
    }

    const res = await approveDeviceRequestAction(request._id, formData);
    setIsSubmitting(false);

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || "Failed to approve request.");
    }
  };

  const student = request.userId;
  const isLimitFull = student && student.deviceCount >= student.deviceLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#141418] border border-[#2B2B33] rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#FFB800]" />
          <span>Approve Device Request</span>
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Student: <strong className="text-white">{student?.name}</strong> ({student?.loginId})
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-850 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="p-3 bg-[#1A1A20] rounded-xl border border-[#26262E] mb-5 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Requesting Device:</span>
            <span className="font-semibold text-white">{request.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">IP Address:</span>
            <span className="font-mono text-gray-300">{request.ip || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Registered Slots:</span>
            <span className="font-semibold text-white">
              {student?.deviceCount} / {student?.deviceLimit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block mb-2">
              Select Approval Method:
            </label>

            {/* Option 1: Add as new device */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                mode === "add"
                  ? "bg-[#1E1E26] border-[#FFB800]"
                  : "bg-[#16161B] border-[#24242C] opacity-80"
              }`}
            >
              <input
                type="radio"
                name="approveMode"
                value="add"
                checked={mode === "add"}
                onChange={() => setMode("add")}
                className="mt-0.5 accent-[#FFB800]"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Add as New Device</span>
                <span className="text-gray-400">
                  Consumes 1 device slot. Requires free slot (current: {student?.deviceCount}/{student?.deviceLimit}).
                </span>
                {isLimitFull && mode === "add" && (
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    Slot limit is full! Choose &apos;Replace&apos; or &apos;Raise Limit&apos; below.
                  </span>
                )}
              </div>
            </label>

            {/* Option 2: Replace existing device */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                mode === "replace"
                  ? "bg-[#1E1E26] border-[#FFB800]"
                  : "bg-[#16161B] border-[#24242C] opacity-80"
              }`}
            >
              <input
                type="radio"
                name="approveMode"
                value="replace"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="mt-0.5 accent-[#FFB800]"
              />
              <div className="text-xs w-full">
                <span className="font-bold text-white block">Replace an Existing Device</span>
                <span className="text-gray-400">
                  Revokes the selected device and its sessions, registering this new device in its place.
                </span>

                {mode === "replace" && (
                  <div className="mt-2.5">
                    <select
                      value={replaceDeviceId}
                      onChange={(e) => setReplaceDeviceId(e.target.value)}
                      className="w-full bg-[#111114] border border-[#33333F] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      {activeDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label} (Approved {new Date(d.approvedAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Raise limit and approve */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                mode === "raise-and-add"
                  ? "bg-[#1E1E26] border-[#FFB800]"
                  : "bg-[#16161B] border-[#24242C] opacity-80"
              }`}
            >
              <input
                type="radio"
                name="approveMode"
                value="raise-and-add"
                checked={mode === "raise-and-add"}
                onChange={() => setMode("raise-and-add")}
                className="mt-0.5 accent-[#FFB800]"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Increase Limit & Approve</span>
                <span className="text-gray-400">
                  Raises the student&apos;s deviceLimit from {student?.deviceLimit} to{" "}
                  {Math.min(3, (student?.deviceLimit || 1) + 1)} and registers the device.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-[#22222A] rounded-xl border border-[#33333D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (mode === "add" && isLimitFull)}
              className="px-5 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Approve</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
