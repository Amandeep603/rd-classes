import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { GalleryItem } from "@/lib/models/GalleryItem";
import PortalGalleryView from "@/components/portal/admin/PortalGalleryView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Classroom Gallery | Admin Portal",
};

async function GalleryContent() {
  await requireAdmin();
  await connectDB();

  const items = await GalleryItem.find().sort({ position: 1, createdAt: -1 }).lean();
  const serialized = JSON.parse(JSON.stringify(items));

  return <PortalGalleryView initialItems={serialized} />;
}

export default function GalleryAdminPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <GalleryContent />
    </Suspense>
  );
}
