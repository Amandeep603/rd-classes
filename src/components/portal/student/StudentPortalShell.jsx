import { Suspense } from "react";
import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";
import StudentMobileNav from "./StudentMobileNav";

export default function StudentPortalShell({
  student,
  subtitle,
  classPill,
  whatsappNumber,
  notifications,
  children,
}) {
  return (
    <div
      className="student-shell min-h-screen text-[#1F2A44] antialiased"
      style={{
        background: "linear-gradient(180deg, #FFFBF2 0%, #FFFFFF 100%)",
      }}
    >
      <div className="mx-auto flex max-w-[1440px] gap-6 p-5 pb-24 md:pb-5">
        {/* Floating rounded desktop sidebar (28px radius, 256px wide) */}
        <Suspense fallback={<div className="hidden md:block w-[256px] shrink-0" />}>
          <StudentSidebar whatsappNumber={whatsappNumber} />
        </Suspense>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0" role="main">
          <StudentTopbar
            student={student}
            subtitle={subtitle}
            classPill={classPill}
            notifications={notifications}
          />
          <div className="portal-content-body">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <StudentMobileNav />
      </Suspense>
    </div>
  );
}
