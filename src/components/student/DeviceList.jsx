import { Smartphone, Laptop, CheckCircle, Info } from "lucide-react";

export default function DeviceList({ devices, currentDeviceId, deviceLimit }) {
  return (
    <div className="bg-[#131316] border border-[#222226] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#FFB800]" />
            <span>Approved Devices</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Single-device security policy: {devices.length} / {deviceLimit} slots registered
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {devices.map((d) => {
          const isCurrent = d.deviceId === currentDeviceId;
          const isMobile =
            d.label?.toLowerCase().includes("mobile") ||
            d.label?.toLowerCase().includes("ios") ||
            d.label?.toLowerCase().includes("android");

          return (
            <div
              key={d.deviceId}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                isCurrent
                  ? "bg-[#18181E] border-[#FFB800]/40"
                  : "bg-[#16161A] border-[#222226]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isCurrent
                      ? "bg-[#FFB800]/10 text-[#FFB800]"
                      : "bg-[#222228] text-gray-400"
                  }`}
                >
                  {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{d.label}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FFB800] text-[#0A0A0B] rounded-full">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Approved: {new Date(d.approvedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          To change your approved device or register a new phone, contact RD Classes administration.
        </p>
      </div>
    </div>
  );
}
