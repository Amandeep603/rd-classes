import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Test } from "@/server/db/models/Test.js";
import { TestResult } from "@/server/db/models/TestResult.js";
import { Course } from "@/server/db/models/Course.js";
import { User } from "@/server/db/models/User.js";
import PortalTestsView from "@/components/portal/admin/PortalTestsView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Mock Tests & Marks | RD Classes Admin",
};

async function TestsContent() {
  await requireAdmin();

  await connectDB();

  const [tests, courses, students, results] = await Promise.all([
    Test.find().sort({ startsAt: -1 }).lean(),
    Course.find().select("title").sort({ order: 1 }).lean(),
    User.find({ role: "student" })
      .select("name loginId className")
      .sort({ name: 1 })
      .lean(),
    TestResult.find().lean(),
  ]);

  const resultsMap = {};
  results.forEach((r) => {
    const tId = r.testId.toString();
    const uId = r.userId.toString();
    if (!resultsMap[tId]) resultsMap[tId] = {};
    resultsMap[tId][uId] = {
      score: r.score,
      maxScore: r.maxScore,
    };
  });

  const serializedTests = JSON.parse(JSON.stringify(tests));
  const serializedCourses = JSON.parse(JSON.stringify(courses));
  const serializedStudents = JSON.parse(JSON.stringify(students));

  return (
    <PortalTestsView
      tests={serializedTests}
      courses={serializedCourses}
      students={serializedStudents}
      initialResultsMap={resultsMap}
    />
  );
}

export default function AdminTestsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <TestsContent />
    </Suspense>
  );
}
