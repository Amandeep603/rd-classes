import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Settings } from "@/server/db/models/Settings.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import AdminPortalShell from "@/components/portal/admin/AdminPortalShell";
import { AdminDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Admin Portal | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPortalLayout({ children }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  await connectDB();
  const [settings, pendingCount] = await Promise.all([
    Settings.findOne().lean(),
    DeviceRequest.countDocuments({ status: "pending" }),
  ]);

  const workspaceName = settings?.workspaceName || "Ronak Sir Workspace";

  return (
    <AdminPortalShell
      adminUser={auth.user}
      initialPendingCount={pendingCount}
      workspaceName={workspaceName}
    >
      <Suspense fallback={<AdminDashboardSkeleton />}>
        {children}
      </Suspense>
    </AdminPortalShell>
  );
}
