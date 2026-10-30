export const PORTAL_DATA = {
  badge: "24/7 STUDENT LEARNING PORTAL",
  badgeIcon: "Zap",
  heading: {
    line1: "Never Miss a Class With",
    line2Prefix: "Our ",
    highlight: "HD Video Player",
  },
  paragraph:
    "Missed a class for school competitions or need a late-night concept revision before your pre-boards? Log in to your private student dashboard anytime.",
  features: [
    {
      id: "feat-1",
      icon: "CirclePlay",
      tileBg: "var(--surface-f-tile-1, #FFE38F)",
      iconColor: "#1F2D44",
      title: "136 HD Recorded Video Lectures",
      description:
        "Complete syllabus with zero gaps — watch anytime at 1x to 2x speed.",
    },
    {
      id: "feat-2",
      icon: "FileText",
      tileBg: "var(--surface-f-tile-2, #BFDBF9)",
      iconColor: "#2B63B0",
      title: "Chapter-wise PDF Notes & Formula Sheets",
      description:
        "One-click access to handwritten solutions & board formula cheatsheets.",
    },
    {
      id: "feat-3",
      icon: "Monitor",
      tileBg: "var(--surface-f-tile-3, #FFC19C)",
      iconColor: "#1F2D44",
      title: "Cross-Device Progress Tracking",
      description:
        "Seamless resume watching across laptop, tablet and mobile browsers.",
    },
    {
      id: "feat-4",
      icon: "Headset",
      tileBg: "var(--surface-f-tile-4, #B8D9FA)",
      iconColor: "#2B63B0",
      title: "Direct Doubt Support for Enrolled Students",
      description:
        "Get personal answers within 24 hours on any tricky problem.",
    },
  ],
  buttons: {
    primary: {
      label: "Student Login",
      icon: "LogIn",
      href: "/student/login",
    },
    secondary: {
      label: "Explore Courses",
      href: "/courses",
    },
  },
  chips: [
    {
      id: "chip-notes",
      label: "PDF Notes",
      icon: "FileText",
      tone: "blue",
    },
    {
      id: "chip-speed",
      label: "Watch at 1x – 2x",
      icon: "Gauge",
      tone: "orange",
    },
    {
      id: "chip-devices",
      label: "Access on All Devices",
      icon: "Monitor",
      tone: "yellow",
    },
  ],
};
