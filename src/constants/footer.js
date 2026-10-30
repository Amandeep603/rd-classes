import { getWhatsAppUrl } from "@/lib/whatsapp";
import { SITE_CONFIG } from "@/constants/site";

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
  { label: "Results & Toppers", href: "/results" },
  { label: "Classroom Gallery", href: "/gallery" },
  { label: "Chapter Notes & Formulas", href: "/notes" },
  { label: "Contact Us", href: "/contact" },
  {
    label: "Student Portal Login",
    href: "/student/login",
    highlight: true,
  },
];

export const FOOTER_CONTACT = {
  address:
    "R.D. Classes for Accountancy, SCF 59-60, 2nd Floor, Above Canara Bank, Near Dhingra Bakery, Sector 9, Faridabad, Haryana",
  phoneDisplay: "+91 83685 45620",
  phoneTel: "+918368545620",
  email: "rdclasses177@gmail.com",
  mapsUrl: "https://maps.app.goo.gl/pugUPd8WhwRYYLGE8",
};

export const FOOTER_SOCIALS = [
  {
    platform: "Instagram",
    href: "https://www.instagram.com/rd___classes?igshid=OGQ5ZDc2ODk2ZA==",
    ariaLabel: "Follow R.D. Classes For Accountancy on Instagram",
  },
  {
    platform: "YouTube",
    href: "https://youtube.com/@rd__classes?si=W94GkQ8Qegtcek3J",
    ariaLabel: "Subscribe to R.D. Classes For Accountancy on YouTube",
  },
  {
    platform: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61584294945140",
    ariaLabel: "Follow R.D. Classes For Accountancy on Facebook",
  },
  {
    platform: "WhatsApp",
    get href() {
      return getWhatsAppUrl("Hello RD Classes, I would like to connect on WhatsApp.");
    },
    ariaLabel: "Chat with R.D. Classes For Accountancy on WhatsApp",
  },
];
