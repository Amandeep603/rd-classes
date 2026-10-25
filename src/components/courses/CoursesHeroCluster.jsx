import { Caveat } from "next/font/google";

const caveatFont = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/**
 * Hero Illustration Cluster for /courses page.
 * Exact match to /reference/courses-page.png:
 * - Potted plant on left
 * - 3 Stacked books labelled ACCOUNTS (cream), PRACTICE (yellow), RESULTS (navy)
 * - Pen cup with pens on right
 * - Handwritten badge "Learn / Practice / Score Higher" rotated ~ -12deg with yellow swoosh
 */
export default function CoursesHeroCluster({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Pale Yellow Glow Circle */}
      <div
        className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FEEBAA 0%, #FFF8DF 60%, rgba(255,248,223,0) 80%)",
          filter: "blur(18px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden="true"
      />

      {/* Main Cluster Inline SVG */}
      <svg
        viewBox="0 0 540 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[540px] h-auto drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <filter id="hero-shadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
          <linearGradient id="plant-leaf-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#489768" />
            <stop offset="100%" stopColor="#255D3D" />
          </linearGradient>
          <linearGradient id="plant-leaf-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B8457" />
            <stop offset="100%" stopColor="#1E4E32" />
          </linearGradient>
          <linearGradient id="pot-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="book-cream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F5EFE1" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="book-yellow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E5A609" />
            <stop offset="4%" stopColor="#FFC21A" />
            <stop offset="100%" stopColor="#FFD54A" />
          </linearGradient>
          <linearGradient id="book-navy" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#081E3B" />
            <stop offset="4%" stopColor="#0E2D56" />
            <stop offset="100%" stopColor="#173B6B" />
          </linearGradient>
          <linearGradient id="cup-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="40%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>

        {/* Ground subtle shelf shadow */}
        <ellipse cx="260" cy="272" rx="210" ry="12" fill="#0F172A" fillOpacity="0.06" filter="url(#hero-shadow)" />

        {/* 1. Potted Plant (Left) */}
        <g id="potted-plant" transform="translate(45, 95)">
          {/* Leaves */}
          <path d="M50 85 C35 60 10 40 -5 45 C-12 47 -5 65 15 78 C30 88 45 88 50 85 Z" fill="url(#plant-leaf-2)" />
          <path d="M52 82 C42 45 25 15 12 8 C5 5 10 25 28 50 C40 68 48 78 52 82 Z" fill="url(#plant-leaf-1)" />
          <path d="M54 80 C50 35 48 5 44 -12 C40 -20 46 -15 54 10 C60 30 58 60 54 80 Z" fill="url(#plant-leaf-1)" />
          <path d="M56 82 C65 42 78 18 90 10 C98 5 95 25 78 52 C65 72 58 80 56 82 Z" fill="url(#plant-leaf-2)" />
          <path d="M58 85 C75 62 102 45 118 50 C125 53 118 70 96 82 C78 90 62 88 58 85 Z" fill="url(#plant-leaf-1)" />
          
          {/* Stem joints */}
          <path d="M54 78 L54 95" stroke="#1E4E32" strokeWidth="3" strokeLinecap="round" />

          {/* Plant Pot */}
          <path
            d="M32 95 L76 95 L71 142 C70 148 65 152 59 152 L49 152 C43 152 38 148 37 142 Z"
            fill="url(#pot-grad)"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <ellipse cx="54" cy="95" rx="22" ry="4" fill="#334155" />
          {/* Pot Rim */}
          <rect x="30" y="92" width="48" height="6" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        </g>

        {/* 2. Three Stacked Books (Center) */}
        <g id="books-stack" transform="translate(145, 140)">
          {/* Bottom Book: RESULTS (Navy) */}
          <g transform="translate(0, 72)">
            <rect x="0" y="0" width="205" height="38" rx="5" fill="url(#book-navy)" stroke="#0B2446" strokeWidth="1.5" />
            {/* White pages on right */}
            <path d="M192 4 L201 4 L201 34 L192 34 Z" fill="#F8FAFC" />
            <line x1="194" y1="8" x2="199" y2="8" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="194" y1="14" x2="199" y2="14" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="194" y1="20" x2="199" y2="20" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="194" y1="26" x2="199" y2="26" stroke="#E2E8F0" strokeWidth="1" />
            {/* Spine seam line */}
            <line x1="16" y1="0" x2="16" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Spine Label: RESULTS */}
            <text x="105" y="24" fill="#FFFFFF" fontSize="13" fontWeight="800" letterSpacing="3" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
              RESULTS
            </text>
          </g>

          {/* Middle Book: PRACTICE (Yellow) */}
          <g transform="translate(10, 36)">
            <rect x="0" y="0" width="195" height="36" rx="5" fill="url(#book-yellow)" stroke="#D99B00" strokeWidth="1.5" />
            {/* White pages on right */}
            <path d="M182 4 L191 4 L191 32 L182 32 Z" fill="#F8FAFC" />
            <line x1="184" y1="8" x2="189" y2="8" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="184" y1="14" x2="189" y2="14" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="184" y1="20" x2="189" y2="20" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="184" y1="26" x2="189" y2="26" stroke="#E2E8F0" strokeWidth="1" />
            {/* Spine seam line */}
            <line x1="16" y1="0" x2="16" y2="36" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
            {/* Spine Label: PRACTICE */}
            <text x="100" y="23" fill="#1E293B" fontSize="13" fontWeight="800" letterSpacing="3" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
              PRACTICE
            </text>
          </g>

          {/* Top Book: ACCOUNTS (Cream) */}
          <g transform="translate(30, 0)">
            <rect x="0" y="0" width="165" height="36" rx="5" fill="url(#book-cream)" stroke="#E2D9C5" strokeWidth="1.5" />
            {/* White pages on right */}
            <path d="M152 4 L161 4 L161 32 L152 32 Z" fill="#F8FAFC" />
            <line x1="154" y1="8" x2="159" y2="8" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="154" y1="14" x2="159" y2="14" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="154" y1="20" x2="159" y2="20" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="154" y1="26" x2="159" y2="26" stroke="#CBD5E1" strokeWidth="1" />
            {/* Spine seam line */}
            <line x1="16" y1="0" x2="16" y2="36" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
            {/* Spine Label: ACCOUNTS */}
            <text x="86" y="23" fill="#1E293B" fontSize="13" fontWeight="800" letterSpacing="2.5" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
              ACCOUNTS
            </text>
          </g>
        </g>

        {/* 3. Pen Cup with Pens (Right) */}
        <g id="pen-cup" transform="translate(390, 160)">
          {/* Yellow Pencil sticking out */}
          <g transform="translate(14, -30) rotate(-14)">
            <rect x="0" y="0" width="6" height="50" rx="1.5" fill="#FFC21A" stroke="#D99B00" strokeWidth="0.8" />
            <polygon points="0,0 6,0 3,-8" fill="#FDE68A" />
            <polygon points="2,-5 4,-5 3,-8" fill="#1E293B" />
          </g>
          {/* Navy Pen sticking out */}
          <g transform="translate(24, -38) rotate(4)">
            <rect x="0" y="0" width="7" height="58" rx="2" fill="#0B2A5B" stroke="#081E3B" strokeWidth="0.8" />
            <rect x="1" y="2" width="2" height="18" rx="1" fill="#FFD54A" />
          </g>
          {/* Amber Pen sticking out */}
          <g transform="translate(34, -28) rotate(16)">
            <rect x="0" y="0" width="6" height="48" rx="1.5" fill="#F97316" stroke="#C2410C" strokeWidth="0.8" />
          </g>

          {/* Ceramic Cup Body */}
          <rect x="8" y="10" width="44" height="62" rx="8" fill="url(#cup-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <ellipse cx="30" cy="10" rx="22" ry="5" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        </g>
      </svg>

      {/* Handwritten Badge: Learn / Practice / Score Higher */}
      <div
        className={`absolute -right-2 sm:-right-8 top-12 sm:top-14 select-none pointer-events-none transform -rotate-12 ${caveatFont.className}`}
        style={{
          color: "#1E293B",
          lineHeight: 1.15,
        }}
      >
        <div className="text-[26px] sm:text-[34px] md:text-[38px] font-bold tracking-tight whitespace-nowrap drop-shadow-xs">
          Learn<br />
          Practice<br />
          Score Higher
        </div>
        {/* Yellow Swoosh Underline */}
        <svg
          width="130"
          height="16"
          viewBox="0 0 130 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mt-1"
        >
          <path
            d="M4 11 C35 2 85 4 126 12 C100 13 45 13 25 15"
            stroke="#FFB800"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
