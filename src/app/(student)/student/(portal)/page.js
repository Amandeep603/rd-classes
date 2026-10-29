import { getCurrentUser } from "@/server/auth/session.js";
import { getStudentDashboardData } from "@/server/services/studentDashboardService.js";
import AnnouncementBanner from "@/components/portal/student/AnnouncementBanner";
import ResumeRevisionCard from "@/components/portal/student/ResumeRevisionCard";
import SyllabusCoverageCard from "@/components/portal/student/SyllabusCoverageCard";
import StatCard from "@/components/portal/ui/StatCard";
import UpcomingTestCard from "@/components/portal/student/UpcomingTestCard";
import RecentNotesCard from "@/components/portal/student/RecentNotesCard";
import { Video, CalendarCheck, FileText } from "lucide-react";

import { Suspense } from "react";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Dashboard | RD Classes Student Portal",
};

async function StudentDashboardContent() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  const data = await getStudentDashboardData(auth.user._id);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Yellow Announcement Banner (only if there is a real announcement) */}
      {data.announcement && (
        <AnnouncementBanner
          announcement={data.announcement}
          studentId={auth.user._id.toString()}
        />
      )}

      {/* 2. Top Hero Row: Resume Revision (65%) + Syllabus Coverage (35%) */}
      <div className="grid grid-cols-1 min-[1100px]:grid-cols-12 gap-6 items-stretch">
        <div className="min-[1100px]:col-span-8 flex flex-col">
          <ResumeRevisionCard
            resume={data.resume}
            firstLectureId={data.firstLectureId}
            hasCourses={Boolean(data.activeCourses && data.activeCourses.length > 0)}
            whatsappNumber={data.whatsappNumber}
            totalLectures={data.stats?.lecturesWatched?.total || 0}
          />
        </div>
        <div className="min-[1100px]:col-span-4 flex flex-col">
          <SyllabusCoverageCard syllabus={data.syllabus} />
        </div>
      </div>

      {/* 3. Three Stat Cards (height 96px, gap 24px) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={Video}
          value={data.stats.lecturesWatched.completed}
          total={data.stats.lecturesWatched.total}
          label="Lectures Watched"
          href="/student/lectures"
          tone="blue"
        />

        <StatCard
          icon={FileText}
          value={data.stats.handouts.count}
          label="Handouts & Formula Sheets"
          href="/student/notes"
          tone="yellow"
        />

        <StatCard
          icon={CalendarCheck}
          value={data.stats.tests.count}
          suffix={data.stats.tests.avgScore ? `(${data.stats.tests.avgScore}% avg)` : ""}
          label="Sunday Mock Tests"
          href="/student/tests"
          tone="peach"
        />
      </div>

      {/* 4. Bottom Row: Upcoming Test + Recently Uploaded Notes (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <UpcomingTestCard test={data.upcomingTest} />
        <RecentNotesCard notes={data.recentNotes} />
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentDashboardContent />
    </Suspense>
  );
}
