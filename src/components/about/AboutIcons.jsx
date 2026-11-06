/**
 * Precise inline vector icons for the About page reference design.
 * Zero-dependency, pure SVG, aria-hidden for accessibility.
 */

// ---------------------------------------------------------------------------
// 1. STATS CARD ICONS (Yellow outline, matching reference mockup)
// ---------------------------------------------------------------------------

// Graduation cap (Teaching Excellence)
export function StatsGradCapIcon({ className = "w-10 h-10 text-[#FFBF01]" }) {
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
export function StatsPeopleIcon({ className = "w-10 h-10 text-[#FFBF01]" }) {
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
export function StatsChartIcon({ className = "w-10 h-10 text-[#FFBF01]" }) {
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
export function RonakCurvedUnderline({ className = "w-[120px] h-3 text-[#FFBF01]" }) {
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
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. OUR APPROACH ICONS (Navy outline, #0B1B33)
// ---------------------------------------------------------------------------

// Concept-First Learning: Stacked isometric layers
export function ApproachLayersIcon({ className = "w-6 h-6 text-[#0B1B33]" }) {
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
export function ApproachDocIcon({ className = "w-6 h-6 text-[#0B1B33]" }) {
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
        x2="16"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Regular Practice: Target with bullseye and arrow
export function ApproachTargetIcon({ className = "w-6 h-6 text-[#0B1B33]" }) {
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
