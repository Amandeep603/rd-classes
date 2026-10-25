import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import { getMediaAssetsService } from "@/server/services/mediaService.js";
import PortalMediaView from "@/components/portal/admin/PortalMediaView.jsx";

export const instant = false;

export const metadata = {
  title: "Media Library | RD Classes Admin",
};

export default async function AdminMediaPage({ searchParams }) {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

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
