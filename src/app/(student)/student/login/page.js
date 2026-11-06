import { redirect } from "next/navigation";
import { getStudentAuthStatus } from "@/server/auth/session.js";
import StudentLoginForm from "@/components/portal/auth/StudentLoginForm";

export const instant = false;

export const metadata = {
  title: "Student Login | RD Classes",
  robots: {
    index: false,
    follow: false,
  },
  other: {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  },
};

export default async function StudentLoginPage() {
  const auth = await getStudentAuthStatus();
  if (auth && auth.authenticated && auth.user.role === "student") {
    redirect("/student");
  }

  return <StudentLoginForm />;
}
