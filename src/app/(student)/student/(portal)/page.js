import { getCurrentUser } from "@/server/auth/session.js";
import { getStudentDashboardData } from "@/server/services/studentDashboardService.js";
import AnnouncementBanner from "@/components/portal/student/AnnouncementBanner";
import ResumeRevisionCard from "@/components/portal/student/ResumeRevisionCard";
import SyllabusCoverageCard from "@/components/portal/student/SyllabusCoverageCard";
import StatCard from "@/components/portal/ui/StatCard";
import UpcomingTestCard from "@/components/portal/student/UpcomingTestCard";
import RecentNotesCard from "@/components/portal/student/RecentNotesCard";
import { Video, CalendarCheck, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export const instant = false;

export const metadata = {
  title: "Dashboard | RD Classes Student Portal",
};

export default async function StudentDashboardPage() {
  const auth = await getCurrentUser();
  const data = await getStudentDashboardData(auth.user._id);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Announcement Banner */}
      {data.announcement && (
        <AnnouncementBanner announcement={data.announcement} />
      )}

      {/* 2. Top Hero Row: Resume Revision + Syllabus Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ResumeRevisionCard resume={data.resume} />
        </div>
        <div className="lg:col-span-4">
          <SyllabusCoverageCard syllabus={data.syllabus} />
        </div>
      </div>

      {/* 3. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          icon={Video}
          value={data.stats.lecturesWatched.completed}
          total={data.stats.lecturesWatched.total}
          label="Lectures Watched"
          href="/student/courses"
          tone="blue"
        />

        <StatCard
          icon={BookOpen}
          value={data.activeCourses.length}
          label="Enrolled Courses"
          href="/student/courses"
          tone="yellow"
        />

        <StatCard
          icon={CalendarCheck}
          value={data.stats.tests.count}
          suffix={
            data.stats.tests.count > 0
              ? ` (${data.stats.tests.avgScore}% avg)`
              : ""
          }
          label="Sunday Mock Tests"
          href="/student/tests"
          tone="peach"
        />
      </div>

      {/* 4. Bottom Row: Upcoming Test + Quick Courses / Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <UpcomingTestCard test={data.upcomingTest} />
        </div>

        <div className="lg:col-span-7">
          <div className="flex h-[281px] flex-col justify-between rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-[17px] font-extrabold text-[#111827]">
                  My Enrolled Courses
                </h3>
              </div>

              <Link
                href="/student/courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 my-auto">
              {data.activeCourses.length > 0 ? (
                data.activeCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course._id}
                    href={`/student/courses/${course.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-neutral-50/70 p-3 hover:bg-amber-50/50 hover:border-amber-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-900 font-bold text-sm shrink-0">
                        RD
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#111827] truncate group-hover:text-amber-800">
                          {course.title}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          CBSE Accountancy Syllabus
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-neutral-900 group-hover:translate-x-0.5 transition-transform">
                        Study Course →
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-[#6B7280]">
                  No active enrolled courses found.
                </div>
              )}
            </div>

            <div className="border-t border-black/5 pt-2 text-xs text-[#6B7280]">
              All lectures are recorded in HD with unlimited revision.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
