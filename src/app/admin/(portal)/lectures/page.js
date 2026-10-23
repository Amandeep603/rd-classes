import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Course } from "@/server/db/models/Course.js";
import PortalLecturesView from "@/components/portal/admin/PortalLecturesView.jsx";

export const instant = false;

export const metadata = {
  title: "Lectures | RD Classes Admin",
};

export default async function AdminLecturesPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  await connectDB();

  const [lectures, courses] = await Promise.all([
    Lecture.find()
      .populate("courseId", "title slug")
      .sort({ courseId: 1, order: 1 })
      .lean(),
    Course.find().select("title slug").sort({ order: 1 }).lean(),
  ]);

  const serializedLectures = JSON.parse(JSON.stringify(lectures));
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  return (
    <PortalLecturesView
      lectures={serializedLectures}
      courses={serializedCourses}
    />
  );
}
