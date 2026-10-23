import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import { getStudentEnrolledCourses } from "@/server/services/courseService.js";
import { getContinueWatching } from "@/server/services/progressService.js";
import { resolveDeviceContext } from "@/server/auth/device.js";
import ContinueWatchingCard from "@/components/student/ContinueWatchingCard";
import CourseCard from "@/components/student/CourseCard";
import { Smartphone, BookOpen, Sparkles } from "lucide-react";

export const instant = false;

export const metadata = {
  title: "My Courses | RD Classes Student Portal",
};

export default async function StudentDashboardPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    redirect("/student/login");
  }

  const [rawCourses, rawContinueWatching, deviceCtx] = await Promise.all([
    getStudentEnrolledCourses(auth.user._id),
    getContinueWatching(auth.user._id),
    resolveDeviceContext(),
  ]);

  const courses = JSON.parse(JSON.stringify(rawCourses));
  const continueWatching = rawContinueWatching ? JSON.parse(JSON.stringify(rawContinueWatching)) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#202026]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFB800] bg-[#FFB800]/10 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CBSE Class 11 & 12 Accountancy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {auth.user.name.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Access your concept lectures, revision sessions, and board exam drills.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#141418] border border-[#24242C] rounded-xl text-xs text-gray-300">
          <Smartphone className="w-3.5 h-3.5 text-[#FFB800]" />
          <span>Device:</span>
          <span className="font-semibold text-white">{deviceCtx.label}</span>
        </div>
      </div>

      {/* Continue Watching Section */}
      {continueWatching && <ContinueWatchingCard item={continueWatching} />}

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FFB800]" />
            <span>My Enrolled Courses</span>
          </h2>
          <span className="text-xs text-gray-400">
            {courses.length} course{courses.length === 1 ? "" : "s"}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-[#131316] border border-[#222226] rounded-2xl p-8 text-center max-w-md mx-auto">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No active enrollments yet</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4 leading-relaxed">
              Your account has not been enrolled in any batch courses yet. Contact RD Classes administration to activate your access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
