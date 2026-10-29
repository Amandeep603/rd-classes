import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Test } from "@/server/db/models/Test.js";
import { TestResult } from "@/server/db/models/TestResult.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import PortalTestsView from "@/components/portal/student/PortalTestsView";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Tests & Results | RD Classes Student Portal",
};

async function StudentTestsContent() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;
  await connectDB();
  const now = new Date();

  // Active courses
  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select("courseId");

  const courseIds = enrollments.map((e) => e.courseId);

  // Upcoming tests
  const upcomingTestsDocs = await Test.find({
    published: true,
    startsAt: { $gte: now },
    $or: [
      { className: "All" },
      { className: auth.user.className || "12" },
      { courseId: { $in: courseIds } },
    ],
  })
    .sort({ startsAt: 1 })
    .lean();

  // Past test results
  const resultsDocs = await TestResult.find({ userId: auth.user._id })
    .populate("testId")
    .sort({ createdAt: -1 })
    .lean();

  let totalScore = 0;
  let totalMax = 0;
  resultsDocs.forEach((r) => {
    totalScore += r.score;
    totalMax += r.maxScore || 100;
  });

  const overallAvg =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const serializedUpcoming = upcomingTestsDocs.map((t) => ({
    _id: t._id.toString(),
    title: t.title,
    kind: t.kind || "Sunday Mock",
    startsAt: t.startsAt ? t.startsAt.toISOString() : null,
    durationMin: t.durationMin || 180,
    syllabus: t.syllabus || "",
    venue: t.venue || "",
  }));

  const serializedPast = resultsDocs.map((r) => ({
    _id: r._id.toString(),
    title: r.testId?.title || "Sunday Mock Test",
    score: r.score,
    maxScore: r.maxScore || 100,
    testDate: r.testId?.startsAt
      ? r.testId.startsAt.toISOString()
      : r.createdAt.toISOString(),
  }));

  return (
    <PortalTestsView
      upcomingTests={serializedUpcoming}
      pastResults={serializedPast}
      overallAvg={overallAvg}
    />
  );
}

export default function StudentTestsPage() {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentTestsContent />
    </Suspense>
  );
}
