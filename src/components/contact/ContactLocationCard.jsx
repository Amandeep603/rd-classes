import Link from "next/link";
import { Navigation, MapPin, Phone, Mail } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

export default function ContactLocationCard({ settings }) {
  const address =
    settings?.address ||
    SITE_CONFIG.address ||
    "R.D. Classes for Accountancy, SCF 59-60, 2nd Floor, Above Canara Bank, Near Dhingra Bakery, Sector 9, Faridabad, Haryana";

  const phone =
    settings?.phoneDisplay ||
    settings?.phone ||
    SITE_CONFIG.contact.phoneDisplay ||
    "+91 83685 45620";

  const rawPhone = settings?.phone || SITE_CONFIG.contact.phoneTel || "+918368545620";
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phoneTel = phoneDigits.startsWith("91") ? `+${phoneDigits}` : `+91${phoneDigits}`;

  const email =
    settings?.email ||
    SITE_CONFIG.contact.email ||
    "rdclasses177@gmail.com";

  const googleMapsUrl =
    settings?.googleMapsUrl ||
    SITE_CONFIG.googleMapsUrl ||
    "https://maps.app.goo.gl/pugUPd8WhwRYYLGE8";

  const youtubeUrl =
    settings?.socialLinks?.youtube ||
    SITE_CONFIG.socialLinks?.youtube ||
    "https://youtube.com/@rd__classes?si=W94GkQ8Qegtcek3J";

  const instagramUrl =
    settings?.socialLinks?.instagram ||
    SITE_CONFIG.socialLinks?.instagram ||
    "https://www.instagram.com/rd___classes?igshid=OGQ5ZDc2ODk2ZA==";

  const facebookUrl =
    settings?.socialLinks?.facebook ||
    SITE_CONFIG.socialLinks?.facebook ||
    "https://www.facebook.com/profile.php?id=61584294945140";

  return (
    <div className="bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#ECEFF3] mt-10 sm:mt-14">
      {/* Header with yellow bar ABOVE the title */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="w-8 h-[3.5px] bg-[#FFB800] rounded-full mb-2" />
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1B3D] tracking-tight">
            Our Location
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Visit our centre for offline classes, counselling or any in-person assistance.
          </p>
        </div>

        {/* Get Directions pill button at top right */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-[#0B1B3D] shadow-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 text-[#0066FF] fill-[#0066FF] rotate-45" />
          <span>Get Directions</span>
        </a>
      </div>

      {/* Map Block: Static SVG, 185px height on desktop, no yellow roads, no interactive pill */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open R.D. Classes in Google Maps"
        className="block relative w-full h-[220px] sm:h-[195px] lg:h-[185px] rounded-[16px] overflow-hidden border border-[#E8ECEF] bg-[#F1F3EE] group cursor-pointer"
      >
        <svg
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          viewBox="0 0 1000 240"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base light grey ground */}
          <rect width="1000" height="240" fill="#EFEFEA" />

          {/* City blocks in lighter grey */}
          <g fill="#F9FAF8" opacity="0.9">
            <rect x="30" y="30" width="130" height="55" rx="6" />
            <rect x="180" y="20" width="120" height="65" rx="6" />
            <rect x="320" y="25" width="140" height="60" rx="6" />
            <rect x="480" y="30" width="110" height="55" rx="6" />

            <rect x="40" y="145" width="120" height="65" rx="6" />
            <rect x="180" y="140" width="130" height="70" rx="6" />
            <rect x="330" y="145" width="140" height="65" rx="6" />
            <rect x="490" y="140" width="120" height="70" rx="6" />

            <rect x="630" y="150" width="130" height="60" rx="6" />
          </g>

          {/* Soft green park patch on the right */}
          <path
            d="M720 0H1000V240C940 230 890 190 850 140C810 90 770 40 720 0Z"
            fill="#D5EAC9"
            opacity="0.85"
          />
          <path
            d="M840 100C900 150 940 190 1000 210V240H800C830 180 870 120 840 100Z"
            fill="#C6E2B7"
            opacity="0.75"
          />

          {/* Diagonal & orthogonal WHITE roads */}
          <path
            d="M0 110H1000"
            stroke="#FFFFFF"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M165 0V240"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M470 0V240"
            stroke="#FFFFFF"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M620 0V240"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M0 40L1000 200"
            stroke="#FFFFFF"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M310 0L240 240"
            stroke="#FFFFFF"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Road edge subtle grey guides */}
          <path
            d="M0 110H1000"
            stroke="#E2E8F0"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M0 40L1000 200"
            stroke="#E2E8F0"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Area labels - true labels only: Sector 9, Sector 9 Market, Faridabad */}
          <g fill="#64748B" fontSize="12" fontWeight="600" fontFamily="sans-serif">
            <text x="70" y="98" letterSpacing="0.4">
              Sector 9 Market
            </text>
            <text x="210" y="55" letterSpacing="0.4">
              Sector 9
            </text>
            <text x="800" y="195" letterSpacing="0.4" fill="#475569">
              Faridabad
            </text>
          </g>

          {/* Center White Pin Card with Red Pin */}
          <g transform="translate(420, 115)">
            {/* Ground pin drop shadow */}
            <ellipse cx="0" cy="4" rx="8" ry="3" fill="#000000" opacity="0.2" />

            {/* Red Pin */}
            <g transform="translate(-14, -30)">
              <path
                d="M14 0C6.268 0 0 6.268 0 14C0 24 14 34 14 34C14 34 28 24 28 14C28 6.268 21.732 0 14 0Z"
                fill="#EF4444"
              />
              <circle cx="14" cy="13" r="5" fill="#FFFFFF" />
            </g>

            {/* Connected White Pin Card */}
            <g transform="translate(20, -42)">
              <rect
                x="0"
                y="0"
                width="215"
                height="48"
                rx="8"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth="1"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.08))"
              />
              <text
                x="12"
                y="19"
                fill="#0F172A"
                fontSize="12"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                R.D. Classes for Accountancy
              </text>
              <text
                x="12"
                y="35"
                fill="#475569"
                fontSize="11"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                SCF 59-60, 2nd Floor, Sector 9
              </text>
            </g>
          </g>
        </svg>
      </a>

      {/* Slim Info Row: Address, Phone (tap to call), Email (tap to mail), and Social Icons */}
      <div className="mt-5 pt-5 border-t border-[#F1F5F9] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs sm:text-sm text-[#475569]">
        {/* Contact details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFB800] shrink-0" />
            <span className="font-medium text-[#1E293B] max-w-md truncate" title={address}>
              {address}
            </span>
          </div>

          {/* Phone */}
          <a
            href={`tel:${phoneTel}`}
            className="flex items-center gap-2 text-[#0B1B3D] hover:text-[#0066FF] font-semibold transition-colors"
            title="Call R.D. Classes"
          >
            <Phone className="w-4 h-4 text-[#FFB800] shrink-0" />
            <span>{phone}</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-[#0B1B3D] hover:text-[#0066FF] font-semibold transition-colors"
            title="Email R.D. Classes"
          >
            <Mail className="w-4 h-4 text-[#FFB800] shrink-0" />
            <span>{email}</span>
          </a>
        </div>

        {/* Simple Outline Social Icons (YouTube, Instagram, Facebook) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
          {/* YouTube */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube channel"
            className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:border-[#FFB800] hover:text-[#FFB800] flex items-center justify-center text-[#475569] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram page"
            className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:border-[#FFB800] hover:text-[#FFB800] flex items-center justify-center text-[#475569] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook page"
            className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:border-[#FFB800] hover:text-[#FFB800] flex items-center justify-center text-[#475569] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
