import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import LoginForm from "@/components/student/LoginForm";

export const instant = false;

export const metadata = {
  title: "Student Login | RD Classes",
};

export default async function StudentLoginPage() {
  const auth = await getCurrentUser();
  if (auth && auth.user.role === "student") {
    redirect("/student");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0C]">
      <LoginForm />
    </div>
  );
}
