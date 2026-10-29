import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import {
  User,
  Device,
  Session,
  Lecture,
  Note,
  Topper,
  ResultPdf,
  ActivityLog,
} from "@/lib/models";
import AdminWelcomeBanner from "@/components/portal/admin/AdminWelcomeBanner";
import StatCard from "@/components/admin/ui/StatCard";
import AdminDeviceApprovalCard from "@/components/portal/admin/AdminDeviceApprovalCard";
import AdminRecentActivityCard from "@/components/portal/admin/AdminRecentActivityCard";
import AdminFeaturedToppersCard from "@/components/portal/admin/AdminFeaturedToppersCard";
import AdminResultPdfsCard from "@/components/portal/admin/AdminResultPdfsCard";
import { formatDeviceLabel } from "@/lib/utils/deviceLabel";
import {
  Users,
  Activity,
  Smartphone,
  Video,
  FileText,
  Award,
} from "lucide-react";

import { Suspense } from "react";
import { AdminDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Admin Dashboard | RD Classes",
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const auth = await requireAdmin();
  await connectDB();

  const now = new Date();

  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // 1. Stat card counts - isolated so any single failure defaults to 0 and logs
  const [
    studentsCount,
    studentsOnlineCount,
    pendingDevicesCount,
    lecturesCount,
    notesCount,
    toppersCount,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }).catch((err) => {
      console.error("[Dashboard] Error counting students:", err);
      return 0;
    }),
    Session.distinct("userId", {
      expiresAt: { $gt: now },
      revoked: { $ne: true },
      role: { $nin: ["admin"] },
      lastSeenAt: { $gte: thirtyMinsAgo },
    })
      .then((ids) => (ids ? ids.length : 0))
      .catch((err) => {
        console.error("[Dashboard] Error counting students online:", err);
        return 0;
      }),
    Device.countDocuments({ status: "pending" }).catch((err) => {
      console.error("[Dashboard] Error counting pending devices:", err);
      return 0;
    }),
    Lecture.countDocuments().catch((err) => {
      console.error("[Dashboard] Error counting lectures:", err);
      return 0;
    }),
    Note.countDocuments().catch((err) => {
      console.error("[Dashboard] Error counting notes:", err);
      return 0;
    }),
    Topper.countDocuments().catch((err) => {
      console.error("[Dashboard] Error counting toppers:", err);
      return 0;
    }),
  ]);

  // 2. Panel Queries - isolated so failures show an inline error inside that panel only
  let pendingRequests = [];
  let pendingRequestsError = null;
  let activeDevicesMap = {};

  try {
    pendingRequests = await Device.find({ status: "pending" })
      .populate("studentId", "name loginId deviceCount maxDevices deviceLimit")
      .sort({ requestedAt: -1, createdAt: -1 })
      .limit(6)
      .lean();

    // Map active devices for pending students
    const studentIds = pendingRequests
      .map((r) => r.studentId?._id || r.studentId)
      .filter(Boolean);

    if (studentIds.length > 0) {
      const activeDevices = await Device.find({
        studentId: { $in: studentIds },
        status: { $in: ["approved", "active"] },
      }).lean();

      for (const d of activeDevices) {
        const sId = (d.studentId?._id || d.studentId)?.toString();
        if (sId) {
          if (!activeDevicesMap[sId]) activeDevicesMap[sId] = [];
          activeDevicesMap[sId].push(d);
        }
      }
    }
  } catch (err) {
    console.error("[Dashboard] Error loading pending devices:", err);
    pendingRequestsError = err?.message || "Failed to load device requests";
  }

  // Format pending requests for DeviceApprovalCard compatibility
  const normalizedPendingRequests = pendingRequests.map((r) => {
    const student = r.studentId || null;
    return {
      _id: r._id.toString(),
      userId: student, // card accesses req.userId for student details
      deviceId: r.deviceId,
      label: formatDeviceLabel(r.deviceLabel || r.label || r.deviceName || "Personal Device", {
        model: r.model,
        os: r.os,
        deviceType: r.deviceType,
      }),
      userAgent: r.userAgent || "",
      ip: r.ip || "",
      status: r.status,
      requestedAt: r.requestedAt || r.createdAt,
      studentNote: r.studentNote || "",
    };
  });

  let recentLogs = [];
  let recentLogsError = null;
  try {
    recentLogs = await ActivityLog.find()
      .sort({ createdAt: -1, at: -1 })
      .limit(6)
      .populate("actorId", "name loginId")
      .lean();
  } catch (err) {
    console.error("[Dashboard] Error loading recent activity:", err);
    recentLogsError = err?.message || "Failed to load recent activity logs";
  }

  let featuredToppers = [];
  let toppersError = null;
  try {
    featuredToppers = await Topper.find({ featured: true })
      .sort({ year: -1, marks: -1 })
      .limit(4)
      .lean();
  } catch (err) {
    console.error("[Dashboard] Error loading featured toppers:", err);
    toppersError = err?.message || "Failed to load featured toppers";
  }

  let resultPdfs = [];
  let resultPdfsError = null;
  try {
    resultPdfs = await ResultPdf.find()
      .sort({ year: -1, createdAt: -1 })
      .limit(4)
      .lean();
  } catch (err) {
    console.error("[Dashboard] Error loading result PDFs:", err);
    resultPdfsError = err?.message || "Failed to load result PDFs";
  }

  const serializedRequests = JSON.parse(JSON.stringify(normalizedPendingRequests));
  const serializedLogs = JSON.parse(JSON.stringify(recentLogs));
  const serializedToppers = JSON.parse(JSON.stringify(featuredToppers));
  const serializedPdfs = JSON.parse(JSON.stringify(resultPdfs));

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <AdminWelcomeBanner adminName={auth?.user?.name || "Ronak Sir"} />

      {/* 2. Six Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          value={studentsCount}
          label="Total Students"
          href="/admin/students"
          tone="yellow"
        />

        <StatCard
          icon={Activity}
          value={studentsOnlineCount}
          label="Students Online"
          href="/admin/students"
          tone="blue"
        />

        <StatCard
          icon={Smartphone}
          value={pendingDevicesCount}
          label="Pending Devices"
          href="/admin/device-requests"
          tone="red"
        />

        <StatCard
          icon={Video}
          value={lecturesCount}
          label="Recorded Videos"
          href="/admin/lectures"
          tone="indigo"
        />

        <StatCard
          icon={FileText}
          value={notesCount}
          label="Chapter Notes"
          href="/admin/notes"
          tone="green"
        />

        <StatCard
          icon={Award}
          value={toppersCount}
          label="Board Toppers"
          href="/admin/toppers"
          tone="purple"
        />
      </div>

      {/* 3. Main 2-Column Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Device Approval Requests + Recent Activity */}
        <div className="lg:col-span-7 space-y-6">
          <AdminDeviceApprovalCard
            requests={serializedRequests}
            activeDevicesMap={activeDevicesMap}
            error={pendingRequestsError}
          />

          <AdminRecentActivityCard
            logs={serializedLogs}
            error={recentLogsError}
          />
        </div>

        {/* Right Column (5 cols): Featured Toppers + Result PDFs */}
        <div className="lg:col-span-5 space-y-6">
          <AdminFeaturedToppersCard
            toppers={serializedToppers}
            error={toppersError}
          />

          <AdminResultPdfsCard
            pdfs={serializedPdfs}
            error={resultPdfsError}
          />
        </div>
      </div>
    </div>
  );
}
