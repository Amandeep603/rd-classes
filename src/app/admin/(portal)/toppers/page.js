import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Topper } from "@/lib/models/Topper";
import PortalToppersView from "@/components/portal/admin/PortalToppersView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Board Toppers | Admin Portal",
};

async function ToppersContent() {
  await requireAdmin();
  await connectDB();

  const toppers = await Topper.find().sort({ year: -1, marks: -1, createdAt: -1 }).lean();
  const serialized = JSON.parse(JSON.stringify(toppers));

  return <PortalToppersView initialToppers={serialized} />;
}

export default function ToppersAdminPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ToppersContent />
    </Suspense>
  );
}
