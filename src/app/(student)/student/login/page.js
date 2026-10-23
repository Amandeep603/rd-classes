import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session.js";
import StudentLoginForm from "@/components/portal/auth/StudentLoginForm";

export const instant = false;

export const metadata = {
  title: "Student Login | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudentLoginPage() {
  const auth = await getCurrentUser();
  if (auth && auth.user.role === "student") {
    redirect("/student");
  }

  return <StudentLoginForm />;
}
