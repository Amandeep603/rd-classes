/**
 * Clean inline SVGs for the About page:
 * - 2px outline stroke geometry matching the reference design exactly
 * - High-DPI crisp rendering, zero layout shift, zero external font dependencies
 */

// 3 angled yellow spark strokes
export function SparkCluster({ className = "w-6 h-6 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 12L8.5 2.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12.5 14L20 4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18.5 22.5L25.5 14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Trophy Icon for Founder Century Board Scores
export function TrophyIcon({ className = "w-7 h-7 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v6a6 6 0 0 1-12 0V4Z" />
    </svg>
  );
}

// Award Ribbon Badge Icon for Founder Teaching Excellence
export function AwardBadgeIcon({ className = "w-7 h-7 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="m9 12-2 9 5-3 5 3-2-9" />
      <path d="m10 8 1.5 1.5L14 6" />
    </svg>
  );
}

// Pillar 1: Stacked Books Icon
export function PillarStackedBooksIcon({ className = "w-8 h-8 text-[#0D2240]" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top Book */}
      <path d="M6 7.5L16 3L26 7.5L16 12L6 7.5Z" />
      <path d="M6 7.5V11.5L16 16L26 11.5V7.5" />
      {/* Middle Book */}
      <path d="M6 14.5L16 19L26 14.5" />
      <path d="M6 18.5L16 23L26 18.5" />
      {/* Bottom Book */}
      <path d="M6 22.5L16 27L26 22.5" />
    </svg>
  );
}

// Pillar 2: Notes with Pencil Icon
export function PillarNotesIcon({ className = "w-8 h-8 text-[#0D2240]" }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Soft yellow circle behind icon */}
      <div
        className="absolute w-10 h-10 -left-1 -top-1 rounded-full bg-[#FFE58F]/60 -z-0 pointer-events-none"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`relative z-10 ${className}`}
        aria-hidden="true"
      >
        {/* Document Sheet */}
        <path d="M7 5H21L25 9V27H7V5Z" />
        <path d="M21 5V9H25" />
        <path d="M11 13H19" />
        <path d="M11 17H17" />
        <path d="M11 21H15" />
        {/* Tilted Pencil Writing */}
        <path d="M26 14L20 20L18 25L23 23L29 17L26 14Z" fill="#FFF0C4" />
      </svg>
    </div>
  );
}

// Pillar 3: Target with Arrow Icon
export function PillarTargetIcon({ className = "w-8 h-8 text-[#0D2240]" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="6.5" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      {/* Arrow */}
      <path d="M27 5L17.5 14.5" />
      <path d="M22 5H27V10" />
    </svg>
  );
}

// CTA 3D Stacked Books Illustration
export function CtaBooksIllustration({ className = "w-36 h-28" }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Drop Shadow */}
      <ellipse
        cx="78"
        cy="104"
        rx="64"
        ry="14"
        fill="#081426"
        fillOpacity="0.45"
      />

      {/* BOTTOM BOOK (Deep Navy Cover, White Pages) */}
      <g transform="translate(0, 16)">
        {/* Bottom Cover Base */}
        <path
          d="M12 70L80 94L148 70L80 48L12 70Z"
          fill="#0A1C36"
        />
        {/* Page Block (Front and Right edges) */}
        <path
          d="M12 68L80 92V78L12 56V68Z"
          fill="#DDE5EE"
        />
        <path
          d="M80 92L148 68V56L80 78V92Z"
          fill="#F2F6FA"
        />
        {/* Subtle page lines */}
        <line x1="80" y1="84" x2="146" y2="61" stroke="#CAD5E2" strokeWidth="0.8" />
        <line x1="80" y1="88" x2="146" y2="65" stroke="#CAD5E2" strokeWidth="0.8" />
        {/* Bottom Book Top Cover */}
        <path
          d="M12 55L80 76L148 55L80 34L12 55Z"
          fill="#132B4F"
        />
        <path
          d="M12 55L80 76V78L12 57V55Z"
          fill="#0D2240"
        />
      </g>

      {/* TOP BOOK (Vibrant Yellow Cover, White Pages) */}
      <g transform="translate(2, -4)">
        {/* Top Book Bottom Cover Flap */}
        <path
          d="M14 62L80 84L146 62L80 42L14 62Z"
          fill="#D69E14"
        />
        {/* Page Block */}
        <path
          d="M14 60L80 82V68L14 48V60Z"
          fill="#EDF2F7"
        />
        <path
          d="M80 82L146 60V48L80 68V82Z"
          fill="#FFFFFF"
        />
        {/* Page lines */}
        <line x1="80" y1="74" x2="144" y2="53" stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1="80" y1="78" x2="144" y2="57" stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Top Book Main Cover */}
        <path
          d="M14 47L80 68L146 47L80 26L14 47Z"
          fill="#FFC629"
        />
        {/* Cover Spine / Trim */}
        <path
          d="M14 47L80 68V71L14 50V47Z"
          fill="#E6AC17"
        />
      </g>
    </svg>
  );
}

// Decorative Yellow Arcs for the Pillars Section
export function DecorativeArcLeft({ className = "w-32 h-32 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M-10 130 C40 130, 90 90, 130 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function DecorativeArcRight({ className = "w-20 h-40 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 60 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 5 C35 35, 35 85, 10 115"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

