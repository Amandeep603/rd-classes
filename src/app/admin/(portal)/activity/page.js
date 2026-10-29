import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { ActivityLog } from "@/lib/models/ActivityLog";
import PortalActivityView from "@/components/portal/admin/PortalActivityView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Activity Log | Admin Portal",
};

async function ActivityContent() {
  await requireAdmin();

  await connectDB();
  const rawLogs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("actorId", "name email loginId role")
    .lean();

  const serialized = JSON.parse(JSON.stringify(rawLogs));

  return <PortalActivityView initialLogs={serialized} />;
}

export default function AdminActivityPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ActivityContent />
    </Suspense>
  );
}
