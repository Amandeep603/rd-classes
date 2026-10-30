import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer/Footer.jsx";
import ScrollProgressBar from "@/components/ui/ScrollProgressBar";
import { FOOTER_CONTACT } from "@/constants/footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "R.D. Classes For Accountancy",
  description:
    "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad.",
  url: siteUrl,
  logo: `${siteUrl}/images/logo-rd.png`,
  telephone: FOOTER_CONTACT.phoneTel,
  email: FOOTER_CONTACT.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "SCF 59-60, 2nd Floor, Above Canara Bank, Near Dhingra Bakery, Sector 9",
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

export default function MarketingLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <ScrollProgressBar />
      <Navbar />
      <div className="flex-1 w-full flex flex-col pt-[var(--nav-h,84px)]">{children}</div>
      <Footer />
    </>
  );
}
