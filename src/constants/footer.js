import { getWhatsAppUrl } from "@/lib/whatsapp";

export const FOOTER_COURSES = [
  { label: "Class 12 Accountancy (Full Year)", href: "/courses/class-12-accountancy-full-year" },
  { label: "Class 11 Accountancy Foundation", href: "/courses/class-11-accountancy-foundation" },
  { label: "Class 12 Crash Course", href: "/courses/class-12-accountancy-crash-course" },
  { label: "Class 12 Recorded Portal", href: "/courses/class-12-accountancy-recorded-portal" },
  { label: "Class 12 Mock Test Series", href: "/courses/class-12-mock-test-series" },
  { label: "Class 11 Crash Course", href: "/courses/class-11-accountancy-crash-course" },
];

export const FOOTER_QUICK_LINKS = [
  { label: "About Ronak Sir", href: "/about" },
  { label: "Results & Toppers", href: "#results" },
  { label: "Classroom Gallery", href: "#gallery" },
  { label: "Chapter Notes & Formulas", href: "/notes" },
  { label: "Accountancy Blog", href: "/blog" },
  {
    label: "Student Portal Login",
    href: "/student/login",
    highlight: true,
  },
];

export const FOOTER_CONTACT = {
  address: "SCF 59-60, 2nd Floor, Sector 9,\nFaridabad, Haryana 121006",
  phoneDisplay: "+91 83685 45620",
  phoneTel: "+918368545620",
  email: "rdclasses177@gmail.com",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=SCF+59-60+Sector+9+Faridabad+Haryana+121006",
};

export const FOOTER_SOCIALS = [
  {
    platform: "Instagram",
    href: "https://www.instagram.com/rdclasses",
    ariaLabel: "Follow RD Classes on Instagram",
  },
  {
    platform: "YouTube",
    href: "https://www.youtube.com/@rdclasses",
    ariaLabel: "Subscribe to RD Classes on YouTube",
  },
  {
    platform: "Facebook",
    href: "https://www.facebook.com/rdclasses",
    ariaLabel: "Follow RD Classes on Facebook",
  },
  {
    platform: "WhatsApp",
    get href() {
      return getWhatsAppUrl("Hello RD Classes, I would like to connect on WhatsApp.");
    },
    ariaLabel: "Chat with RD Classes on WhatsApp",
  },
];
