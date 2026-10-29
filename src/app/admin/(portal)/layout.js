import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import AdminPortalShell from "@/components/portal/admin/AdminPortalShell";
import { AdminDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Admin Portal | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

async function AdminPortalAuthGuard({ children }) {
  await requireAdmin();
  return children;
}

export default function AdminPortalLayout({ children }) {
  return (
    <AdminPortalShell>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminPortalAuthGuard>
          {children}
        </AdminPortalAuthGuard>
      </Suspense>
    </AdminPortalShell>
  );
}
