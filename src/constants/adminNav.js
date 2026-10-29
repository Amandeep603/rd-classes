/**
 * Admin Portal Navigation Configuration
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
    id: "enquiries",
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: "enquiries",
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
    id: "notes",
    label: "Notes",
    href: "/admin/notes",
    icon: "notes",
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
    id: "toppers",
    label: "Toppers",
    href: "/admin/toppers",
    icon: "toppers",
    enabled: true,
  },
  {
    id: "results",
    label: "Result PDFs",
    href: "/admin/result-pdfs",
    icon: "results",
    enabled: true,
  },
  {
    id: "gallery",
    label: "Gallery",
    href: "/admin/gallery",
    icon: "gallery",
    enabled: true,
  },
  {
    id: "reviews",
    label: "Reviews",
    href: "/admin/reviews",
    icon: "reviews",
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
    enabled: false,
  },
];

export const ADMIN_NAV_ITEMS = adminNavItems;
export default adminNavItems;
