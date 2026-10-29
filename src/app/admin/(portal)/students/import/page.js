import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import CSVImportWizard from "@/components/portal/admin/CSVImportWizard";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Bulk CSV Import | RD Classes Admin",
};

async function ImportContent() {
  await getCurrentUser();
  await connectDB();

  const availableCourses = await Course.find({ published: true })
    .select("_id title slug")
    .lean();

  const serializedCourses = JSON.parse(JSON.stringify(availableCourses));

  return <CSVImportWizard availableCourses={serializedCourses} />;
}

export default function AdminStudentImportPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ImportContent />
    </Suspense>
  );
}
