import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { getStudentDetail } from "@/server/services/studentService.js";
import PortalStudentDetailView from "@/components/portal/admin/PortalStudentDetailView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Student #${id.slice(-6)} | RD Classes Admin`,
  };
}

async function StudentDetailContent({ params }) {
  await requireAdmin();

  const { id } = await params;
  await connectDB();

  const [detail, allCourses] = await Promise.all([
    getStudentDetail(id),
    Course.find().select("_id title").lean(),
  ]);

  if (!detail || !detail.student) {
    notFound();
  }

  const serializedDetail = JSON.parse(JSON.stringify(detail));
  const serializedCourses = JSON.parse(JSON.stringify(allCourses));

  return (
    <PortalStudentDetailView
      student={serializedDetail.student}
      devices={serializedDetail.devices}
      sessions={serializedDetail.sessions}
      enrollments={serializedDetail.enrollments}
      recentActivity={serializedDetail.recentActivity}
      allCourses={serializedCourses}
      encryptionConfigured={Boolean(process.env.CREDENTIAL_ENC_KEY)}
    />
  );
}

export default function AdminStudentDetailPage(props) {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <StudentDetailContent params={props.params} />
    </Suspense>
  );
}
