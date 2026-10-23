import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import AdminLoginForm from "@/components/portal/auth/AdminLoginForm";

export const instant = false;

export const metadata = {
  title: "Admin Sign In | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const auth = await getCurrentUser();
  if (auth && auth.user.role === "admin") {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
