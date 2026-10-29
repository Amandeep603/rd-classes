import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/lib/models/Course";
import { Enquiry } from "@/lib/models/Enquiry";
import PortalEnquiriesView from "@/components/portal/admin/PortalEnquiriesView";
import { AdminDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Access Enquiries | RD Classes Admin",
  description: "View and manage student access requests and WhatsApp enquiries.",
};

async function EnquiriesContent() {
  await requireAdmin();
  await connectDB();

  const [enquiries, courses] = await Promise.all([
    Enquiry.find({})
      .populate("courseId", "title slug theme classLabel")
      .populate("studentId", "name loginId phone className")
      .sort({ createdAt: -1 })
      .lean(),
    Course.find({}).select("title slug theme").lean(),
  ]);

  const sanitizedEnquiries = JSON.parse(JSON.stringify(enquiries));
  const sanitizedCourses = JSON.parse(JSON.stringify(courses));

  return (
    <PortalEnquiriesView
      initialEnquiries={sanitizedEnquiries}
      courses={sanitizedCourses}
    />
  );
}

export default function AdminEnquiriesPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <EnquiriesContent />
    </Suspense>
  );
}
