"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  MoreVertical,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import AddStudentWizard from "./AddStudentWizard";

export default function PortalStudentsView({
  students = [],
  total = 0,
  page = 1,
  totalPages = 1,
  availableCourses = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    if (status) params.set("status", status);
    else params.delete("status");
    params.set("page", "1");
    router.push(`/admin/students?${params.toString()}`);
  };

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    router.push(`/admin/students?${params.toString()}`);
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            Enrolled Students
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage student credentials, device clearance, and course assignments ({total} Total)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="flex h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#FFC21A] px-5 text-sm font-extrabold text-neutral-950 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="rounded-[22px] border border-black/5 bg-white p-4 shadow-xs">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, code, login ID, or phone..."
              className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-44 rounded-xl border border-black/10 py-2.5 px-3 text-sm text-[#111827] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table / Cards */}
      <div className="rounded-[22px] border border-black/5 bg-white shadow-xs overflow-hidden">
        {students.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50/80 border-b border-black/5 text-xs uppercase font-extrabold text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Devices Used</th>
                    <th className="px-6 py-4">Last Login</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {students.map((student) => {
                    const initials = getInitials(student.name);
                    const lastLoginStr = student.lastLoginAt
                      ? new Date(student.lastLoginAt).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                          }
                        )
                      : "Never";

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-[#78350F] font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#111827]">
                                {student.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="rounded-md bg-neutral-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#6B7280]">
                                  {student.studentCode || student.loginId}
                                </span>
                                {student.phone && (
                                  <span className="text-[11px] text-[#9CA3AF]">
                                    {student.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-[#111827]">
                          Class {student.className || "12"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-[#374151]">
                            <Smartphone className="h-3.5 w-3.5 text-[#9CA3AF]" />
                            <span className="font-bold">
                              {student.deviceCount || 0} / {student.deviceLimit || 1}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-[#6B7280]">
                          {lastLoginStr}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              student.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.status === "active" ? "Active" : "Blocked"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/students/${student._id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-[#111827] hover:bg-[#FFC21A] transition-colors shadow-2xs"
                          >
                            <span>Manage</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-black/5 p-4 space-y-3">
              {students.map((student) => (
                <div key={student._id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#111827]">
                      {student.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        student.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.status === "active" ? "Active" : "Blocked"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span>{student.studentCode || student.loginId}</span>
                    <span>Class {student.className || "12"}</span>
                    <span>
                      Devices: {student.deviceCount}/{student.deviceLimit}
                    </span>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/admin/students/${student._id}`}
                      className="block w-full text-center rounded-xl bg-neutral-100 py-2 text-xs font-bold text-[#111827]"
                    >
                      Manage Student
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 bg-neutral-50/50">
                <span className="text-xs text-[#6B7280]">
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-xs disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-sm text-[#6B7280]">
            No students match your query.
          </div>
        )}
      </div>

      {/* Add Student Wizard */}
      <AddStudentWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        courses={availableCourses}
      />
    </div>
  );
}
