import { getCurrentUser } from "@/server/auth/session.js";
import StudentHeader from "@/components/student/StudentHeader";

export const instant = false;

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudentLayout({ children }) {
  const auth = await getCurrentUser();

  return (
    <div className="student-shell min-h-screen bg-[#0A0A0C] text-white flex flex-col font-sans">
      {auth && auth.user.role === "student" && <StudentHeader user={auth.user} />}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
