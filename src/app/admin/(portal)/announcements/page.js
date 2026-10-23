import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Announcement } from "@/server/db/models/Announcement.js";
import { Course } from "@/server/db/models/Course.js";
import PortalAnnouncementsView from "@/components/portal/admin/PortalAnnouncementsView.jsx";

export const instant = false;

export const metadata = {
  title: "Announcements | RD Classes Admin",
};

export default async function AdminAnnouncementsPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  await connectDB();

  const [announcements, courses] = await Promise.all([
    Announcement.find().sort({ startsAt: -1, createdAt: -1 }).lean(),
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
