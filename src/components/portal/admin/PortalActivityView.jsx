"use client";

import { useState } from "react";
import {
  Activity,
  Shield,
  User,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Key,
  LogOut,
  Layers,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";

function getActionBadge(action) {
  const isDestructive =
    action.includes("deleted") ||
    action.includes("rejected") ||
    action.includes("blocked") ||
    action.includes("revoked");
  const isCreation =
    action.includes("created") ||
    action.includes("uploaded") ||
    action.includes("approved") ||
    action.includes("imported");
  const isWarning =
    action.includes("reset") || action.includes("updated") || action.includes("password");

  let colorClasses = "bg-gray-100 text-gray-700 border-gray-200";
  if (isDestructive) colorClasses = "bg-red-50 text-red-700 border-red-200";
  else if (isCreation) colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
  else if (isWarning) colorClasses = "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${colorClasses}`}
    >
      {action.replace(/[._]/g, " ")}
    </span>
  );
}

export default function PortalActivityView({ initialLogs = [] }) {
  const [logs] = useState(initialLogs);

  const columns = [
    {
      header: "Timestamp",
      field: "createdAt",
      sortable: true,
      render: (row) => {
        const d = row.createdAt ? new Date(row.createdAt) : null;
        return (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div>
              <div className="font-bold text-[#111827]">
                {d
                  ? d.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {d
                  ? d.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Action",
      field: "action",
      sortable: true,
      render: (row) => getActionBadge(row.action || "action.performed"),
    },
    {
      header: "Actor",
      field: "actorId",
      render: (row) => {
        const actor = row.actorId || row.userId;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-bold shrink-0">
              {actor?.name ? actor.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div>
              <div className="font-bold text-xs text-[#111827]">{actor?.name || "System Admin"}</div>
              <div className="text-[11px] text-[#6B7280]">
                {actor?.loginId ? `@${actor.loginId}` : actor?.email || "admin"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Details / Meta",
      field: "meta",
      render: (row) => {
        const meta = row.meta || row.details || {};
        const metaEntries = Object.entries(meta).filter(
          ([k]) => !["sourceId", "password", "passwordHash"].includes(k)
        );

        return (
          <div className="text-xs text-gray-700 max-w-sm">
            {row.entity && (
              <span className="font-bold text-gray-900 mr-1.5">
                [{row.entity}]:
              </span>
            )}
            {metaEntries.length > 0 ? (
              <span>
                {metaEntries
                  .slice(0, 3)
                  .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                  .join(" • ")}
              </span>
            ) : row.entityId ? (
              <span className="text-gray-500 font-mono text-[11px]">ID: {row.entityId}</span>
            ) : (
              <span className="text-gray-400 italic">No extra metadata</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Administrative Activity Log"
        subtitle="Complete chronological audit trail of logins, student imports, approvals, rejections, password resets, uploads, and system events."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Activity" },
        ]}
      />

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit log by action, actor, entity or ID..."
        emptyTitle="No activity recorded yet"
        emptyDescription="Administrative operations and student security events will appear here chronologically."
      />
    </div>
  );
}
