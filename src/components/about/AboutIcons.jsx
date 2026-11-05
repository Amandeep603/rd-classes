/**
 * Precise inline vector components for the About page reference design.
 * All graphics are zero-dependency, pure SVG, aria-hidden for accessibility.
 */

// ---------------------------------------------------------------------------
// 1. STATS CARD ICONS (2px yellow outline, matching reference mockup)
// ---------------------------------------------------------------------------

// Graduation cap (Teaching Excellence)
export function StatsGradCapIcon({ className = "w-8 h-8 text-[#FFC100]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cap top diamond */}
      <path
        d="M18 6L32 13L18 20L4 13L18 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower skullcap arc */}
      <path
        d="M9 15.5V23.5C9 23.5 12.5 27 18 27C23.5 27 27 23.5 27 23.5V15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tassel */}
      <path
        d="M32 13.5V24C32 25 30.5 26 30.5 26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Group of three people (Century Board Scores)
export function StatsPeopleIcon({ className = "w-8 h-8 text-[#FFC100]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Center Person (larger) */}
      <circle
        cx="18"
        cy="11"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M11 26C11 22.134 14.134 19 18 19C21.866 19 25 22.134 25 26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Left Person */}
      <circle
        cx="8"
        cy="14"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 27C4 24.2386 6.23858 22 9 22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Right Person */}
      <circle
        cx="28"
        cy="14"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M27 22C29.7614 22 32 24.2386 32 27"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Bar chart with upward trending arrow (Hundreds of Successful Students)
export function StatsChartIcon({ className = "w-8 h-8 text-[#FFC100]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Baseline */}
      <line
        x1="5"
        y1="28"
        x2="31"
        y2="28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Bar 1 */}
      <rect
        x="8"
        y="21"
        width="4"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Bar 2 */}
      <rect
        x="16"
        y="16"
        width="4"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Bar 3 */}
      <rect
        x="24"
        y="11"
        width="4"
        height="17"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Upward diagonal arrow */}
      <path
        d="M8 15L17 8L22 13L29 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 5H29V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 2. FOUNDER CURVED UNDERLINE (Under "Ronak")
// ---------------------------------------------------------------------------
export function RonakCurvedUnderline({ className = "w-32 h-3 text-[#FFC100]" }) {
  return (
    <svg
      viewBox="0 0 120 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 6.5C32 12.5 88 13.5 117 3"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. OUR APPROACH ICONS (2px matching navy outline, #0F233C)
// ---------------------------------------------------------------------------

// Concept-First Learning: Stacked isometric layers
export function ApproachLayersIcon({ className = "w-6 h-6 text-[#0F233C]" }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Diamond */}
      <path
        d="M14 3L24 8L14 13L4 8L14 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Middle Arc */}
      <path
        d="M4 13.5L14 18.5L24 13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Arc */}
      <path
        d="M4 19L14 24L24 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Structured Resources: Document / notepad with formatted lines
export function ApproachDocIcon({ className = "w-6 h-6 text-[#0F233C]" }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="18"
        height="22"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="9"
        y1="8"
        x2="15"
        y2="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="13"
        x2="19"
        y2="13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="18"
        x2="19"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Regular Practice: Target / bullseye with arrow
export function ApproachTargetIcon({ className = "w-6 h-6 text-[#0F233C]" }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="14"
        cy="14"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="14"
        cy="14"
        r="2"
        fill="currentColor"
      />
      {/* Arrow hitting bullseye from top-right */}
      <path
        d="M23 5L16 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 4H24V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 4. HERO DESK ARTWORK (Bespoke inline vector scene matching reference)
// Stack of 3 books, ribbed pen holder with pens, plant leaves, shadows.
// ---------------------------------------------------------------------------
export function HeroDeskArtwork({ className = "" }) {
  return (
    <div className={`relative select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 520 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
      >
        <defs>
          {/* Soft drop shadow filter for books and pen holder */}
          <filter id="softShadow" x="-15%" y="-15%" width="130%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F233C" floodOpacity="0.14" />
          </filter>

          <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="150%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="8" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.14  0 0 0 0 0.24  0 0 0 0.12 0" />
          </filter>

          {/* Ribbed pen holder vertical gradient */}
          <linearGradient id="holderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EDE5D8" />
            <stop offset="25%" stopColor="#FAF7F2" />
            <stop offset="65%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#E2D9CB" />
          </linearGradient>

          {/* Book page edge texture gradient */}
          <linearGradient id="pagesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2DDD5" />
            <stop offset="50%" stopColor="#F9F6F0" />
            <stop offset="100%" stopColor="#DFD8CE" />
          </linearGradient>
        </defs>

        {/* --- LEAF SHADOWS (Projected on the wall background) --- */}
        <g filter="url(#leafShadow)" opacity="0.6">
          <path d="M420 -20 Q460 30 480 90 Q430 70 390 40 Z" fill="#000" />
          <path d="M470 -10 Q500 50 510 120 Q480 80 440 60 Z" fill="#000" />
          <path d="M370 20 Q410 70 420 130 Q380 110 350 70 Z" fill="#000" />
        </g>

        {/* --- GREEN PLANT LEAVES (Entering from top-right corner) --- */}
        <g className="about-leaf-sway">
          {/* Main Leaf 1 */}
          <path
            d="M480 -30 C530 40 510 110 440 145 C435 90 450 35 480 -30 Z"
            fill="#2D6A4F"
          />
          <path
            d="M480 -30 C465 50 445 100 440 145"
            stroke="#1B4332"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Side Leaf 2 */}
          <path
            d="M520 20 C540 80 500 130 455 135 C460 90 485 50 520 20 Z"
            fill="#40916C"
          />

          {/* Fresh Sprout Leaf 3 */}
          <path
            d="M430 -10 C460 30 440 85 390 100 C395 60 410 25 430 -10 Z"
            fill="#52B788"
          />
        </g>

        {/* --- DESK ACCESSORIES (Pen Holder + Books Stack) --- */}
        <g className="about-desk-drift">
          {/* 1. RIBBED CREAM PEN HOLDER (to the left of books) */}
          <g filter="url(#softShadow)">
            {/* Pens sticking out */}
            {/* Black Pen (left tilt) */}
            <g transform="rotate(-18 105 160)">
              <rect x="98" y="70" width="8" height="95" rx="3" fill="#1A1A1A" />
              <rect x="100" y="80" width="4" height="30" fill="#71717A" rx="1" />
              <polygon points="98,70 106,70 102,60" fill="#27272A" />
            </g>

            {/* White Pen / Stylus (slight right tilt) */}
            <g transform="rotate(8 115 160)">
              <rect x="110" y="75" width="9" height="90" rx="3.5" fill="#FAFAFA" stroke="#E4E4E7" strokeWidth="1" />
              <rect x="117" y="85" width="2" height="24" fill="#A1A1AA" rx="1" />
            </g>

            {/* Gold Wooden Pencil (centered tilt) */}
            <g transform="rotate(-4 110 160)">
              <rect x="106" y="65" width="7" height="100" rx="1.5" fill="#EAB308" />
              <polygon points="106,65 113,65 109.5,50" fill="#FDE047" />
              <polygon points="108.5,54 110.5,54 109.5,50" fill="#18181B" />
              <rect x="106" y="105" width="7" height="6" fill="#CA8A04" />
            </g>

            {/* Cream Ribbed Holder Body */}
            <rect
              x="85"
              y="135"
              width="50"
              height="75"
              rx="12"
              fill="url(#holderGradient)"
              stroke="#E8DFD1"
              strokeWidth="1.5"
            />
            {/* Vertical Flutes / Ribs */}
            <line x1="93" y1="140" x2="93" y2="204" stroke="#D8CDBE" strokeWidth="2" strokeLinecap="round" />
            <line x1="101" y1="140" x2="101" y2="204" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="109" y1="140" x2="109" y2="204" stroke="#D8CDBE" strokeWidth="2" strokeLinecap="round" />
            <line x1="117" y1="140" x2="117" y2="204" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="125" y1="140" x2="125" y2="204" stroke="#D8CDBE" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* 2. STACK OF THREE HARDCOVER BOOKS (Bleeding off right edge) */}
          <g filter="url(#softShadow)">
            {/* --- BOTTOM BOOK: NAVY "Economics" --- */}
            {/* Book Body */}
            <rect
              x="165"
              y="180"
              width="360"
              height="40"
              rx="4"
              fill="#0F233C"
            />
            {/* White/Cream Page Edge on Left */}
            <rect
              x="166"
              y="184"
              width="4"
              height="32"
              rx="1"
              fill="url(#pagesGradient)"
            />
            {/* Spine Highlight */}
            <rect
              x="165"
              y="180"
              width="360"
              height="4"
              fill="#1A3459"
              opacity="0.8"
            />
            {/* Book Spine Label Text */}
            <text
              x="210"
              y="206"
              fill="#FFFFFF"
              fontFamily="var(--font-plus-jakarta-sans), system-ui, sans-serif"
              fontSize="14"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              Economics
            </text>

            {/* --- MIDDLE BOOK: OFF-WHITE "Business Studies" --- */}
            <rect
              x="172"
              y="145"
              width="355"
              height="38"
              rx="4"
              fill="#FAF7F2"
              stroke="#E8E2D5"
              strokeWidth="1"
            />
            {/* Page Edge */}
            <rect
              x="173"
              y="149"
              width="4"
              height="30"
              rx="1"
              fill="url(#pagesGradient)"
            />
            {/* Subtle Spine Groove */}
            <line x1="184" y1="145" x2="184" y2="183" stroke="#DDD6C8" strokeWidth="1.5" />
            {/* Spine Label Text */}
            <text
              x="220"
              y="169"
              fill="#0F233C"
              fontFamily="var(--font-plus-jakarta-sans), system-ui, sans-serif"
              fontSize="14"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              Business Studies
            </text>

            {/* --- TOP BOOK: YELLOW "Accountancy" --- */}
            <rect
              x="180"
              y="110"
              width="350"
              height="38"
              rx="4"
              fill="#FFC100"
            />
            {/* Page Edge */}
            <rect
              x="181"
              y="114"
              width="4"
              height="30"
              rx="1"
              fill="url(#pagesGradient)"
            />
            {/* Top Cover Surface (slight isometric slant) */}
            <polygon
              points="180,110 520,110 520,105 188,105"
              fill="#FFD24D"
              opacity="0.7"
            />
            {/* Spine Label Text */}
            <text
              x="230"
              y="134"
              fill="#0F233C"
              fontFamily="var(--font-plus-jakarta-sans), system-ui, sans-serif"
              fontSize="14"
              fontWeight="800"
              letterSpacing="0.03em"
            >
              Accountancy
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. MOBILE COMPACT BOOKS STACK (Used for viewports below 1024px)
// ---------------------------------------------------------------------------
export function HeroBooksMobile({ className = "" }) {
  return (
    <div className={`relative select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 320 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-xs mx-auto drop-shadow-md"
      >
        {/* Bottom Book: Economics */}
        <rect x="20" y="85" width="280" height="30" rx="3" fill="#0F233C" />
        <text x="60" y="105" fill="#FFF" fontSize="12" fontWeight="700">
          Economics
        </text>

        {/* Middle Book: Business Studies */}
        <rect x="30" y="58" width="270" height="28" rx="3" fill="#FAF7F2" stroke="#E2DCD0" />
        <text x="70" y="77" fill="#0F233C" fontSize="12" fontWeight="700">
          Business Studies
        </text>

        {/* Top Book: Accountancy */}
        <rect x="40" y="30" width="260" height="29" rx="3" fill="#FFC100" />
        <text x="80" y="49" fill="#0F233C" fontSize="12" fontWeight="800">
          Accountancy
        </text>
      </svg>
    </div>
  );
}
