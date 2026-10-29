import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Setting } from "@/lib/models/Setting";
import PortalSettingsView from "@/components/portal/admin/PortalSettingsView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Settings | Admin Portal",
};

async function SettingsContent() {
  const auth = await requireAdmin();

  await connectDB();
  let settings = await Setting.findOne().lean();
  if (!settings) {
    settings = {
      instituteName: "RD Classes",
      phone: "+91 83685 45620",
      whatsapp: "918368545620",
      email: "contact@rdclasses.com",
      address: "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006",
      socialLinks: {
        instagram: "https://instagram.com",
        youtube: "https://youtube.com",
        telegram: "https://telegram.org",
      },
      defaultMaxDevices: 1,
    };
  }

  const serialized = JSON.parse(JSON.stringify(settings));

  return (
    <PortalSettingsView
      initialSettings={serialized}
      admin={{
        name: auth.user.name,
        loginId: auth.user.loginId,
        email: auth.user.email,
      }}
    />
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
