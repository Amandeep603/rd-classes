import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import { getAdminCourses } from "@/server/services/courseService.js";
import PortalCoursesView from "@/components/portal/admin/PortalCoursesView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Courses | RD Classes Admin",
};

async function CoursesContent() {
  await requireAdmin();

  const courses = await getAdminCourses();
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  return <PortalCoursesView courses={serializedCourses} />;
}

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}
