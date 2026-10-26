import Link from "next/link";
import { BookOpen, Video, Users, ArrowRight } from "lucide-react";

export default function AdminCoursesOverviewCard({ courses = [] }) {
  const displayCourses = courses.slice(0, 4);

  return (
    <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111827]">
              Courses Overview
            </h3>
          </div>
        </div>

        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
        >
          <span>Manage</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Courses List */}
      {displayCourses.length > 0 ? (
        <div className="space-y-2.5">
          {displayCourses.map((course) => (
            <Link
              key={course._id}
              href={`/admin/courses/${course._id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-neutral-50/70 p-3 hover:bg-amber-50/50 hover:border-amber-200 transition-all group"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111827] truncate group-hover:text-amber-900">
                  {course.title}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#6B7280] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>{course.lecturesCount || 0} videos</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{course.studentsCount || 0} students</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    course.published
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {course.published ? "Live" : "Draft"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center space-y-2.5">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#111827]">No courses yet</p>
            <p className="text-[11px] text-[#6B7280]">
              Create your first course to start publishing lectures.
            </p>
          </div>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors"
          >
            <span>Add Course</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
