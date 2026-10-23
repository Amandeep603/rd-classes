import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { getStudentDetail } from "@/server/services/studentService.js";
import PortalStudentDetailView from "@/components/portal/admin/PortalStudentDetailView.jsx";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Student #${id.slice(-6)} | RD Classes Admin`,
  };
}

export default async function AdminStudentDetailPage({ params }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const { id } = await params;
  await connectDB();

  const [detail, allCourses] = await Promise.all([
    getStudentDetail(id),
    Course.find().select("_id title").lean(),
  ]);

  if (!detail || !detail.student) {
    notFound();
  }

  const serializedDetail = JSON.parse(JSON.stringify(detail));
  const serializedCourses = JSON.parse(JSON.stringify(allCourses));

  return (
    <PortalStudentDetailView
      student={serializedDetail.student}
      devices={serializedDetail.devices}
      sessions={serializedDetail.sessions}
      enrollments={serializedDetail.enrollments}
      recentActivity={serializedDetail.recentActivity}
      allCourses={serializedCourses}
    />
  );
}

