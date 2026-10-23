import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { User } from "@/server/db/models/User.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { Device } from "@/server/db/models/Device.js";
import { Session } from "@/server/db/models/Session.js";
import { Course } from "@/server/db/models/Course.js";
import { Lecture } from "@/server/db/models/Lecture.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Announcement } from "@/server/db/models/Announcement.js";
import { AuditLog } from "@/server/db/models/AuditLog.js";
import AdminWelcomeBanner from "@/components/portal/admin/AdminWelcomeBanner";
import StatTile from "@/components/portal/ui/StatTile";
import AdminDeviceApprovalCard from "@/components/portal/admin/AdminDeviceApprovalCard";
import AdminRecentActivityCard from "@/components/portal/admin/AdminRecentActivityCard";
import AdminCoursesOverviewCard from "@/components/portal/admin/AdminCoursesOverviewCard";
import AdminAnnouncementsCard from "@/components/portal/admin/AdminAnnouncementsCard";
import {
  Users,
  Activity,
  Smartphone,
  Video,
  BookOpen,
  Award,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Admin Dashboard | RD Classes",
};

export default async function AdminDashboardPage() {
  const auth = await getCurrentUser();
  await connectDB();

  const [
    studentsCount,
    pendingRequestsCount,
    activeSessionsCount,
    coursesCount,
    lecturesCount,
    enrollmentsCount,
    pendingRequests,
    recentLogs,
    allCourses,
    activeAnnouncements,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    DeviceRequest.countDocuments({ status: "pending" }),
    Session.countDocuments(),
    Course.countDocuments({ published: true }),
    Lecture.countDocuments({ published: true }),
    Enrollment.countDocuments({ status: "active" }),
    DeviceRequest.find({ status: "pending" })
      .populate("userId", "name loginId studentCode deviceCount deviceLimit")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    AuditLog.find()
      .sort({ at: -1 })
      .limit(8)
      .populate("actorId", "name loginId")
      .lean(),
    Course.find({ published: true }).select("_id title slug published").lean(),
    Announcement.find({ active: true }).sort({ startsAt: -1 }).limit(5).lean(),
  ]);

  // Map active devices for pending students
  const studentIds = pendingRequests.map((r) => r.userId?._id).filter(Boolean);
  const activeDevices = await Device.find({ userId: { $in: studentIds } }).lean();

  const activeDevicesMap = {};
  for (const d of activeDevices) {
    const sId = d.userId.toString();
    if (!activeDevicesMap[sId]) activeDevicesMap[sId] = [];
    activeDevicesMap[sId].push(d);
  }

  // Count lectures and students per course
  const coursesWithCounts = await Promise.all(
    allCourses.map(async (c) => {
      const [lecCount, studCount] = await Promise.all([
        Lecture.countDocuments({ courseId: c._id, published: true }),
        Enrollment.countDocuments({ courseId: c._id, status: "active" }),
      ]);
      return {
        _id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        published: c.published,
        lecturesCount: lecCount,
        studentsCount: studCount,
      };
    })
  );

  const serializedRequests = JSON.parse(JSON.stringify(pendingRequests));
  const serializedLogs = JSON.parse(JSON.stringify(recentLogs));
  const serializedAnnouncements = JSON.parse(
    JSON.stringify(activeAnnouncements)
  );

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <AdminWelcomeBanner
        adminName={auth?.user?.name || "Ronak Sir"}
        courses={coursesWithCounts}
      />

      {/* 2. Six Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatTile
          icon={Users}
          value={studentsCount}
          label="Total Students"
          href="/admin/students"
          tone="yellow"
        />

        <StatTile
          icon={Activity}
          value={activeSessionsCount}
          label="Active Logins"
          href="/admin/students"
          tone="blue"
        />

        <StatTile
          icon={Smartphone}
          value={pendingRequestsCount}
          label="Pending Devices"
          href="/admin/device-requests"
          tone="red"
        />

        <StatTile
          icon={Video}
          value={lecturesCount}
          label="Recorded Videos"
          href="/admin/courses"
          tone="indigo"
        />

        <StatTile
          icon={BookOpen}
          value={coursesCount}
          label="Active Courses"
          href="/admin/courses"
          tone="green"
        />

        <StatTile
          icon={Award}
          value={enrollmentsCount}
          label="Enrolments"
          href="/admin/students"
          tone="purple"
        />
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (763 wide): Device Approval Requests + Recent Activity */}
        <div className="lg:col-span-7 space-y-6">
          <AdminDeviceApprovalCard
            requests={serializedRequests}
            activeDevicesMap={activeDevicesMap}
          />

          <AdminRecentActivityCard logs={serializedLogs} />
        </div>

        {/* Right Column (416 wide): Courses Overview + Announcements */}
        <div className="lg:col-span-5 space-y-6">
          <AdminCoursesOverviewCard courses={coursesWithCounts} />

          <AdminAnnouncementsCard announcements={serializedAnnouncements} />
        </div>
      </div>
    </div>
  );
}
