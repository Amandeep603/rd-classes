import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { getAdminLecturesByCourse } from "@/server/services/lectureService.js";
import LecturesManager from "@/components/admin/LecturesManager";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectDB();
  const course = await Course.findById(id).select("title").lean();
  return {
    title: course ? `${course.title} Lectures | RD Classes Admin` : "Lectures | RD Classes Admin",
  };
}

export default async function AdminCourseLecturesPage({ params }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  const { id } = await params;
  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) {
    notFound();
  }

  const lectures = await getAdminLecturesByCourse(id);
  const serializedCourse = JSON.parse(JSON.stringify(course));
  const serializedLectures = JSON.parse(JSON.stringify(lectures));

  return <LecturesManager course={serializedCourse} lectures={serializedLectures} />;
}
