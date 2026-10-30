import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Lecture } from "@/lib/models/Lecture";

export default async function CourseLecturesSlugPage({ params }) {
  await connection();
  const resolvedParams = await params;
  const courseSlug = resolvedParams?.courseSlug;
  const auth = await getCurrentUser();
  if (!auth?.user) return null;

  await connectDB();

  // If courseSlug is actually a 24-char lecture ID, redirect to watch page
  if (/^[0-9a-fA-F]{24}$/.test(courseSlug)) {
    const isLec = await Lecture.findById(courseSlug).lean();
    if (isLec) {
      redirect(`/student/watch/${courseSlug}`);
    }
  }

  // Redirect to unified /student/lectures with selected course
  redirect(`/student/lectures?course=${encodeURIComponent(courseSlug)}`);
}
