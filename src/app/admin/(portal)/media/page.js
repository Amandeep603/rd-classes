import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import { getMediaAssetsService } from "@/server/services/mediaService.js";
import PortalMediaView from "@/components/portal/admin/PortalMediaView.jsx";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Media Library | RD Classes Admin",
};

async function MediaContent({ searchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const kind = sp?.kind || "all";
  const search = sp?.q || "";
  const showArchived = sp?.archived === "true";
  const page = sp?.page ? parseInt(sp.page, 10) : 1;

  const data = await getMediaAssetsService({
    kind,
    search,
    showArchived,
    page,
    limit: 24,
  });

  return <PortalMediaView initialData={data} currentFilters={{ kind, search, showArchived, page }} />;
}

export default function AdminMediaPage(props) {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <MediaContent searchParams={props.searchParams} />
    </Suspense>
  );
}
