"use client";

export default function NotesHeroIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 640 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {/* Soft shadow filter for floating elements */}
        <filter id="nhi-soft-shadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0B1B3D" floodOpacity="0.12" />
        </filter>
        <filter id="nhi-book-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0B1B3D" floodOpacity="0.14" />
        </filter>

        {/* Book Gradients */}
        {/* Top Book: Muted Steel-Blue #3F6791 */}
        <linearGradient id="nhi-book-steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4B77A3" />
          <stop offset="50%" stopColor="#3F6791" />
          <stop offset="100%" stopColor="#2E5075" />
        </linearGradient>

        {/* Middle Book: Warm Cream #E6D8B8 */}
        <linearGradient id="nhi-book-cream" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F2E6CC" />
          <stop offset="50%" stopColor="#E6D8B8" />
          <stop offset="100%" stopColor="#D5C5A0" />
        </linearGradient>

        {/* Bottom Book: Dark Navy #1E3F66 */}
        <linearGradient id="nhi-book-navy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#254D7A" />
          <stop offset="50%" stopColor="#1E3F66" />
          <stop offset="100%" stopColor="#142B47" />
        </linearGradient>
      </defs>

      {/* Artwork centered in its 640x440 viewBox */}
      <g transform="translate(320, 220) scale(0.92) translate(-320, -215)">
        {/* 1. SOFT GROUND SHADOW ELLIPSE UNDER EVERYTHING */}
        <g opacity="0.9">
          <ellipse cx="325" cy="400" rx="275" ry="18" fill="#0B1B3D" fillOpacity="0.07" />
          <ellipse cx="325" cy="400" rx="200" ry="11" fill="#0B1B3D" fillOpacity="0.09" />
          <ellipse cx="325" cy="400" rx="120" ry="6" fill="#0B1B3D" fillOpacity="0.12" />
        </g>

        {/* 2. GREEN POTTED PLANT ON THE LEFT (about 150 tall) */}
        <g id="potted-plant" transform="translate(24, 245)">
          <ellipse cx="62" cy="155" rx="36" ry="6" fill="#0B1B3D" fillOpacity="0.10" />
          <path
            d="M30 92 L41 148 Q43 154 53 154 L71 154 Q81 154 83 148 L94 92 Z"
            fill="#D97706"
          />
          <rect x="25" y="82" width="74" height="12" rx="4" fill="#B45309" />
          <ellipse cx="62" cy="84" rx="31" ry="4" fill="#78350F" />

          {/* Lush Green Foliage */}
          <path d="M62 84 C40 60 20 54 4 30 C28 36 46 56 62 82" fill="#15803D" />
          <path d="M62 84 C50 42 34 14 18 -6 C40 6 54 38 62 82" fill="#16A34A" />
          <path d="M62 82 C60 28 64 -2 62 -22 C70 4 70 34 62 82" fill="#4ADE80" />
          <path d="M62 84 C66 36 80 8 100 -14 C94 14 84 50 62 84" fill="#22C55E" />
          <path d="M62 84 C78 50 98 34 118 20 C104 46 84 66 62 84" fill="#15803D" />
          <path d="M62 84 C48 64 36 50 24 44 C42 50 56 64 62 84" fill="#86EFAC" opacity="0.7" />
        </g>

        {/* 3. STACK OF 3 HARDCOVER BOOKS CENTERED (rotated ~3 degrees, ~380 wide x 90 tall) */}
        <g transform="rotate(-3, 320, 255)" filter="url(#nhi-book-shadow)">
          {/* --- BOTTOM BOOK: DARK NAVY #1E3F66 with white text "RESULTS" --- */}
          <g id="book-results">
            <rect x="125" y="286" width="380" height="90" rx="10" fill="url(#nhi-book-navy)" />
            <path d="M125 298 Q125 286 137 286 H147 V376 H137 Q125 376 125 364 Z" fill="#112742" opacity="0.95" />
            <line x1="148" y1="286" x2="148" y2="376" stroke="#376395" strokeWidth="1.5" opacity="0.4" />
            
            <rect x="473" y="294" width="26" height="74" rx="4" fill="#FAF5E8" />
            <line x1="476" y1="304" x2="495" y2="304" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="476" y1="314" x2="495" y2="314" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="476" y1="324" x2="495" y2="324" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="476" y1="334" x2="495" y2="334" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="476" y1="344" x2="495" y2="344" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="476" y1="354" x2="495" y2="354" stroke="#DFD5C0" strokeWidth="1.2" />

            <text
              x="305"
              y="341"
              fill="#FFFFFF"
              fontSize="26"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="3"
              textAnchor="middle"
            >
              RESULTS
            </text>
          </g>

          {/* --- MIDDLE BOOK: CREAM #E6D8B8 with navy text "PRACTICE" --- */}
          <g id="book-practice">
            <rect x="113" y="201" width="380" height="90" rx="10" fill="url(#nhi-book-cream)" />
            <path d="M113 213 Q113 201 125 201 H135 V291 H125 Q113 291 113 279 Z" fill="#CBBFA1" opacity="0.85" />
            <line x1="136" y1="201" x2="136" y2="291" stroke="#FFFDF8" strokeWidth="1.5" opacity="0.6" />

            <rect x="461" y="209" width="26" height="74" rx="4" fill="#FFFDF8" />
            <line x1="464" y1="219" x2="483" y2="219" stroke="#D8CEB8" strokeWidth="1.2" />
            <line x1="464" y1="229" x2="483" y2="229" stroke="#D8CEB8" strokeWidth="1.2" />
            <line x1="464" y1="239" x2="483" y2="239" stroke="#D8CEB8" strokeWidth="1.2" />
            <line x1="464" y1="249" x2="483" y2="249" stroke="#D8CEB8" strokeWidth="1.2" />
            <line x1="464" y1="259" x2="483" y2="259" stroke="#D8CEB8" strokeWidth="1.2" />
            <line x1="464" y1="269" x2="483" y2="269" stroke="#D8CEB8" strokeWidth="1.2" />

            <text
              x="293"
              y="256"
              fill="#0B2A4A"
              fontSize="26"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="3"
              textAnchor="middle"
            >
              PRACTICE
            </text>
          </g>

          {/* --- TOP BOOK: MUTED STEEL-BLUE #3F6791 with white text "ACCOUNTS" --- */}
          <g id="book-accounts">
            <rect x="127" y="116" width="380" height="90" rx="10" fill="url(#nhi-book-steel)" />
            <path d="M127 128 Q127 116 139 116 H149 V206 H139 Q127 206 127 194 Z" fill="#2B4D72" opacity="0.9" />
            <line x1="150" y1="116" x2="150" y2="206" stroke="#658FB8" strokeWidth="1.5" opacity="0.5" />

            <rect x="475" y="124" width="26" height="74" rx="4" fill="#FAF5E8" />
            <line x1="478" y1="134" x2="497" y2="134" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="478" y1="144" x2="497" y2="144" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="478" y1="154" x2="497" y2="154" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="478" y1="164" x2="497" y2="164" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="478" y1="174" x2="497" y2="174" stroke="#DFD5C0" strokeWidth="1.2" />
            <line x1="478" y1="184" x2="497" y2="184" stroke="#DFD5C0" strokeWidth="1.2" />

            <text
              x="307"
              y="171"
              fill="#FFFFFF"
              fontSize="26"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="3"
              textAnchor="middle"
            >
              ACCOUNTS
            </text>
          </g>

          {/* 4. LEANING PDF SHEET */}
          <g transform="translate(205, 10) rotate(-8)" filter="url(#nhi-soft-shadow)">
            <rect x="0" y="0" width="170" height="135" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M148 0 L170 22 H154 Q148 22 148 16 Z" fill="#F1F5F9" />
            <path d="M148 0 L170 22 L148 22 Z" fill="#CBD5E1" opacity="0.6" />

            <rect x="14" y="14" width="46" height="22" rx="4" fill="#EF4444" />
            <text
              x="37"
              y="29.5"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
              letterSpacing="1"
              textAnchor="middle"
            >
              PDF
            </text>

            <line x1="14" y1="48" x2="135" y2="48" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
            <line x1="14" y1="62" x2="152" y2="62" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="74" x2="140" y2="74" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="86" x2="148" y2="86" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="98" x2="120" y2="98" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="110" x2="88" y2="110" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        {/* 5. NAVY PEN CUP WITH 3 PENCILS AND A RULER ON THE RIGHT (about 130 tall) */}
        <g id="pen-cup" transform="translate(524, 258)">
          <ellipse cx="28" cy="140" rx="30" ry="6" fill="#0B1B3D" fillOpacity="0.10" />

          <g transform="translate(10, 6) rotate(-14)">
            <rect x="0" y="0" width="14" height="85" rx="2" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
            <line x1="0" y1="12" x2="6" y2="12" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="20" x2="4" y2="20" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="28" x2="6" y2="28" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="36" x2="4" y2="36" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="44" x2="6" y2="44" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="52" x2="4" y2="52" stroke="#B45309" strokeWidth="1" />
            <line x1="0" y1="60" x2="6" y2="60" stroke="#B45309" strokeWidth="1" />
          </g>

          <g transform="translate(24, 0) rotate(2)">
            <rect x="0" y="8" width="8" height="78" rx="2" fill="#EF4444" />
            <polygon points="0,8 8,8 4,0" fill="#FDE68A" />
            <polygon points="2.5,3 5.5,3 4,0" fill="#1E293B" />
          </g>

          <g transform="translate(38, 8) rotate(14)">
            <rect x="0" y="8" width="8" height="72" rx="2" fill="#F59E0B" />
            <polygon points="0,8 8,8 4,0" fill="#FDE68A" />
            <polygon points="2.5,3 5.5,3 4,0" fill="#1E293B" />
          </g>

          <g transform="translate(18, 14) rotate(-6)">
            <rect x="0" y="6" width="7" height="68" rx="2" fill="#0284C7" />
            <rect x="1" y="2" width="5" height="4" rx="1" fill="#94A3B8" />
            <rect x="-1" y="16" width="3" height="24" rx="1" fill="#E2E8F0" />
          </g>

          <rect x="4" y="64" width="50" height="74" rx="8" fill="#1E3F66" />
          <line x1="8" y1="70" x2="8" y2="132" stroke="#3B82F6" strokeWidth="1.5" opacity="0.4" />
          <ellipse cx="29" cy="64" rx="25" ry="5" fill="#152B47" />
          <ellipse cx="29" cy="64" rx="22" ry="4" fill="#0D1B2D" />
        </g>
      </g>
    </svg>
  );
}
