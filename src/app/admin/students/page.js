import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import {
  getStudentsList,
  generateNextLoginId,
} from "@/server/services/studentService.js";
import StudentsList from "@/components/admin/StudentsList";

export const instant = false;

export const metadata = {
  title: "Students | RD Classes Admin",
};

export default async function AdminStudentsPage({ searchParams }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params?.search || "";
  const status = params?.status || "";
  const page = parseInt(params?.page || "1", 10) || 1;

  await connectDB();

  const [{ students, total, totalPages }, availableCourses, nextLoginIdHint] =
    await Promise.all([
      getStudentsList({ search, status, page, limit: 20 }),
      Course.find({ published: true }).select("_id title").lean(),
      generateNextLoginId(),
    ]);

  const serializedStudents = JSON.parse(JSON.stringify(students));
  const serializedCourses = JSON.parse(JSON.stringify(availableCourses));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Student Accounts
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage enrolled students, single-device allowances, and credentials.
        </p>
      </div>

      <StudentsList
        students={serializedStudents}
        total={total}
        page={page}
        totalPages={totalPages}
        availableCourses={serializedCourses}
        nextLoginIdHint={nextLoginIdHint}
      />
    </div>
  );
}
