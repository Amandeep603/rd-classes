import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import StudentPortalShell from "@/components/portal/student/StudentPortalShell";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Student Portal | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

async function StudentGate({ children }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "student") {
    redirect("/student/login");
  }

  return children;
}

export default function StudentPortalLayout({ children }) {
  return (
    <StudentPortalShell>
      <Suspense fallback={<StudentDashboardSkeleton />}>
        <StudentGate>{children}</StudentGate>
      </Suspense>
    </StudentPortalShell>
  );
}
