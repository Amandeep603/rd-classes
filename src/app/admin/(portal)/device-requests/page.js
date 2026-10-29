import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import DeviceRequestsView from "@/components/portal/admin/DeviceRequestsView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Device Requests | RD Classes Admin",
};

async function DeviceRequestsContent({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const status = params?.status || "pending";

  return <DeviceRequestsView initialStatus={status} />;
}

export default function DeviceRequestsPage(props) {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <DeviceRequestsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
