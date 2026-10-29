import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Course } from "@/lib/models/Course";
import { getStudentsListPaginated } from "@/server/services/studentAdminService.js";
import StudentsManagementView from "@/components/portal/admin/StudentsManagementView";
import { StudentsSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Students | RD Classes Admin",
};

async function StudentsContent({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;

  const search = params?.search || "";
  const status = params?.status || "";
  const device = params?.device || "";
  const course = params?.course || "";
  const page = parseInt(params?.page || "1", 10) || 1;

  await connectDB();

  const [{ students, total, totalPages }, availableCourses] = await Promise.all([
    getStudentsListPaginated({
      search,
      status,
      deviceFilter: device,
      courseId: course,
      page,
      limit: 20,
    }),
    Course.find({ $or: [{ status: "published" }, { published: true }] })
      .select("_id title slug")
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const serializedStudents = JSON.parse(JSON.stringify(students));
  const serializedCourses = JSON.parse(JSON.stringify(availableCourses));

  return (
    <StudentsManagementView
      initialStudents={serializedStudents}
      initialTotal={total}
      initialPage={page}
      initialTotalPages={totalPages}
      availableCourses={serializedCourses}
    />
  );
}

export default function AdminStudentsPage(props) {
  return (
    <Suspense fallback={<StudentsSkeleton />}>
      <StudentsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
