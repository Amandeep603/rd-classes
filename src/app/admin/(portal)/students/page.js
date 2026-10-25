import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { getStudentsList } from "@/server/services/studentService.js";
import PortalStudentsView from "@/components/portal/admin/PortalStudentsView";

export const instant = false;

export const metadata = {
  title: "Students | RD Classes Admin",
};

export default async function AdminStudentsPage({ searchParams }) {
  const auth = await getCurrentUser();
  const params = await searchParams;
  const search = params?.search || "";
  const status = params?.status || "";
  const noEmail = params?.noEmail === "true" || params?.emailFilter === "no-email";
  const page = parseInt(params?.page || "1", 10) || 1;

  await connectDB();

  const [{ students, total, totalPages }, availableCourses] = await Promise.all([
    getStudentsList({ search, status, noEmail, page, limit: 20 }),
    Course.find({ published: true }).select("_id title slug").lean(),
  ]);

  const serializedStudents = JSON.parse(JSON.stringify(students));
  const serializedCourses = JSON.parse(JSON.stringify(availableCourses));

  return (
    <PortalStudentsView
      students={serializedStudents}
      total={total}
      page={page}
      totalPages={totalPages}
      availableCourses={serializedCourses}
    />
  );
}
