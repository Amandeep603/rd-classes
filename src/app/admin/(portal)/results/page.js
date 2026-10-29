import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { ResultPdf } from "@/lib/models/ResultPdf";
import PortalResultPdfsView from "@/components/portal/admin/PortalResultPdfsView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Result PDFs | Admin Portal",
};

async function ResultsContent() {
  await requireAdmin();
  await connectDB();

  const results = await ResultPdf.find().sort({ year: -1, createdAt: -1 }).lean();
  const serialized = JSON.parse(JSON.stringify(results));

  return <PortalResultPdfsView initialResults={serialized} />;
}

export default function ResultsAdminPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ResultsContent />
    </Suspense>
  );
}
