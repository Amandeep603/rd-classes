import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Progress } from "@/server/db/models/Progress.js";
import ProgressBar from "@/components/portal/ui/ProgressBar";
import { BookOpen, Video, ArrowRight, Clock, Award, Sparkles } from "lucide-react";
import CourseIllustration from "@/components/courses/illustrations";

export const instant = false;

export const metadata = {
  title: "My Courses | RD Classes Student Portal",
};

export default async function StudentCoursesPage() {
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
            My Enrolled Courses
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Select a course to view all chapters, revision notes and video lectures
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCourses.map((course) => {
            const expiryStr = course.expiresAt
              ? new Date(course.expiresAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "Asia/Kolkata",
                })
              : "Full Academic Year";

            return (
              <div
                key={course._id}
                className="group flex flex-col justify-between rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] hover:shadow-lg transition-all"
              >
                <div>
                  {/* Thumbnail / Tone Illustration Banner */}
                  <div
                    className="relative flex h-36 w-full items-center justify-between rounded-2xl overflow-hidden mb-5 px-5 py-3 shadow-xs"
                    data-course-tone={course.tone}
                    style={{
                      background:
                        course.tone === "sky"
                          ? "linear-gradient(135deg, #DDEEFB 0%, #BAE0F7 100%)"
                          : course.tone === "yellow"
                          ? "linear-gradient(135deg, #FFF1C2 0%, #FEE58A 100%)"
                          : course.tone === "orange"
                          ? "linear-gradient(135deg, #FFE0D0 0%, #FCC4A8 100%)"
                          : course.tone === "green"
                          ? "linear-gradient(135deg, #DDF3E8 0%, #B7E7CE 100%)"
                          : course.tone === "purple"
                          ? "linear-gradient(135deg, #E8E2FB 0%, #D1C5F7 100%)"
                          : "linear-gradient(135deg, #FFE0DF 0%, #FCC0BE 100%)",
                    }}
                  >
                    <div className="flex flex-col gap-1.5 z-10">
                      <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 shadow-sm">
                        {course.classLabel}
                      </span>
                      {course.badgeText && (
                        <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>{course.badgeText}</span>
                        </span>
                      )}
                    </div>

                    <div className="relative w-24 h-24 shrink-0 drop-shadow-md z-10">
                      <CourseIllustration name={course.illustration} />
                    </div>
                  </div>

                  {/* Course Title */}
                  <h2 className="text-base font-extrabold text-[#111827] group-hover:text-amber-800 transition-colors line-clamp-2">
                    {course.title} {course.subtitle && <span className="font-normal text-slate-500">{course.subtitle}</span>}
                  </h2>
                  <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
                    {course.description || "Complete comprehensive accountancy syllabus coverage."}
                  </p>
                </div>

                <div className="mt-6 space-y-4 pt-4 border-t border-black/5">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#111827]">
                        {course.completedLectures} of {course.totalLectures} lectures
                      </span>
                      <span className="text-amber-600 font-extrabold">
                        {course.percent}%
                      </span>
                    </div>
                    <ProgressBar value={course.percent} max={100} tone="yellow" height={6} />
                  </div>

                  {/* Validity & CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      Valid until: <span className="font-semibold text-[#111827]">{expiryStr}</span>
                    </span>

                    <Link
                      href={`/student/courses/${course.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-3.5 py-2 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-all"
                    >
                      <span>Study</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-black/10 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
          <h3 className="text-base font-bold text-[#111827]">No Enrolled Courses</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            You have not been assigned any active courses yet. Please contact Sir on WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
