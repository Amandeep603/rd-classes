/**
 * Custom inline vector graphics for About page:
 * - SparkCluster: 3 short angled yellow strokes
 * - CtaBooksIllustration: Two stacked isometric books (yellow on top, deep blue below)
 * - DecorativeArcLeft & DecorativeArcRight: Thin yellow curved SVG lines
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
      {/* Soft Drop Shadow */}
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
