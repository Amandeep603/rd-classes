import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import CourseForm from "@/components/portal/admin/CourseForm.jsx";

export const instant = false;

export const metadata = {
  title: "New Course | RD Classes Admin",
};

export default async function AdminNewCoursePage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="portal-page-container">
      <CourseForm mode="new" />
    </div>
  );
}
