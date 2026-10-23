import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Test } from "@/server/db/models/Test.js";
import { TestResult } from "@/server/db/models/TestResult.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import {
  CalendarCheck,
  Clock,
  MapPin,
  BookOpen,
  Award,
  CheckCircle2,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Tests & Results | RD Classes Student Portal",
};

export default async function StudentTestsPage() {
  const auth = await getCurrentUser();
  await connectDB();
  const now = new Date();

  // Active courses
  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select("courseId");

  const courseIds = enrollments.map((e) => e.courseId);

  // Upcoming tests
  const upcomingTests = await Test.find({
    published: true,
    startsAt: { $gte: now },
    $or: [
      { className: "All" },
      { className: auth.user.className || "12" },
      { courseId: { $in: courseIds } },
    ],
  })
    .sort({ startsAt: 1 })
    .lean();

  // Past test results
  const results = await TestResult.find({ userId: auth.user._id })
    .populate("testId")
    .sort({ createdAt: -1 })
    .lean();

  let totalScore = 0;
  let totalMax = 0;
  results.forEach((r) => {
    totalScore += r.score;
    totalMax += r.maxScore || 100;
  });

  const overallAvg =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          Sunday Mock Tests & Results
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track upcoming center tests, view your scores and evaluate your board preparation
        </p>
      </div>

      {/* Average Performance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold text-xl shrink-0">
            <Award className="h-7 w-7" />
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

        <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 font-bold text-xl shrink-0">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111827]">
              {results.length}
            </div>
            <div className="text-xs font-semibold text-[#6B7280]">
              Tests Attempted
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-xl shrink-0">
            <CheckCircle2 className="h-7 w-7" />
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

      {/* Section 1: Upcoming Tests */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#111827]">
          Scheduled Upcoming Tests
        </h2>

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
                  className="flex items-center gap-5 rounded-[22px] border border-black/5 bg-white p-6 shadow-xs"
                >
                  <div className="flex h-[96px] w-[80px] flex-col items-center justify-center rounded-2xl border border-black/8 bg-neutral-50 p-2 shrink-0 text-center">
                    <span className="text-[11px] font-extrabold text-[#6B7280]">
                      {monthStr}
                    </span>
                    <span className="text-2xl font-black text-[#111827]">
                      {dayStr}
                    </span>
                    <span className="text-xs font-semibold text-[#6B7280]">
                      {weekdayStr}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {test.kind || "Sunday Mock"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#111827] truncate">
                      {test.title}
                    </h3>
                    <div className="space-y-1 text-xs text-[#6B7280]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeStr} ({Math.round(test.durationMin / 60)} Hours)</span>
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
          <div className="rounded-[22px] border border-dashed border-black/10 bg-white p-8 text-center text-sm text-[#6B7280]">
            No upcoming mock tests currently scheduled.
          </div>
        )}
      </div>

      {/* Section 2: Past Test Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#111827]">
          Past Test Results & Scorecards
        </h2>

        {results.length > 0 ? (
          <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-xs">
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
                {results.map((r) => {
                  const pct = Math.round((r.score / (r.maxScore || 100)) * 100);
                  const dateStr = r.testId?.startsAt
                    ? new Date(r.testId.startsAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
                      })
                    : new Date(r.createdAt).toLocaleDateString("en-IN");

                  return (
                    <tr key={r._id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4 font-bold text-[#111827]">
                        {r.testId?.title || "Sunday Mock Test"}
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
          <div className="rounded-[22px] border border-dashed border-black/10 bg-white p-8 text-center text-sm text-[#6B7280]">
            No test results recorded yet. Scores will be uploaded by Sir after Sunday mock tests.
          </div>
        )}
      </div>
    </div>
  );
}
