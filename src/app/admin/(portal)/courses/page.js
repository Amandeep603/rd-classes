import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import { getAdminCourses } from "@/server/services/courseService.js";
import PortalCoursesView from "@/components/portal/admin/PortalCoursesView.jsx";

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

  return <PortalCoursesView courses={serializedCourses} />;
}

