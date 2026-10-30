import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  ArrowRight,
  ArrowUp,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import FooterWave from "./FooterWave";
import CurrentYear from "./CurrentYear";
import {
  WhatsAppIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/ui/BrandIcons";
import {
  FOOTER_COURSES,
  FOOTER_QUICK_LINKS,
  FOOTER_CONTACT,
  FOOTER_SOCIALS,
} from "@/constants/footer";

import { getCachedSettings } from "@/server/services/settingService.js";

const SOCIAL_ICON_MAP = {
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  Facebook: FacebookIcon,
  WhatsApp: WhatsAppIcon,
};

function FooterColumns({ dbSetting }) {
  const instituteName = dbSetting?.instituteName || "RD Classes for Accountancy";
  const phone = dbSetting?.phone || FOOTER_CONTACT.phoneDisplay;
  const rawPhone = dbSetting?.phone || FOOTER_CONTACT.phoneTel;
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phoneTel = phoneDigits.startsWith("91") ? `+${phoneDigits}` : `+91${phoneDigits}`;
  const whatsappNum = (dbSetting?.whatsapp || "918368545620").replace(/\D/g, "");
  const email = dbSetting?.email || FOOTER_CONTACT.email;
  const address = dbSetting?.address || FOOTER_CONTACT.address;

  const socials = FOOTER_SOCIALS.map((social) => {
    let href = social.href;
    if (dbSetting?.socialLinks) {
      if (social.platform === "Instagram" && dbSetting.socialLinks.instagram) {
        href = dbSetting.socialLinks.instagram;
      } else if (social.platform === "YouTube" && dbSetting.socialLinks.youtube) {
        href = dbSetting.socialLinks.youtube;
      } else if (social.platform === "Facebook" && dbSetting.socialLinks.facebook) {
        href = dbSetting.socialLinks.facebook;
      } else if (social.platform === "Telegram" && dbSetting.socialLinks.telegram) {
        href = dbSetting.socialLinks.telegram;
      } else if (social.platform === "WhatsApp" && whatsappNum) {
        href = `https://wa.me/${whatsappNum}`;
      }
    }
    return { ...social, href };
  });

  return (
    <div
      className="grid grid-cols-1 min-[520px]:grid-cols-2 min-[1100px]:grid-cols-[409fr_349fr_329fr_354fr] gap-8 min-[1100px]:gap-0 items-start"
    >
          {/* Column 1: Brand [79..488) -> 409fr (padding-right: 77u) */}
          <div className="col-span-1 min-[520px]:col-span-2 min-[1100px]:col-span-1 flex flex-col items-center min-[1100px]:items-start text-center min-[1100px]:text-left pr-0 min-[1100px]:pr-[calc(var(--su,1px)*77)]">
            {/* Logo (187u wide) */}
            <Link href="/" className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A]">
              <Image
                src="/images/logo-rd-light.png"
                alt="RD Classes for Accountancy"
                width={187}
                height={118}
                className="object-contain h-auto"
                style={{ width: "clamp(150px, 16vw, calc(var(--su, 1px) * 187))" }}
              />
            </Link>

            {/* Description (17u / 1.45) */}
            <p
              className="mt-4 min-[1100px]:mt-[calc(var(--su,1px)*18)] text-white/75 font-normal leading-[1.45] text-balance"
              style={{ fontSize: "clamp(14px, 1.6vw, calc(var(--su, 1px) * 17))" }}
            >
              Faridabad&apos;s premier Accountancy coaching institute for CBSE Class 11 &amp; 12, founded and personally taught by {dbSetting?.ownerName || "Ronak Dugar"} in Sector 9.
            </p>

            {/* Reward Pill (332u x 46u) */}
            <div
              className="mt-4 min-[1100px]:mt-[calc(var(--su,1px)*18)] rounded-[10px] flex items-center justify-center gap-2 px-3 border border-[#E8B000] bg-[rgba(255,194,26,0.06)]"
              style={{
                width: "clamp(260px, 100%, calc(var(--su, 1px) * 332))",
                height: "clamp(40px, 4.2vw, calc(var(--su, 1px) * 46))",
              }}
            >
              <Trophy className="w-4 h-4 text-[#F5C242] shrink-0" />
              <span
                className="font-bold text-[#F5C242] whitespace-nowrap"
                style={{ fontSize: "clamp(12px, 1.4vw, calc(var(--su, 1px) * 15))" }}
              >
                ₹5,100 reward for 100/100 board score
              </span>
            </div>

            {/* Social Icons Row (47u circles, y477-523) */}
            <div
              className="mt-5 min-[1100px]:mt-[calc(var(--su,1px)*20)] flex items-center gap-3 min-[1100px]:gap-[calc(var(--su,1px)*14)]"
            >
              {socials.map((social) => {
                const Icon = SOCIAL_ICON_MAP[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className="group rounded-full flex items-center justify-center border border-[#3A3A3C] transition-all duration-300 [@media(hover:hover)]:hover:bg-[#FFC21A] [@media(hover:hover)]:hover:-translate-y-1 active:scale-95"
                    style={{
                      width: "clamp(40px, 4.5vw, calc(var(--su, 1px) * 47))",
                      height: "clamp(40px, 4.5vw, calc(var(--su, 1px) * 47))",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white [@media(hover:hover)]:group-hover:text-[#121212] transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Courses [488..837) -> 349fr (1px left border, padding-left 50u) */}
          <div
            className="flex flex-col items-center min-[1100px]:items-start text-center min-[1100px]:text-left min-[1100px]:border-l min-[1100px]:border-white/8 min-[1100px]:min-h-[calc(var(--su,1px)*260)]"
            style={{
              paddingLeft: "clamp(0px, 3vw, calc(var(--su, 1px) * 50))",
            }}
          >
            <h4
              className="font-bold text-white relative pb-2.5"
              style={{ fontSize: "clamp(18px, 2vw, calc(var(--su, 1px) * 22))" }}
            >
              Courses
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 min-[1100px]:left-0 min-[1100px]:translate-x-0 rounded-full bg-[#F5B400]"
                style={{
                  width: "calc(var(--su, 1px) * 34)",
                  height: "calc(var(--su, 1px) * 3)",
                }}
              />
            </h4>

            <ul
              className="mt-5 min-[1100px]:mt-[calc(var(--su,1px)*20)] space-y-2 min-[1100px]:space-y-0"
              style={{
                fontSize: "clamp(14px, 1.5vw, calc(var(--su, 1px) * 16.5))",
              }}
            >
              {FOOTER_COURSES.map((course, idx) => (
                <li
                  key={idx}
                  className="min-[1100px]:h-[calc(var(--su,1px)*33)] flex items-center"
                >
                  <Link
                    href={course.href}
                    className="group inline-flex items-center text-[#D1D5DB] [@media(hover:hover)]:hover:text-[#FFC21A] transition-colors whitespace-nowrap"
                  >
                    <span className="transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-1">
                      {course.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links [837..1166) -> 329fr (1px left border, padding-left 45u) */}
          <div
            className="flex flex-col items-center min-[1100px]:items-start text-center min-[1100px]:text-left min-[1100px]:border-l min-[1100px]:border-white/8 min-[1100px]:min-h-[calc(var(--su,1px)*260)]"
            style={{
              paddingLeft: "clamp(0px, 3vw, calc(var(--su, 1px) * 45))",
            }}
          >
            <h4
              className="font-bold text-white relative pb-2.5"
              style={{ fontSize: "clamp(18px, 2vw, calc(var(--su, 1px) * 22))" }}
            >
              Quick Links
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 min-[1100px]:left-0 min-[1100px]:translate-x-0 rounded-full bg-[#F5B400]"
                style={{
                  width: "calc(var(--su, 1px) * 34)",
                  height: "calc(var(--su, 1px) * 3)",
                }}
              />
            </h4>

            <ul
              className="mt-5 min-[1100px]:mt-[calc(var(--su,1px)*20)] space-y-2 min-[1100px]:space-y-0"
              style={{
                fontSize: "clamp(14px, 1.5vw, calc(var(--su, 1px) * 16.5))",
              }}
            >
              {FOOTER_QUICK_LINKS.map((link, idx) => (
                <li
                  key={idx}
                  className="min-[1100px]:h-[calc(var(--su,1px)*33)] flex items-center"
                >
                  <Link
                    href={link.href}
                    className={`group inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      link.highlight
                        ? "text-[#FFC21A] font-bold [@media(hover:hover)]:hover:underline"
                        : "text-[#D1D5DB] [@media(hover:hover)]:hover:text-[#FFC21A]"
                    }`}
                  >
                    <span className="transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-1">
                      {link.label}
                    </span>
                    {link.highlight && (
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-1" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact [1166..1520) -> 354fr (1px left border, padding-left 47u) */}
          <div
            className="col-span-1 min-[520px]:col-span-2 min-[1100px]:col-span-1 flex flex-col items-center min-[1100px]:items-start text-center min-[1100px]:text-left min-[1100px]:border-l min-[1100px]:border-white/8 min-[1100px]:min-h-[calc(var(--su,1px)*260)]"
            style={{
              paddingLeft: "clamp(0px, 3vw, calc(var(--su, 1px) * 47))",
            }}
          >
            <h4
              className="font-bold text-white relative pb-2.5"
              style={{ fontSize: "clamp(18px, 2vw, calc(var(--su, 1px) * 22))" }}
            >
              Contact
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 min-[1100px]:left-0 min-[1100px]:translate-x-0 rounded-full bg-[#F5B400]"
                style={{
                  width: "calc(var(--su, 1px) * 34)",
                  height: "calc(var(--su, 1px) * 3)",
                }}
              />
            </h4>

            <div
              className="mt-5 min-[1100px]:mt-[calc(var(--su,1px)*20)] space-y-3.5 min-[1100px]:space-y-[calc(var(--su,1px)*14)]"
              style={{ fontSize: "clamp(14px, 1.5vw, calc(var(--su, 1px) * 16.5))" }}
            >
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#F5B400] shrink-0 mt-0.5" />
                <span className="text-[#D1D5DB] leading-snug whitespace-pre-line">
                  {address}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#F5B400] shrink-0" />
                <a
                  href={`tel:${phoneTel}`}
                  className="text-[#D1D5DB] [@media(hover:hover)]:hover:text-[#FFC21A] transition-colors whitespace-nowrap flex items-center"
                >
                  {phone}
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#F5B400] shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-[#D1D5DB] [@media(hover:hover)]:hover:text-[#FFC21A] transition-colors whitespace-nowrap flex items-center"
                >
                  {email}
                </a>
              </div>

              {/* Google Maps Directions Button */}
              <div className="pt-2">
                <a
                  href={dbSetting?.googleMapsUrl || FOOTER_CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full font-bold border border-[#E8B000] text-[#FFC21A] transition-all duration-300 [@media(hover:hover)]:hover:bg-[#FFC21A] [@media(hover:hover)]:hover:text-[#121212] active:scale-95 whitespace-nowrap"
                  style={{
                    width: "clamp(220px, 100%, calc(var(--su, 1px) * 242))",
                    height: "clamp(42px, 4.5vw, calc(var(--su, 1px) * 45))",
                    fontSize: "clamp(13px, 1.4vw, calc(var(--su, 1px) * 15))",
                  }}
                >
                  <MapPin className="w-4 h-4 text-inherit" />
                  <span>Google Maps Directions</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
  );
}

async function FooterDbColumns() {
  const dbSetting = await getCachedSettings();
  return <FooterColumns dbSetting={dbSetting} />;
}

export default function Footer() {
  return (
    <footer
      id="contact"
      aria-label="Site Footer and Contact Information"
      className="u-scope relative w-full bg-[#121212] text-white [isolation:isolate] overflow-hidden"
    >
      {/* 165u Wave Transition Band */}
      <FooterWave />

      {/* Main Footer Container (max-width 1600u capped, padding-inline 79u) */}
      <div
        className="relative z-10 w-full max-w-[calc(var(--su,1px)*1600)] mx-auto"
        style={{
          paddingLeft: "clamp(16px, 4.5vw, calc(var(--su, 1px) * 79))",
          paddingRight: "clamp(16px, 4.5vw, calc(var(--su, 1px) * 79))",
          paddingTop: "clamp(32px, 4vw, calc(var(--su, 1px) * 44))",
        }}
      >
        {/* Large Faint Graduation Cap Watermark (Bottom-Right, Decorative) */}
        <div
          className="absolute -bottom-10 -right-10 pointer-events-none opacity-8 text-[#1A1A1A] select-none -z-10"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 200 200"
            className="w-96 h-96 fill-current text-white/5"
          >
            <polygon points="100,20 180,60 100,100 20,60" />
            <path d="M 50 80 Q 100 120 150 80 L 150 115 Q 100 155 50 115 Z" />
            <path d="M 100 60 Q 160 80 170 120" stroke="currentColor" strokeWidth="6" fill="none" />
            <polygon points="165,120 175,120 170,145" />
          </svg>
        </div>

        {/* 4-Column Grid inside Suspense */}
        <Suspense fallback={<FooterColumns dbSetting={null} />}>
          <FooterDbColumns />
        </Suspense>

        {/* Bottom Bar: Divider at y557 + Copyright + Meta + Back to Top */}
        <div
          className="mt-12 min-[1100px]:mt-[calc(var(--su,1px)*36)] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-white/60"
          style={{
            paddingTop: "calc(var(--su, 1px) * 20)",
            paddingBottom: "calc(var(--su, 1px) * 26)",
            fontSize: "clamp(12px, 1.3vw, calc(var(--su, 1px) * 14.5))",
          }}
        >
          {/* Copyright */}
          <div>
            &copy; <CurrentYear /> RD Classes for Accountancy. All rights reserved. Directed by Ronak Dugar.
          </div>

          {/* Right Meta + Back to Top */}
          <div className="flex items-center flex-wrap justify-center gap-3">
            <span>CBSE Class 11 &amp; 12</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" aria-hidden="true" />
            <span>Sector 9, Faridabad</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" aria-hidden="true" />
            <a
              href="#top"
              className="group inline-flex items-center gap-1.5 text-white/80 [@media(hover:hover)]:hover:text-[#FFC21A] font-semibold transition-colors min-h-[44px]"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
