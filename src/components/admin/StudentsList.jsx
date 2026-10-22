"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CreateStudentModal from "./CreateStudentModal";
import {
  UserPlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Smartphone,
  Calendar,
} from "lucide-react";

export default function StudentsList({
  students,
  total,
  page,
  totalPages,
  availableCourses = [],
  nextLoginIdHint = "rd1001",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) params.set("search", searchTerm);
    else params.delete("search");
    if (statusFilter) params.set("status", statusFilter);
    else params.delete("status");
    params.set("page", "1");
    router.push(`/admin/students?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/admin/students?${params.toString()}`);
  };

  return (
    <div>
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#131316] border border-[#26262C] focus:border-[#FFB800] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#131316] border border-[#26262C] rounded-xl px-3 py-2 text-xs text-gray-300 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-3.5 py-2 bg-[#202028] hover:bg-[#2A2A35] text-xs font-semibold text-gray-200 rounded-xl border border-[#30303E] transition"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </form>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-[#FFB800]/10"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Students Data Display */}
      <div className="bg-[#131316] border border-[#222226] rounded-2xl overflow-hidden shadow-xl">
        {students.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No students found matching your query.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181E] border-b border-[#222226] text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Device Slots</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Last Login</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D23]">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-[#16161B] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{s.name}</div>
                        <div className="text-[11px] text-[#FFB800] font-mono mt-0.5">{s.loginId}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-300">
                        {s.phone || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1C1C22] border border-[#2B2B35] font-mono text-gray-200">
                          <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {s.deviceCount} / {s.deviceLimit}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {s.status === "blocked" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/60">
                            <ShieldAlert className="w-3 h-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {s.lastLoginAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {new Date(s.lastLoginAt).toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/students/${s._id}`}
                          className="px-3 py-1.5 bg-[#1E1E26] hover:bg-[#282834] text-xs font-semibold text-white rounded-lg border border-[#333342] transition"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden divide-y divide-[#1D1D23]">
              {students.map((s) => (
                <div key={s._id} className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{s.name}</h4>
                      <p className="text-xs text-[#FFB800] font-mono mt-0.5">{s.loginId}</p>
                    </div>
                    {s.status === "blocked" ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/60">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Phone: {s.phone || "—"}</span>
                    <span>
                      Slots: {s.deviceCount}/{s.deviceLimit}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/admin/students/${s._id}`}
                      className="w-full text-center py-2 bg-[#1E1E26] text-xs font-semibold text-white rounded-xl border border-[#333342]"
                    >
                      Manage Student Record
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-[#17171C] border-t border-[#222226] flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} students
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded bg-[#202028] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded bg-[#202028] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStudentModal
          availableCourses={availableCourses}
          nextLoginIdHint={nextLoginIdHint}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
