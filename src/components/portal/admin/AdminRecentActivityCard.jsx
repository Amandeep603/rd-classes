"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  UserCheck,
  Smartphone,
  ShieldCheck,
  Video,
  Key,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function AdminRecentActivityCard({ logs = [], error = null }) {
  const [mountedTime, setMountedTime] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setMountedTime(Date.now());
    });
  }, []);


  const formatTimeAgo = (date) => {
    if (!date) return "";
    if (!mountedTime) return "recently";
    const ms = mountedTime - new Date(date).getTime();
    const mins = Math.floor(ms / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };


  const getActionDetails = (log) => {
    switch (log.action) {
      case "student.created":
        return {
          icon: UserCheck,
          text: `Created student account for ${log.meta?.name || "Student"}`,
          color: "text-amber-700 bg-amber-50",
        };
      case "device.approved":
        return {
          icon: ShieldCheck,
          text: `Approved device authorization request`,
          color: "text-emerald-700 bg-emerald-50",
        };
      case "device.rejected":
        return {
          icon: Smartphone,
          text: `Rejected device clearance request`,
          color: "text-rose-700 bg-rose-50",
        };
      case "device.removed":
        return {
          icon: Smartphone,
          text: `Removed authorized student device`,
          color: "text-slate-700 bg-slate-100",
        };
      case "password.reset":
        return {
          icon: Key,
          text: `Reset student password`,
          color: "text-purple-700 bg-purple-50",
        };
      case "lecture.created":
        return {
          icon: Video,
          text: `Added new video lecture ${log.meta?.title ? `"${log.meta.title}"` : ""}`,
          color: "text-indigo-700 bg-indigo-50",
        };
      default:
        return {
          icon: Activity,
          text: log.action.replace(".", " "),
          color: "text-sky-700 bg-sky-50",
        };
    }
  };

  const recentList = logs.slice(0, 4);

  if (error) {
    return (
      <div className="rounded-[22px] border border-rose-200 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
        <div className="flex items-center gap-3 text-rose-600 mb-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-base font-extrabold">Recent Activity</h2>
        </div>
        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-2xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#111827]">
              Recent Activity
            </h2>
            <p className="text-xs text-[#6B7280]">
              Audit trail of student enrolments, logins and device updates
            </p>
          </div>
        </div>

        <Link
          href="/admin/activity"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      {recentList.length > 0 ? (
        <div className="divide-y divide-black/5">
          {recentList.map((log) => {
            const details = getActionDetails(log);
            const Icon = details.icon;
            const timeAgo = formatTimeAgo(log.at || log.createdAt);

            return (
              <div
                key={log._id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${details.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-semibold text-[#111827] truncate">
                    {details.text}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF] shrink-0 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center space-y-1">
          <p className="text-xs font-bold text-[#111827]">No activity logs yet</p>
          <p className="text-[11px] text-[#6B7280]">
            Audit records will appear here as students log in and enrol.
          </p>
        </div>
      )}
    </div>
  );
}
