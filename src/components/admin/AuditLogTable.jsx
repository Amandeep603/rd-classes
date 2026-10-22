import { Activity, Clock, ShieldCheck, User } from "lucide-react";

export default function AuditLogTable({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-10 text-center text-xs text-gray-500">
        No administrative audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-[#131316] border border-[#222226] rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181E] border-b border-[#222226] text-gray-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Target</th>
              <th className="px-5 py-3.5">Metadata Details</th>
              <th className="px-5 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D1D23]">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-[#16161B] transition-colors">
                <td className="px-5 py-3.5">
                  <span className="font-mono font-bold text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {log.actorId ? (
                    <span className="text-gray-200 flex items-center gap-1 font-semibold">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {log.actorId.name || log.actorId.loginId}
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      System
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono text-gray-300">
                  <span className="text-[11px] text-gray-500 mr-1">{log.targetType}:</span>
                  {log.targetId}
                </td>
                <td className="px-5 py-3.5">
                  <div className="max-w-xs truncate font-mono text-[11px] text-gray-400">
                    {JSON.stringify(log.meta || {})}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-gray-500 text-[11px]">
                  <span className="flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-gray-600" />
                    {new Date(log.at).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
