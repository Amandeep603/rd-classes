import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";
import StudentMobileNav from "./StudentMobileNav";

export default function StudentPortalShell({ student, subtitle, children }) {
  return (
    <div
      className="min-h-screen text-[#111827] antialiased"
      style={{
        background: "radial-gradient(ellipse at 8% 18%, rgba(230, 243, 253, 0.75) 0%, transparent 45%), #FDF9F0",
      }}
    >
      <div className="mx-auto flex max-w-[1536px] gap-6 p-4 sm:p-5 lg:p-6 pb-24 lg:pb-8">
        {/* Floating rounded desktop sidebar */}
        <StudentSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0" role="main">
          <StudentTopbar student={student} subtitle={subtitle} />
          <div className="portal-content-body">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <StudentMobileNav />
    </div>
  );
}
