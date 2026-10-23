/**
 * Student Portal Navigation Configuration
 * Feature flags govern visibility of secondary modules.
 */

export const studentNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/student",
    icon: "dashboard",
    enabled: true,
  },
  {
    id: "lectures",
    label: "Lectures",
    href: "/student/courses",
    icon: "lectures",
    enabled: true,
  },
  {
    id: "notes",
    label: "Notes",
    href: "/student/notes",
    icon: "notes",
    enabled: false, // Feature-gated: enabled in future release
  },
  {
    id: "tests",
    label: "Tests",
    href: "/student/tests",
    icon: "tests",
    enabled: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/student/profile",
    icon: "profile",
    enabled: true,
  },
];

export const STUDENT_NAV_ITEMS = studentNavItems;
