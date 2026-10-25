export default function BooksBlue({ className = "w-full h-full", ...props }) {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="bb-book-top" x1="20" y1="30" x2="140" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="0.6" stopColor="#1D4ED8" />
          <stop offset="1" stopColor="#0B2A5B" />
        </linearGradient>
        <linearGradient id="bb-book-bot" x1="10" y1="50" x2="150" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E40AF" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="bb-pages" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#F1F5F9" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="bb-shadow" x="0" y="20" width="160" height="110" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#bb-shadow)">
        {/* Bottom Book Shadow & Base */}
        <path
          d="M18 84L128 62L146 80L36 104L18 84Z"
          fill="#0A1E40"
        />
        {/* Bottom Book Pages */}
        <path
          d="M22 86L128 64V76L22 98V86Z"
          fill="url(#bb-pages)"
        />
        {/* Bottom Book Cover */}
        <path
          d="M18 96L124 74L144 92L38 116L18 96Z"
          fill="url(#bb-book-bot)"
        />
        <path
          d="M18 96L22 86L128 64L124 74L18 96Z"
          fill="#1E3A8A"
        />

        {/* Top Book Spine / Back cover */}
        <path
          d="M28 54L134 32L148 46L42 70L28 54Z"
          fill="#0C2340"
        />
        {/* Top Book Pages */}
        <path
          d="M32 56L134 34V46L32 68V56Z"
          fill="url(#bb-pages)"
        />
        <line x1="34" y1="59" x2="132" y2="37" stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1="34" y1="63" x2="132" y2="41" stroke="#CBD5E1" strokeWidth="0.8" />

        {/* Top Book Cover with perspective */}
        <path
          d="M28 42L134 20L150 36L44 60L28 42Z"
          fill="url(#bb-book-top)"
        />
        <path
          d="M28 42L32 56L44 60L28 42Z"
          fill="#172554"
        />

        {/* Text on spine / cover */}
        <g transform="translate(62, 38) rotate(-11)">
          <text
            x="0"
            y="0"
            fill="#FFFFFF"
            fontSize="7.5"
            fontWeight="800"
            letterSpacing="1.8"
            opacity="0.95"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            ACCOUNTANCY
          </text>
        </g>
      </g>
    </svg>
  );
}
