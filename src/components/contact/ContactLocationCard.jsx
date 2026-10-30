import Link from "next/link";
import { Navigation, MapPin } from "lucide-react";
import { FOOTER_CONTACT } from "@/constants/footer";

export default function ContactLocationCard() {
  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=SCF+59-60+Sector+9+Faridabad+Haryana+121006";

  return (
    <div className="bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#ECEFF3] mt-10 sm:mt-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-[3px] bg-[#FFB800] rounded-full inline-block" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B1B3D] tracking-tight">
              Our Location
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Visit our centre for offline classes, counselling or any in-person assistance.
          </p>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs sm:text-sm font-bold text-[#0B1B3D] shadow-xs transition-colors group shrink-0"
        >
          <Navigation className="w-3.5 h-3.5 text-[#0066FF] fill-[#0066FF] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span>Get Directions</span>
        </a>
      </div>

      {/* Illustrated Vector Map Banner */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Click to open directions in Google Maps"
        className="block relative w-full h-[220px] sm:h-[260px] md:h-[280px] rounded-2xl overflow-hidden border border-[#E8ECEF] bg-[#F4F6F4] group cursor-pointer"
      >
        {/* Vector Map SVG */}
        <svg
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base ground */}
          <rect width="1000" height="400" fill="#F1F3EE" />

          {/* Green parks / vegetation areas */}
          <path
            d="M680 0H1000V240C920 220 860 170 820 120C780 70 730 30 680 0Z"
            fill="#DFF0D8"
            opacity="0.85"
          />
          <path
            d="M800 130C860 190 920 230 1000 250V400H650C690 320 740 210 800 130Z"
            fill="#D5EAC9"
            opacity="0.75"
          />
          <path
            d="M0 260C80 270 140 310 180 400H0V260Z"
            fill="#E2F2DB"
            opacity="0.8"
          />
          <path
            d="M120 40C190 50 250 110 270 180C210 180 150 140 120 40Z"
            fill="#EAF5E4"
            opacity="0.7"
          />

          {/* Urban blocks / parcels */}
          <g opacity="0.6">
            <rect x="50" y="80" width="130" height="70" rx="6" fill="#FFFFFF" />
            <rect x="220" y="60" width="110" height="90" rx="6" fill="#FFFFFF" />
            <rect x="360" y="40" width="160" height="80" rx="6" fill="#FFFFFF" />
            <rect x="550" y="50" width="90" height="70" rx="6" fill="#FFFFFF" />

            <rect x="40" y="210" width="140" height="80" rx="6" fill="#FFFFFF" />
            <rect x="230" y="190" width="170" height="100" rx="6" fill="#FFFFFF" />
            <rect x="430" y="240" width="140" height="90" rx="6" fill="#FFFFFF" />
            <rect x="600" y="260" width="120" height="80" rx="6" fill="#FFFFFF" />

            <rect x="370" y="140" width="150" height="70" rx="6" fill="#FFFFFF" />
          </g>

          {/* Secondary Roads (light grey) */}
          <path
            d="M0 180H1000"
            stroke="#FFFFFF"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            d="M200 0V400"
            stroke="#FFFFFF"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M540 0V400"
            stroke="#FFFFFF"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M740 0L640 400"
            stroke="#FFFFFF"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M0 60L1000 320"
            stroke="#FFFFFF"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M340 0V400"
            stroke="#FFFFFF"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Primary Avenue / Mathura Road & Sector 9 Connector */}
          <path
            d="M0 180H1000"
            stroke="#FDE68A"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M540 0V400"
            stroke="#E2E8F0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M0 60L1000 320"
            stroke="#FDE68A"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Road center dashes */}
          <path
            d="M0 180H1000"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="14 12"
            opacity="0.5"
          />
          <path
            d="M0 60L1000 320"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="12 10"
            opacity="0.4"
          />

          {/* Street and landmark labels */}
          <g fill="#64748B" fontSize="12" fontWeight="600" fontFamily="sans-serif">
            <text x="90" y="165" letterSpacing="0.5">
              Sector 9 Market
            </text>
            <text x="250" y="75" letterSpacing="0.5">
              Sector 9
            </text>
            <text x="400" y="55" letterSpacing="0.5">
              Sector 10
            </text>
            <text x="630" y="365" letterSpacing="0.5">
              Mathura Road (NH-19)
            </text>
            <text x="670" y="235" letterSpacing="0.5">
              Faridabad City Park
            </text>
          </g>

          {/* Landmark label: Sector 9 Market tag */}
          <g transform="translate(620, 150)">
            <rect
              x="-6"
              y="-14"
              width="145"
              height="38"
              rx="6"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1"
            />
            <text
              x="66"
              y="2"
              textAnchor="middle"
              fill="#1E293B"
              fontSize="11"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              Sector 9 Market
            </text>
            <text
              x="66"
              y="16"
              textAnchor="middle"
              fill="#64748B"
              fontSize="9.5"
              fontWeight="500"
              fontFamily="sans-serif"
            >
              Commercial Complex
            </text>
          </g>

          {/* PIN MARKER & ADDRESS CALLOUT CARD */}
          <g transform="translate(470, 180)">
            {/* Soft Pin Shadow */}
            <ellipse cx="0" cy="8" rx="10" ry="4" fill="#000000" opacity="0.25" />

            {/* Red Teardrop Pin */}
            <g transform="translate(-16, -36)">
              <path
                d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 40 16 40C16 40 32 27.5 32 16C32 7.163 24.837 0 16 0Z"
                fill="#EF4444"
              />
              <circle cx="16" cy="15" r="5.5" fill="#FFFFFF" />
            </g>

            {/* Address Card Bubble */}
            <g transform="translate(24, -48)">
              {/* Card background with shadow */}
              <rect
                x="0"
                y="0"
                width="168"
                height="56"
                rx="10"
                fill="#FFFFFF"
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              {/* Text inside card */}
              <text
                x="14"
                y="22"
                fill="#0F172A"
                fontSize="12.5"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                SCF 59-60, 2nd Floor
              </text>
              <text
                x="14"
                y="40"
                fill="#0B1B3D"
                fontSize="12"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                RD Classes, Sector 9
              </text>
            </g>
          </g>
        </svg>

        {/* Hover / Hint Badge */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-[#0B1B3D] transition-transform duration-200 group-hover:scale-105">
          <Navigation className="w-3 h-3 text-[#0066FF]" />
          <span>Open interactive map</span>
        </div>
      </a>
    </div>
  );
}

