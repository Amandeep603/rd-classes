import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import AdminApprovedDevicesView from "@/components/portal/admin/AdminApprovedDevicesView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Approved Devices | RD Classes Admin",
};

async function DevicesPageContent() {
  await requireAdmin();
  return <AdminApprovedDevicesView />;
}

export default function AdminDevicesPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <DevicesPageContent />
    </Suspense>
  );
}
