import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "@/styles/themes.css";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer/Footer";
import ScrollProgressBar from "@/components/ui/ScrollProgressBar";
import { SITE_CONFIG } from "@/constants/site";
import { FOOTER_CONTACT } from "@/constants/footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "RD Classes | Accountancy Classes for Class 11 & 12 in Sector 9, Faridabad",
  description:
    "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad. Concept-first teaching by Ronak Dugar, consistent 95+ and 100/100 board results, and 24/7 student learning portal.",
  keywords: [
    "RD Classes",
    "Accountancy Classes",
    "Class 11 Accountancy",
    "Class 12 Accountancy",
    "Accountancy Coaching Faridabad",
    "CBSE Commerce Coaching",
    "Ronak Dugar Accountancy",
    "Sector 9 Faridabad Coaching",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "RD Classes | Accountancy Classes for Class 11 & 12 in Sector 9, Faridabad",
    description:
      "Faridabad's premier Accountancy coaching institute for CBSE Class 11 & 12, founded and personally taught by Ronak Dugar in Sector 9.",
    url: siteUrl,
    siteName: "RD Classes",
    images: [
      {
        url: "/images/logo-rd.png",
        width: 670,
        height: 425,
        alt: "RD Classes for Accountancy",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RD Classes | Accountancy Classes for Class 11 & 12 in Sector 9, Faridabad",
    description:
      "Faridabad's premier Accountancy coaching institute for CBSE Class 11 & 12, taught by Ronak Dugar.",
    images: ["/images/logo-rd.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/logo-rd.png",
  },
};

const motionInitScript = `
  (function() {
    try {
      var force = "${process.env.NEXT_PUBLIC_FORCE_MOTION || ""}";
      var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var motion = (prefersReduce && force !== "1") ? "reduce" : "full";
      document.documentElement.dataset.motion = motion;
      document.documentElement.dataset.js = "1";
    } catch(e) {
      document.documentElement.dataset.motion = "full";
      document.documentElement.dataset.js = "1";
    }
  })();
`;

export default function RootLayout({ children }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "RD Classes for Accountancy",
    description:
      "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad.",
    url: siteUrl,
    logo: `${siteUrl}/images/logo-rd.png`,
    telephone: FOOTER_CONTACT.phoneTel,
    email: FOOTER_CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "SCF 59-60, 2nd Floor, Sector 9 Market",
      addressLocality: "Faridabad",
      addressRegion: "Haryana",
      postalCode: "121006",
      addressCountry: "IN",
    },
    areaServed: {
      "@type": "City",
      name: "Faridabad",
    },
    founder: {
      "@type": "Person",
      name: "Ronak Dugar",
      jobTitle: "Lead Accountancy Faculty",
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${caveat.variable} antialiased dark overflow-x-clip`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body
        id="top"
        className="min-h-screen flex flex-col bg-[#0A0A0B] text-white selection:bg-[#FFB800] selection:text-[#0A0A0B] overflow-x-clip"
      >
        <ScrollProgressBar />
        <Navbar />
        <div className="flex-1 w-full flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
