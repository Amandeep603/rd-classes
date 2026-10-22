import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import AdminHeader from "@/components/admin/AdminHeader";

export const instant = false;

export const metadata = {
  title: "Admin Console | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }) {
  const auth = await getCurrentUser();

  let pendingCount = 0;
  if (auth && auth.user.role === "admin") {
    await connectDB();
    pendingCount = await DeviceRequest.countDocuments({ status: "pending" });
  }

  return (
    <div className="admin-shell min-h-screen bg-[#0A0A0C] text-white flex flex-col font-sans">
      {auth && auth.user.role === "admin" && (
        <AdminHeader admin={auth.user} pendingCount={pendingCount} />
      )}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
