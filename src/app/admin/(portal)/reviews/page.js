import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Review } from "@/lib/models/Review";
import PortalReviewsView from "@/components/portal/admin/PortalReviewsView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Student & Parent Reviews | Admin Portal",
};

async function ReviewsContent() {
  await requireAdmin();
  await connectDB();

  const reviews = await Review.find().sort({ createdAt: -1 }).lean();
  const serialized = JSON.parse(JSON.stringify(reviews));

  return <PortalReviewsView initialReviews={serialized} />;
}

export default function ReviewsAdminPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ReviewsContent />
    </Suspense>
  );
}
