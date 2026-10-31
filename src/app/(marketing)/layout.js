import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer/Footer.jsx";
import ScrollProgressBar from "@/components/ui/ScrollProgressBar";
import { FOOTER_CONTACT, FOOTER_SOCIALS } from "@/constants/footer";
import { SITE_CONFIG } from "@/constants/site";

const siteUrl = "https://www.rd-classes.in";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "LocalBusiness"],
      "@id": `${siteUrl}/#organization`,
      name: "R.D. Classes for Accountancy",
      alternateName: "RD Classes",
      description:
        "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad, Haryana. Concept-first teaching by Ronak Dugar with consistent 100/100 board results.",
      url: siteUrl,
      logo: `${siteUrl}/images/logo-rd.png`,
      image: `${siteUrl}/images/og-image.png`,
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
      hasMap: FOOTER_CONTACT.mapsUrl,
      sameAs: [
        SITE_CONFIG.socialLinks.youtube,
        SITE_CONFIG.socialLinks.instagram,
        SITE_CONFIG.socialLinks.facebook,
        FOOTER_CONTACT.mapsUrl,
      ],
      areaServed: {
        "@type": "City",
        name: "Faridabad",
      },
      founder: {
        "@type": "Person",
        name: "Ronak Dugar",
        jobTitle: "Lead Accountancy Faculty",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "R.D. Classes for Accountancy",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-IN",
    },
  ],
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
