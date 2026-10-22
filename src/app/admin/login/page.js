import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const instant = false;

export const metadata = {
  title: "Admin Login | RD Classes",
};

export default async function AdminLoginPage() {
  const auth = await getCurrentUser();
  if (auth && auth.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0C]">
      <AdminLoginForm />
    </div>
  );
}
