"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Clock,
  MapPin,
  BookOpen,
  Award,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function PortalTestsView({
  upcomingTests = [],
  pastResults = [],
  overallAvg = 0,
}) {
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          Sunday Mock Tests & Results
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track upcoming center tests, view your scores and evaluate your board preparation
        </p>
      </div>

      {/* Performance Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-[22px] border border-black/5 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#FFF6DA] text-[#B45309] font-bold text-xl shrink-0">
            <Award className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111827]">
              {overallAvg}%
            </div>
            <div className="text-xs font-semibold text-[#6B7280]">
              Overall Test Average
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-black/5 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#EAF4FD] text-[#0284C7] font-bold text-xl shrink-0">
            <CalendarCheck className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111827]">
              {pastResults.length}
            </div>
            <div className="text-xs font-semibold text-[#6B7280]">
              Tests Attempted
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-black/5 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#FDEBDD] text-[#C2410C] font-bold text-xl shrink-0">
            <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111827]">
              {upcomingTests.length}
            </div>
            <div className="text-xs font-semibold text-[#6B7280]">
              Upcoming Scheduled Tests
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Upcoming and Past */}
      <div className="flex items-center gap-2 border-b border-black/8 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "upcoming"
              ? "bg-[#FDB813] text-[#111827] shadow-[0_4px_14px_rgba(253,184,19,0.35)]"
              : "bg-white text-[#4B5563] hover:text-[#111827] border border-black/5"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Upcoming Tests ({upcomingTests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "past"
              ? "bg-[#FDB813] text-[#111827] shadow-[0_4px_14px_rgba(253,184,19,0.35)]"
              : "bg-white text-[#4B5563] hover:text-[#111827] border border-black/5"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Past Results ({pastResults.length})</span>
        </button>
      </div>

      {/* Tab Content: Upcoming Tests */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {upcomingTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {upcomingTests.map((test) => {
                const startDate = new Date(test.startsAt);
                const monthStr = startDate
                  .toLocaleDateString("en-IN", {
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  })
                  .toUpperCase();
                const dayStr = startDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  timeZone: "Asia/Kolkata",
                });
                const weekdayStr = startDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  timeZone: "Asia/Kolkata",
                });
                const timeStr = startDate.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                });

                return (
                  <div
                    key={test._id}
                    className="flex items-center gap-5 rounded-[24px] border border-black/5 bg-white p-6 shadow-xs"
                  >
                    <div className="flex h-[96px] w-[80px] flex-col items-center justify-center rounded-2xl border border-[#CFE6F7] bg-[#EAF4FD] p-2 shrink-0 text-center shadow-2xs">
                      <span className="text-[11px] font-extrabold text-[#0284C7]">
                        {monthStr}
                      </span>
                      <span className="text-2xl font-black text-[#0B2A4A] leading-tight">
                        {dayStr}
                      </span>
                      <span className="text-xs font-bold text-[#0284C7]">
                        {weekdayStr}
                      </span>
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#FFF8E7] border border-[#FDE5A9] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#92400E]">
                          {test.kind || "Sunday Mock"}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#111827] truncate">
                        {test.title}
                      </h3>
                      <div className="space-y-1 text-xs text-[#6B7280]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{timeStr} ({Math.round((test.durationMin || 180) / 60)} Hours)</span>
                        </div>
                        {test.syllabus && (
                          <div className="flex items-center gap-1.5 truncate">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{test.syllabus}</span>
                          </div>
                        )}
                        {test.venue && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{test.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4FD] text-[#0284C7] mb-3">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#111827]">
                No upcoming mock tests currently scheduled.
              </h3>
              <p className="mt-1 text-xs text-[#6B7280] max-w-sm">
                Sir announces Sunday center mocks in advance. Check back soon for the next schedule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Past Test Results */}
      {activeTab === "past" && (
        <div className="space-y-4">
          {pastResults.length > 0 ? (
            <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50/80 border-b border-black/5 text-xs uppercase font-extrabold text-[#6B7280]">
                  <tr>
                    <th className="px-6 py-4">Test Title</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {pastResults.map((r) => {
                    const pct = Math.round((r.score / (r.maxScore || 100)) * 100);
                    const dateStr = r.testDate
                      ? new Date(r.testDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "Asia/Kolkata",
                        })
                      : "Recently Held";

                    return (
                      <tr key={r._id} className="hover:bg-neutral-50/50">
                        <td className="px-6 py-4 font-bold text-[#111827]">
                          {r.title || "Sunday Mock Test"}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#6B7280]">
                          {dateStr}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#111827]">
                          {r.score} / {r.maxScore || 100}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              pct >= 90
                                ? "bg-emerald-100 text-emerald-800"
                                : pct >= 75
                                ? "bg-amber-100 text-amber-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF6DA] text-[#D97706] mb-3">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#111827]">
                No test results recorded yet.
              </h3>
              <p className="mt-1 text-xs text-[#6B7280] max-w-sm">
                Scores and answer sheet evaluations will be uploaded by Sir after Sunday mock tests.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
