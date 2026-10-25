import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import CSVImportWizard from "@/components/portal/admin/CSVImportWizard";

export const instant = false;

export const metadata = {
  title: "Bulk CSV Import | RD Classes Admin",
};

export default async function AdminStudentImportPage() {
  await getCurrentUser();
  await connectDB();

  const availableCourses = await Course.find({ published: true })
    .select("_id title slug")
    .lean();

  const serializedCourses = JSON.parse(JSON.stringify(availableCourses));

  return <CSVImportWizard availableCourses={serializedCourses} />;
}
