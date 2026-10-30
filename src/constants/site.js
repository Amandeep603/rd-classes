/**
 * Site-wide configuration and content constants for RD Classes.
 * All text content, navigation items, CTA definitions, and hero copy live here.
 */

export const SITE_CONFIG = {
  name: "RD Classes",
  tagline: "Accountancy Classes for Class 11 & 12, Faridabad",
  description:
    "Build confidence in Accountancy with RD Classes. Clear concepts, regular practice, and better preparation for Class 11 & 12 CBSE board exams in Faridabad.",

  // Nav Items array (Center nav on desktop, full-width drawer on mobile)
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Notes", href: "/notes" },
    { label: "Results", href: "/results" },
    { label: "Gallery", href: "/gallery" },
    { label: "About", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ],

  contact: {
    phone: "918368545620",
    enquiryMessage: "Hello RD Classes, I have an enquiry about Accountancy classes.",
    get whatsappUrl() {
      return `https://wa.me/${this.phone}?text=${encodeURIComponent(this.enquiryMessage)}`;
    },
  },

  cta: {
    studentLogin: {
      label: "Student Login",
      href: "/student/login",
    },
    enquire: {
      label: "Enquire Now",
      get href() {
        return SITE_CONFIG.contact.whatsappUrl;
      },
    },
    exploreCourses: {
      label: "Explore Courses",
      href: "#programs",
    },
    getInTouch: {
      label: "Get in Touch",
      href: "/contact",
    },
  },

  hero: {
    eyebrow: "ACCOUNTANCY CLASSES FOR 11 & 12",
    headline: {
      line1: "Build",
      line2: "confidence in",
      line3: "Accountancy.",
    },
    subtext: {
      line1: "Clear concepts. Regular practice.",
      line2: "Better preparation.",
    },
    metaItems: ["CLASS 11", "CLASS 12", "ACCOUNTANCY"],
  },
};
