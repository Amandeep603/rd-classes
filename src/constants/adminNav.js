/**
 * Admin Portal Navigation Configuration
 * Feature flags govern visibility of admin modules.
 */

export const adminNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    enabled: true,
  },
  {
    id: "students",
    label: "Students",
    href: "/admin/students",
    icon: "students",
    enabled: true,
  },
  {
    id: "devices",
    label: "Device Requests",
    href: "/admin/device-requests",
    icon: "devices",
    hasBadge: true,
    enabled: true,
  },
  {
    id: "courses",
    label: "Courses",
    href: "/admin/courses",
    icon: "courses",
    enabled: true,
  },
  {
    id: "lectures",
    label: "Lectures",
    href: "/admin/lectures",
    icon: "lectures",
    enabled: true,
  },
  {
    id: "tests",
    label: "Tests",
    href: "/admin/tests",
    icon: "tests",
    enabled: true,
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/admin/announcements",
    icon: "announcements",
    enabled: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: "settings",
    enabled: true,
  },
  {
    id: "activity",
    label: "Activity",
    href: "/admin/activity",
    icon: "activity",
    enabled: true,
  },
  // Feature-gated modules (hidden behind flags until arrival in next prompts)
  {
    id: "notes",
    label: "Notes",
    href: "/admin/notes",
    icon: "notes",
    enabled: true,
  },
  {
    id: "toppers",
    label: "Toppers",
    href: "/admin/toppers",
    icon: "toppers",
    enabled: false,
  },
  {
    id: "results",
    label: "Result PDFs",
    href: "/admin/results",
    icon: "results",
    enabled: false,
  },
  {
    id: "gallery",
    label: "Gallery",
    href: "/admin/gallery",
    icon: "gallery",
    enabled: false,
  },
  {
    id: "reviews",
    label: "Reviews",
    href: "/admin/reviews",
    icon: "reviews",
    enabled: false,
  },
  {
    id: "media",
    label: "Media",
    href: "/admin/media",
    icon: "media",
    enabled: true,
  },
];

export const ADMIN_NAV_ITEMS = adminNavItems;
