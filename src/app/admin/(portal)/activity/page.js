import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import { getRecentAuditLogs } from "@/server/services/audit.js";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { Activity } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Audit Activity Log | RD Classes Admin",
};

export default async function AdminActivityPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const rawLogs = await getRecentAuditLogs(200);
  const logs = JSON.parse(JSON.stringify(rawLogs));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#FFB800]" />
          <span>System & Administrative Audit Log</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Showing up to 200 most recent security, enrollment, and device events.
        </p>
      </div>

      <AuditLogTable logs={logs} />
    </div>
  );
}
