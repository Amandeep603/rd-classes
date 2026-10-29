import { Caveat } from "next/font/google";

const caveatFont = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/**
 * Hero Illustration Cluster for /courses page.
 * - Big restored size (viewBox 0 0 760 400)
 * - Plant and books stack on left (x 0 to 470)
 * - White pen cup with pencils immediately right of books (x 485 to 545, ~30px gap)
 * - Handwritten "Learn / Practice / Score Higher" with yellow swoosh in clear space at far right (x 570 to 740), above pen cup rim
 * - Book labels ACCOUNTS, PRACTICE, RESULTS: 20.5-21 units
 * - Script font: 36 units, rotated -8 degrees, rendered on top
 */
export default function CoursesHeroCluster({ className = "" }) {
  return (
    <div
      className={`relative select-none w-[clamp(520px,46vw,760px)] max-[1100px]:w-[44%] max-[900px]:w-[50%] hidden min-[560px]:block h-auto shrink-0 self-center ${className}`}
    >
      {/* Background Pale Yellow Glow Circle */}
      <div
        className="absolute w-[440px] h-[440px] rounded-full -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FEEBAA 0%, #FFF8DF 60%, rgba(255,248,223,0) 80%)",
          filter: "blur(22px)",
          top: "50%",
          left: "48%",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden="true"
      />

      {/* Main Cluster Inline SVG */}
      <svg
        viewBox="0 0 760 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block drop-shadow-sm"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <filter id="courses-ground-blur" x="-20%" y="-20%" width="140%" height="150%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="plant-leaf-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#489768" />
            <stop offset="100%" stopColor="#255D3D" />
          </linearGradient>
          <linearGradient id="plant-leaf-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B8457" />
            <stop offset="100%" stopColor="#1E4E32" />
          </linearGradient>
          <linearGradient id="plant-leaf-highlight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#68BA86" />
            <stop offset="100%" stopColor="#3B8457" />
          </linearGradient>
          <linearGradient id="pot-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="book-cream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EDE5D4" />
            <stop offset="4%" stopColor="#F5EFE1" />
            <stop offset="96%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FAF6EE" />
          </linearGradient>
          <linearGradient id="book-yellow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D99B00" />
            <stop offset="4%" stopColor="#FFC21A" />
            <stop offset="96%" stopColor="#FFD54A" />
            <stop offset="100%" stopColor="#FFBE1A" />
          </linearGradient>
          <linearGradient id="book-navy" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#081E3B" />
            <stop offset="4%" stopColor="#0E2D56" />
            <stop offset="96%" stopColor="#1A3E70" />
            <stop offset="100%" stopColor="#122F5A" />
          </linearGradient>
          <linearGradient id="cup-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="40%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>

        {/* Soft Ground Shelf Shadow */}
        <ellipse cx="325" cy="358" rx="310" ry="12" fill="#0F172A" fillOpacity="0.07" filter="url(#courses-ground-blur)" />

        {/* 1. Potted Plant (Left) */}
        <g id="potted-plant" transform="translate(18, 150) scale(1.35)">
          {/* Leaves */}
          <path d="M50 85 C35 60 10 40 -5 45 C-12 47 -5 65 15 78 C30 88 45 88 50 85 Z" fill="url(#plant-leaf-2)" />
          <path d="M52 82 C42 45 25 15 12 8 C5 5 10 25 28 50 C40 68 48 78 52 82 Z" fill="url(#plant-leaf-1)" />
          <path d="M54 80 C50 35 48 5 44 -12 C40 -20 46 -15 54 10 C60 30 58 60 54 80 Z" fill="url(#plant-leaf-highlight)" />
          <path d="M56 82 C65 42 78 18 90 10 C98 5 95 25 78 52 C65 72 58 80 56 82 Z" fill="url(#plant-leaf-2)" />
          <path d="M58 85 C75 62 102 45 118 50 C125 53 118 70 96 82 C78 90 62 88 58 85 Z" fill="url(#plant-leaf-1)" />

          {/* Stem roots */}
          <path d="M54 78 L54 95" stroke="#1E4E32" strokeWidth="3" strokeLinecap="round" />

          {/* Plant Pot Body */}
          <path
            d="M32 95 L76 95 L71 142 C70 148 65 152 59 152 L49 152 C43 152 38 148 37 142 Z"
            fill="url(#pot-grad)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          {/* Soil */}
          <ellipse cx="54" cy="95" rx="22" ry="4" fill="#2E384D" />
          {/* Pot Rim */}
          <rect x="30" y="92" width="48" height="6" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        </g>

        {/* 2. Three Stacked Books (Center Left: x 125 to 455) */}
        {/* Bottom Book: RESULTS (Navy) */}
        <g id="book-results" transform="translate(125, 302)">
          <rect x="0" y="0" width="330" height="54" rx="6" fill="url(#book-navy)" stroke="#091A33" strokeWidth="1.4" />
          {/* White pages on right */}
          <path d="M312 5 L325 5 L325 49 L312 49 Z" fill="#F8FAFC" />
          <line x1="314" y1="11" x2="323" y2="11" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="314" y1="20" x2="323" y2="20" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="314" y1="29" x2="323" y2="29" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="314" y1="38" x2="323" y2="38" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="314" y1="45" x2="323" y2="45" stroke="#E2E8F0" strokeWidth="1" />
          {/* Spine seam line */}
          <line x1="22" y1="0" x2="22" y2="54" stroke="rgba(255,255,255,0.18)" strokeWidth="1.8" />
          {/* Spine Label: RESULTS */}
          <text
            x="167"
            y="34"
            fill="#FFFFFF"
            fontSize="21"
            fontWeight="800"
            letterSpacing="4.5"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            RESULTS
          </text>
        </g>

        {/* Middle Book: PRACTICE (Yellow) */}
        <g id="book-practice" transform="translate(142, 252)">
          <rect x="0" y="0" width="310" height="52" rx="6" fill="url(#book-yellow)" stroke="#D99B00" strokeWidth="1.4" />
          {/* White pages on right */}
          <path d="M293 5 L305 5 L305 47 L293 47 Z" fill="#F8FAFC" />
          <line x1="295" y1="11" x2="303" y2="11" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="295" y1="19" x2="303" y2="19" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="295" y1="27" x2="303" y2="27" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="295" y1="35" x2="303" y2="35" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="295" y1="43" x2="303" y2="43" stroke="#E2E8F0" strokeWidth="1" />
          {/* Spine seam line */}
          <line x1="22" y1="0" x2="22" y2="52" stroke="rgba(0,0,0,0.12)" strokeWidth="1.8" />
          {/* Spine Label: PRACTICE */}
          <text
            x="157"
            y="33"
            fill="#1E293B"
            fontSize="21"
            fontWeight="800"
            letterSpacing="4"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            PRACTICE
          </text>
        </g>

        {/* Top Book: ACCOUNTS (Cream) */}
        <g id="book-accounts" transform="translate(168, 202)">
          <rect x="0" y="0" width="275" height="52" rx="6" fill="url(#book-cream)" stroke="#E2D9C5" strokeWidth="1.4" />
          {/* White pages on right */}
          <path d="M259 5 L270 5 L270 47 L259 47 Z" fill="#F8FAFC" />
          <line x1="261" y1="11" x2="268" y2="11" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="261" y1="19" x2="268" y2="19" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="261" y1="27" x2="268" y2="27" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="261" y1="35" x2="268" y2="35" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="261" y1="43" x2="268" y2="43" stroke="#CBD5E1" strokeWidth="1" />
          {/* Spine seam line */}
          <line x1="22" y1="0" x2="22" y2="52" stroke="rgba(0,0,0,0.08)" strokeWidth="1.8" />
          {/* Spine Label: ACCOUNTS */}
          <text
            x="140"
            y="33"
            fill="#1E293B"
            fontSize="20.5"
            fontWeight="800"
            letterSpacing="3.5"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ACCOUNTS
          </text>
        </g>

        {/* 3. Pen Cup with Pencils (Right of books: x 485 to 545, ~30px gap) */}
        <g id="pen-cup" transform="translate(485, 235)">
          {/* Yellow Pencil sticking out */}
          <g transform="translate(18, -12) rotate(-14)">
            <rect x="0" y="0" width="8" height="74" rx="1.8" fill="#FFC21A" stroke="#D99B00" strokeWidth="1" />
            <polygon points="0,0 8,0 4,-12" fill="#FDE68A" />
            <polygon points="2.5,-7 5.5,-7 4,-12" fill="#1E293B" />
          </g>
          {/* Navy Pen sticking out */}
          <g transform="translate(32, -24) rotate(4)">
            <rect x="0" y="0" width="9.5" height="84" rx="2.5" fill="#0B2A5B" stroke="#081E3B" strokeWidth="1" />
            <rect x="1.5" y="3" width="3" height="26" rx="1.5" fill="#FFD54A" />
          </g>
          {/* Amber Pen sticking out */}
          <g transform="translate(46, -10) rotate(16)">
            <rect x="0" y="0" width="8.5" height="70" rx="2" fill="#F97316" stroke="#C2410C" strokeWidth="1" />
            <rect x="1.5" y="3" width="2.5" height="22" rx="1" fill="#FFFFFF" />
          </g>

          {/* Ceramic Cup Body */}
          <rect x="8" y="32" width="56" height="88" rx="10" fill="url(#cup-grad)" stroke="#CBD5E1" strokeWidth="1.4" />
          <ellipse cx="36" cy="32" rx="28" ry="6.5" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.2" />
        </g>

        {/* 4. Handwritten Badge: Learn / Practice / Score Higher
            Placed in clear space at far right (x 570 to 740), above pen cup rim,
            fill #1B2B4B, fontSize 36, rotated -8 degrees, rendered on top */}
        <g
          id="handwritten-script"
          transform="translate(570, 75) rotate(-8)"
          className="select-none pointer-events-none"
        >
          <text
            x="0"
            y="36"
            fill="#1B2B4B"
            className={`${caveatFont.className} font-bold`}
            style={{ fontFamily: caveatFont.style.fontFamily }}
            fontSize="36"
            letterSpacing="-0.5"
          >
            <tspan x="0" dy="0">Learn</tspan>
            <tspan x="0" dy="38">Practice</tspan>
            <tspan x="0" dy="38">Score Higher</tspan>
          </text>
          {/* Yellow Curved Swoosh Underline */}
          <path
            d="M 4 126 C 45 116 110 118 168 128 C 132 130 52 131 26 132"
            stroke="#FFB800"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
