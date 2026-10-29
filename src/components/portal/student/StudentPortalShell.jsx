"use client";

import { useState } from "react";
import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";

export default function StudentPortalShell({
  student,
  subtitle,
  classPill,
  whatsappNumber,
  notifications,
  activeCourses = [],
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="student-shell flex min-h-screen text-[#1F2A44] antialiased"
      style={{
        background: "linear-gradient(180deg, #FFFBF2 0%, #FFFFFF 100%)",
      }}
    >
      {/* 1. Desktop Sticky Sidebar (>= 1024px): attached to left edge, 260px, 100vh, no outer margin */}
      <div className="hidden lg:block shrink-0">
        <StudentSidebar whatsappNumber={whatsappNumber} />
      </div>

      {/* 2. Mobile/Tablet Slide-in Drawer (< 1024px) */}
      <div className="lg:hidden">
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-in Sidebar Panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <StudentSidebar
            whatsappNumber={whatsappNumber}
            onClose={() => setSidebarOpen(false)}
            isDrawer={true}
          />
        </div>
      </div>

      {/* 3. Main Content Area: fills remaining width, 24px desktop / 16px mobile padding, max-w ~1400px, left-aligned to sidebar */}
      <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 xl:p-7 max-w-[1400px]" role="main">
        <StudentTopbar
          student={student}
          subtitle={subtitle}
          classPill={classPill}
          notifications={notifications}
          activeCourses={activeCourses}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <div className="portal-content-body">{children}</div>
      </main>
    </div>
  );
}
