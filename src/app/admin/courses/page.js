import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import { getAdminCourses } from "@/server/services/courseService.js";
import CoursesManager from "@/components/admin/CoursesManager";

export const instant = false;

export const metadata = {
  title: "Courses | RD Classes Admin",
};

export default async function AdminCoursesPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const courses = await getAdminCourses();
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CoursesManager courses={serializedCourses} />
    </div>
  );
}
