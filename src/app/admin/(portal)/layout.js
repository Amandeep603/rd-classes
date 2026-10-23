import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import AdminPortalShell from "@/components/portal/admin/AdminPortalShell";
import { AdminDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Admin Portal | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

async function AdminGate({ children }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  return children;
}

export default function AdminPortalLayout({ children }) {
  return (
    <AdminPortalShell>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </AdminPortalShell>
  );
}
