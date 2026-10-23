import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Settings } from "@/server/db/models/Settings.js";
import PortalSettingsView from "@/components/portal/admin/PortalSettingsView.jsx";

export const instant = false;

export const metadata = {
  title: "Settings | RD Classes Admin",
};

export default async function AdminSettingsPage() {
  const auth = await getCurrentUser();
  if (!auth || auth.user.role !== "admin") {
    redirect("/admin/login");
  }

  await connectDB();

  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = {
      workspaceName: "Ronak Sir Workspace",
      whatsappNumber: "+91 99999 99999",
      defaultDeviceLimit: 1,
      watermarkEnabled: true,
      rewardTargetText: "₹5,100 Cash Reward Target",
    };
  }

  const serializedSettings = JSON.parse(JSON.stringify(settings));

  return (
    <PortalSettingsView
      settings={serializedSettings}
      admin={{
        name: auth.user.name,
        loginId: auth.user.loginId,
      }}
    />
  );
}
