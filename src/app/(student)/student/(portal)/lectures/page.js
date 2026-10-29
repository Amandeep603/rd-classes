import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/lib/models/Enrollment";
import { Course } from "@/lib/models/Course";
import { Lecture } from "@/lib/models/Lecture";
import { Progress } from "@/lib/models/Progress";
import CourseCard from "@/components/courses/CourseCard";
import { Video } from "lucide-react";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "My Lectures | RD Classes Student Portal",
};

async function StudentLecturesContent() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();
  const now = new Date();

  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("-paymentNote")
    .populate("courseId")
    .lean();

  const activeCourses = await Promise.all(
    enrollments
      .filter((e) => e.courseId && e.courseId.published)
      .map(async (e) => {
        const course = e.courseId;
        const totalLectures = await Lecture.countDocuments({
          courseId: course._id,
          published: true,
        });
        const completedLectures = await Progress.countDocuments({
          userId: auth.user._id,
          courseId: course._id,
          completed: true,
        });

        const percent =
          totalLectures > 0
            ? Math.min(100, Math.round((completedLectures / totalLectures) * 100))
            : 0;

        return {
          _id: course._id.toString(),
          title: course.title,
          subtitle: course.subtitle,
          slug: course.slug,
          classLabel: course.classLabel || "Class 12",
          badgeText: course.badgeText,
          tone: course.tone || "sky",
          illustration: course.illustration || "books-blue",
          description: course.description,
          thumbnail: course.thumbnail,
          expiresAt: e.expiresAt,
          totalLectures,
          completedLectures,
          percent,
        };
      })
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            My Enrolled Courses & Lectures
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Select a course to view all chapters, revision notes and video lectures
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              variant="student"
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 shadow-2xs">
            <Video className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">
            No Active Courses Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-[#6B7280]">
            You are not currently enrolled in any courses. Please contact RD Classes to get enrolled in your batch.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudentLecturesPage() {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentLecturesContent />
    </Suspense>
  );
}
