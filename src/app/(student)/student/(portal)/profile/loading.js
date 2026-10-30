export default function StudentProfileSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* 1. Hero Skeleton */}
      <div className="rounded-[24px] border border-amber-200/50 bg-[#FFFDF7] p-6 sm:p-7 h-[140px] flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100" />
          <div className="space-y-2.5">
            <div className="w-48 sm:w-64 h-7 bg-amber-100/80 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-amber-100/60 rounded-md" />
              <div className="w-16 h-6 bg-amber-100/60 rounded-md" />
            </div>
          </div>
        </div>
        <div className="w-20 h-9 bg-amber-100/60 rounded-xl hidden sm:block" />
      </div>

      {/* 2. Four Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[20px] p-5 border border-gray-100 bg-gray-50/80 h-[104px] space-y-3"
          >
            <div className="w-16 h-3 bg-gray-200 rounded" />
            <div className="w-24 h-6 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 3. Two-Column Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-[24px] border border-gray-100 bg-white p-6 sm:p-7 space-y-4">
          <div className="w-36 h-6 bg-gray-200 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-50 border border-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 rounded-[24px] border border-gray-100 bg-white p-6 sm:p-7 space-y-4">
          <div className="w-36 h-6 bg-gray-200 rounded-lg mb-4" />
          <div className="h-20 bg-gray-50 border border-gray-100 rounded-xl" />
          <div className="h-16 bg-amber-50/60 border border-amber-100 rounded-xl" />
          <div className="h-11 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* 4. My Courses Skeleton */}
      <div className="rounded-[24px] border border-gray-100 bg-white p-6 sm:p-7 space-y-4">
        <div className="w-32 h-6 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-50 border border-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 5. Recent Activity Skeleton */}
      <div className="rounded-[24px] border border-gray-100 bg-white p-6 sm:p-7 space-y-4">
        <div className="w-36 h-6 bg-gray-200 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-50 border border-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

