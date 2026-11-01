/**
 * Custom inline vector graphics for About page in exact reference style:
 * - 2.5px navy stroke (#0F2342), round caps and joins, 56px box for Pillar cards
 * - Yellow outline (#FFC83A) for Founder trophies/badges
 * - Two stacked hardcover books on light cream wedge for CTA
 * - Spark clusters and thin curved lines
 */

// 3 angled yellow spark strokes
export function SparkCluster({ className = "w-6 h-6 text-[#FFC83A]" }) {
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
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 14L20 4.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18.5 22.5L25.5 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Pillar 1: Three flat books stacked on top of each other, slightly offset
export function PillarBooksIcon({ className = "w-12 h-12 text-[#0F2342]" }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Flat Book */}
      <rect
        x="10"
        y="12"
        width="34"
        height="7.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="18"
        y1="12"
        x2="18"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* Middle Flat Book (slightly offset to right) */}
      <rect
        x="13"
        y="23"
        width="34"
        height="7.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="21"
        y1="23"
        x2="21"
        y2="30.5"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* Bottom Flat Book */}
      <rect
        x="10"
        y="34"
        width="34"
        height="7.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="18"
        y1="34"
        x2="18"
        y2="41.5"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

// Pillar 2: Notepad with spiral edge and a pencil crossing it, on a soft yellow circle
export function PillarNotepadIcon({ className = "w-12 h-12 text-[#0F2342]" }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Soft yellow circle behind icon */}
      <div
        className="absolute w-12 h-12 -left-1.5 -top-1.5 rounded-full bg-[#FFE898]/75 -z-0 pointer-events-none"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${className}`}
        aria-hidden="true"
      >
        {/* Notepad sheet with folded corner */}
        <path
          d="M15 10H33L41 18V44C41 45.1 40.1 46 39 46H15C13.9 46 13 45.1 13 44V12C13 10.9 13.9 10 15 10Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Fold line */}
        <path
          d="M33 10V18H41"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Horizontal ruled notes lines */}
        <line x1="20" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        <line x1="20" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        <line x1="20" y1="36" x2="26" y2="36" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        {/* Tilted pencil writing across bottom right */}
        <path
          d="M44 26L32 38L29 43L34 40L46 28L44 26Z"
          fill="#FFF4CD"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Pillar 3: Target with three rings and an arrow stuck in it
export function PillarTargetIcon({ className = "w-12 h-12 text-[#0F2342]" }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="26"
        cy="30"
        r="17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Middle ring */}
      <circle
        cx="26"
        cy="30"
        r="10.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center bullseye */}
      <circle
        cx="26"
        cy="30"
        r="4"
        fill="currentColor"
      />
      {/* Arrow shaft piercing into bullseye from top-right */}
      <line
        x1="45"
        y1="11"
        x2="28"
        y2="28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Arrow fletching feathers */}
      <path
        d="M38 11L45 11L45 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Founder Trophy: Yellow outline trophy with two handles and stepped base
export function FounderTrophyIcon({ className = "w-9 h-9 text-[#FFC83A]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cup bowl */}
      <path
        d="M10 6H26V15C26 19.4 22.4 23 18 23C13.6 23 10 19.4 10 15V6Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rim top line */}
      <line x1="9" y1="6" x2="27" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Left handle */}
      <path
        d="M10 9H6C4.9 9 4 9.9 4 11V13C4 15.2 5.8 17 8 17H10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right handle */}
      <path
        d="M26 9H30C31.1 9 32 9.9 32 11V13C32 15.2 30.2 17 28 17H26"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stem */}
      <line x1="18" y1="23" x2="18" y2="28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Base */}
      <path
        d="M11 31H25M14 28H22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Founder Rosette: Yellow outline award rosette (scalloped circle with star and ribbon tails)
export function FounderAwardIcon({ className = "w-9 h-9 text-[#FFC83A]" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ribbon tails hanging below */}
      <path
        d="M13 23L11 32L18 28.5L25 32L23 23"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rosette medallion circle */}
      <circle
        cx="18"
        cy="14"
        r="9"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="#FFFFFF"
      />
      {/* Checkmark inside medallion */}
      <path
        d="M14.5 14L17 16.5L21.5 11.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// CTA 3D Stacked Hardcover Books Illustration
export function CtaBooksIllustration({ className = "w-44 sm:w-52 h-32 sm:h-38" }) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft Drop Shadow under bottom book */}
      <ellipse
        cx="96"
        cy="124"
        rx="82"
        ry="13"
        fill="#05101E"
        fillOpacity="0.5"
      />

      {/* BOTTOM BOOK: Deep Blue Hardcover with White Pages */}
      <g id="bottom-book">
        {/* Bottom book lower board */}
        <path
          d="M16 88L96 117L182 86L102 59L16 88Z"
          fill="#0B1B32"
        />
        {/* Bottom book page block - front edge */}
        <path
          d="M18 86L96 114V99L18 72V86Z"
          fill="#DDE5ED"
        />
        {/* Bottom book page block - right edge */}
        <path
          d="M96 114L180 84V69L96 99V114Z"
          fill="#F2F6FA"
        />
        {/* Subtle page lines on right edge */}
        <line x1="96" y1="104" x2="178" y2="75" stroke="#CAD5E2" strokeWidth="0.8" />
        <line x1="96" y1="109" x2="178" y2="79" stroke="#CAD5E2" strokeWidth="0.8" />

        {/* Bottom book top cover board */}
        <path
          d="M15 69L96 98L183 67L102 41L15 69Z"
          fill="#1B3A68"
        />
        {/* Front cover edge rim / thickness */}
        <path
          d="M15 69L96 98V102L15 73V69Z"
          fill="#112543"
        />
        {/* Left spine rim */}
        <path
          d="M15 69L102 41V44L15 73V69Z"
          fill="#0E1E36"
        />
      </g>

      {/* TOP BOOK: Vibrant Brand Yellow Hardcover (#FFC83A) with Crisp White Pages */}
      <g id="top-book" transform="translate(4, -14)">
        {/* Top book lower board */}
        <path
          d="M18 76L96 104L180 75L102 49L18 76Z"
          fill="#CC9408"
        />
        {/* Top book page block - front edge */}
        <path
          d="M20 74L96 101V81L20 54V74Z"
          fill="#EDF2F7"
        />
        {/* Top book page block - right edge */}
        <path
          d="M96 101L178 72V52L96 81V101Z"
          fill="#FFFFFF"
        />
        {/* Clean page lines on right edge */}
        <line x1="96" y1="88" x2="176" y2="59" stroke="#CBD5E1" strokeWidth="0.9" />
        <line x1="96" y1="94" x2="176" y2="65" stroke="#CBD5E1" strokeWidth="0.9" />

        {/* Top book main top cover */}
        <path
          d="M17 51L96 79L182 50L102 24L17 51Z"
          fill="#FFC83A"
        />
        {/* Front cover edge thickness / spine rim */}
        <path
          d="M17 51L96 79V83L17 55V51Z"
          fill="#E5A812"
        />
        {/* Left spine edge */}
        <path
          d="M17 51L102 24V28L17 55V51Z"
          fill="#CC9408"
        />
      </g>
    </svg>
  );
}

// Decorative Yellow Arcs for the Pillars Section
export function DecorativeArcLeft({ className = "w-32 h-32 text-[#FFC83A]" }) {
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

export function DecorativeArcRight({ className = "w-20 h-40 text-[#FFC83A]" }) {
  return (
    <svg
      viewBox="0 0 60 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M70 10 C20 40, 20 80, 70 110"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
