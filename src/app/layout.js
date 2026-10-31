import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "@/styles/themes.css";
import "./globals.css";

import Script from "next/script";

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

const siteUrl = "https://www.rd-classes.in";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Class 11 & 12 Accountancy in Faridabad | R.D. Classes",
  description:
    "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad, Haryana. Concept-first teaching by Ronak Dugar with 100/100 board results.",
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
    title: "Class 11 & 12 Accountancy in Faridabad | R.D. Classes",
    description:
      "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad, Haryana. Concept-first teaching by Ronak Dugar with 100/100 board results.",
    url: siteUrl,
    siteName: "R.D. Classes for Accountancy",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "R.D. Classes for Accountancy - Sector 9, Faridabad",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Class 11 & 12 Accountancy in Faridabad | R.D. Classes",
    description:
      "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad, Haryana. Concept-first teaching by Ronak Dugar with 100/100 board results.",
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/logo-rd.png",
  },
  manifest: "/manifest.webmanifest",
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
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${caveat.variable} antialiased dark overflow-x-clip`}
    >
      <body
        id="top"
        className="min-h-screen flex flex-col bg-[#0A0A0B] text-white selection:bg-[#FFB800] selection:text-[#0A0A0B] overflow-x-clip"
      >
        <Script
          id="motion-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: motionInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
