import Link from "next/link";
import { Clock, ShieldAlert, ArrowLeft } from "lucide-react";

export default function PendingDeviceCard({ deviceLabel, requestTime }) {
  const formattedTime = requestTime
    ? new Date(requestTime).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  return (
    <div className="w-full max-w-md bg-[#131316] border border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
      <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 text-[#FFB800]">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
        Device Approval Pending
      </h1>

      <p className="text-sm text-gray-300 leading-relaxed mb-6">
        This device is not approved yet. Your request has been sent to the admin. You can log in on this device once it is approved.
      </p>

      <div className="bg-[#1A1A1E] border border-[#2D2D33] rounded-xl p-4 text-left text-xs mb-6 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Device:</span>
          <span className="font-semibold text-white">{deviceLabel || "Current Browser"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Request Sent:</span>
          <span className="font-mono text-gray-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {formattedTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            Pending Admin Approval
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/student/login"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1E1E24] hover:bg-[#282830] text-gray-200 text-xs font-semibold rounded-xl border border-[#33333D] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
        <p className="text-[11px] text-gray-500">
          Need urgent access? Reach out to Ronak Sir directly on WhatsApp.
        </p>
      </div>
    </div>
  );
}
