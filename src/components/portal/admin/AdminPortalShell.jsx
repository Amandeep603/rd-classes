"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { X } from "lucide-react";

export default function AdminPortalShell({
  adminUser,
  initialPendingCount = 0,
  workspaceName = "Ronak Sir Workspace",
  children,
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FBF8F1] text-[#111827] antialiased">
      {/* Desktop Persistent Sidebar */}
      <AdminSidebar
        initialPendingCount={initialPendingCount}
        adminUser={adminUser}
      />

      {/* Mobile Drawer Backdrop + Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex w-[280px] max-w-full flex-1 flex-col z-10">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar
              initialPendingCount={initialPendingCount}
              adminUser={adminUser}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopbar
          workspaceName={workspaceName}
          adminUser={adminUser}
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8" role="main">
          <div className="mx-auto max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
