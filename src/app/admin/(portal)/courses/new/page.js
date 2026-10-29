import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import CourseForm from "@/components/portal/admin/CourseForm.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "New Course | RD Classes Admin",
};

async function NewCourseContent() {
  await requireAdmin();

  return (
    <div className="portal-page-container">
      <CourseForm mode="new" />
    </div>
  );
}

export default function AdminNewCoursePage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <NewCourseContent />
    </Suspense>
  );
}
