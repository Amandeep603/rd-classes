/**
 * Site-wide configuration and content constants for RD Classes.
 * Single source of truth for site details, contact information, navigation, and social links.
 */

export const SITE_CONFIG = {
  name: "R.D. Classes For Accountancy",
  businessName: "R.D. Classes For Accountancy",
  tagline: "Accountancy Classes for Class 11 & 12, Faridabad",
  description:
    "Build confidence in Accountancy with R.D. Classes For Accountancy. Clear concepts, regular practice, and better preparation for Class 11 & 12 CBSE board exams in Faridabad.",
  website: "https://rd-classes.in/",
  address:
    "R.D. Classes for Accountancy, SCF 59-60, 2nd Floor, Above Canara Bank, Near Dhingra Bakery, Sector 9, Faridabad, Haryana",
  googleMapsUrl: "https://maps.app.goo.gl/pugUPd8WhwRYYLGE8",

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
    phone: "8368545620",
    phoneDisplay: "+91 83685 45620",
    phoneTel: "+918368545620",
    whatsappPhone: "918368545620",
    email: "rdclasses177@gmail.com",
    address:
      "R.D. Classes for Accountancy, SCF 59-60, 2nd Floor, Above Canara Bank, Near Dhingra Bakery, Sector 9, Faridabad, Haryana",
    googleMapsUrl: "https://maps.app.goo.gl/pugUPd8WhwRYYLGE8",
    enquiryMessage: "Hello RD Classes, I have an enquiry about Accountancy classes.",
    get whatsappUrl() {
      return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(this.enquiryMessage)}`;
    },
  },

  socialLinks: {
    youtube: "https://youtube.com/@rd__classes?si=W94GkQ8Qegtcek3J",
    instagram: "https://www.instagram.com/rd___classes?igshid=OGQ5ZDc2ODk2ZA==",
    facebook: "https://www.facebook.com/profile.php?id=61584294945140",
    googleMaps: "https://maps.app.goo.gl/pugUPd8WhwRYYLGE8",
    website: "https://rd-classes.in/",
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
    metaItems: ["CLASS 11", "CLASS 12", "ACCOUNTANCY"],
    headline: {
      line1: "Build",
      line2: "confidence in",
      line3: "Accountancy.",
    },
    subtext: {
      line1: "Clear concepts. Regular practice.",
      line2: "Better board preparation for Class 11 & 12.",
    },
  },
};
