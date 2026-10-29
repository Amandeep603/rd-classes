import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import PortalAdminProfileView from "@/components/portal/admin/PortalAdminProfileView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Admin Profile | RD Classes",
};

async function ProfileContent() {
  const auth = await requireAdmin();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin-login");
  }

  await connectDB();
  const adminUser = await User.findById(auth.user._id)
    .select("name email phone loginId role photoUrl avatarUrl")
    .lean();

  if (!adminUser) {
    redirect("/admin-login");
  }

  const serialized = JSON.parse(JSON.stringify(adminUser));

  return <PortalAdminProfileView initialUser={serialized} />;
}

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
