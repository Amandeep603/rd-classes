import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Announcement } from "@/server/db/models/Announcement.js";
import { Course } from "@/server/db/models/Course.js";
import PortalAnnouncementsView from "@/components/portal/admin/PortalAnnouncementsView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Announcements | RD Classes Admin",
};

async function AnnouncementsContent() {
  await requireAdmin();

  await connectDB();

  const [announcements, courses] = await Promise.all([
    Announcement.find().sort({ pinned: -1, createdAt: -1, startsAt: -1 }).lean(),
    Course.find().select("title").sort({ order: 1 }).lean(),
  ]);

  const serializedAnnouncements = JSON.parse(JSON.stringify(announcements));
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  return (
    <PortalAnnouncementsView
      announcements={serializedAnnouncements}
      courses={serializedCourses}
    />
  );
}

export default function AdminAnnouncementsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <AnnouncementsContent />
    </Suspense>
  );
}
