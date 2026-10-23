import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { getAdminLecturesByCourse } from "@/server/services/lectureService.js";
import PortalCourseDetailView from "@/components/portal/admin/PortalCourseDetailView.jsx";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectDB();
  const course = await Course.findById(id).select("title").lean();
  return {
    title: course ? `${course.title} | RD Classes Admin` : "Course | RD Classes Admin",
  };
}

export default async function AdminCourseLecturesPage({ params }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const { id } = await params;
  await connectDB();

  const [course, lectures, enrollments] = await Promise.all([
    Course.findById(id).lean(),
    getAdminLecturesByCourse(id),
    Enrollment.find({ courseId: id })
      .populate("userId", "name studentCode loginId phone")
      .lean(),
  ]);

  if (!course) {
    notFound();
  }

  const serializedCourse = JSON.parse(JSON.stringify(course));
  const serializedLectures = JSON.parse(JSON.stringify(lectures));
  const serializedEnrollments = JSON.parse(JSON.stringify(enrollments));

  return (
    <PortalCourseDetailView
      course={serializedCourse}
      lectures={serializedLectures}
      enrolledStudents={serializedEnrollments}
    />
  );
}

