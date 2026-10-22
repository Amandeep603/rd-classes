import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight } from "lucide-react";

export default function CourseCard({ course }) {
  const percent = course.progressPercent || 0;

  return (
    <div className="bg-[#131316] border border-[#222226] hover:border-[#383842] rounded-2xl overflow-hidden transition-all duration-200 flex flex-col group">
      {course.thumbnail ? (
        <div className="w-full h-44 bg-[#18181C] overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-[#1C1C22] to-[#121215] flex items-center justify-center border-b border-[#222226]">
          <BookOpen className="w-10 h-10 text-gray-600" />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-[#FFB800] transition-colors line-clamp-1">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#1F1F24]">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-400">Progress</span>
            <span className="font-semibold text-white">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-[#202026] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#FFB800] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              {course.completedLectures} / {course.totalLectures} completed
            </span>

            <Link
              href={`/student/courses/${course.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-[#FFB800] hover:underline"
            >
              <span>View Lectures</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
