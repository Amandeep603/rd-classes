export default function BooksLight({ className = "" }) {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Soft pale blue wave/orb gradient */}
        <radialGradient id="wave-light" cx="65%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#D9ECFE" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#EBF4FE" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow-light" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0066FF" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Decorative background pale blue waves */}
      <circle cx="270" cy="140" r="135" fill="url(#wave-light)" />
      <path
        d="M210 50C260 30 330 60 370 110C410 160 380 230 330 260C280 290 220 270 180 230C140 190 160 120 180 80C190 60 200 50 210 50Z"
        fill="#EBF5FE"
        opacity="0.4"
      />

      {/* STACKED 3 LIGHT BOOKS */}
      <g filter="url(#shadow-light)">
        {/* 1. BOTTOM BOOK: RESULTS (Steel Blue) */}
        <g transform="translate(60, 160)">
          <rect x="0" y="0" width="280" height="48" rx="8" fill="#B9DCFE" stroke="#90C5FD" strokeWidth="1.5" />
          <path d="M0 8C0 3.58 3.58 0 8 0H20V48H8C3.58 48 0 44.42 0 40V8Z" fill="#9CCBFE" />
          <text
            x="148"
            y="29"
            fill="#0B2545"
            fontSize="13"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.5"
            textAnchor="middle"
          >
            RESULTS
          </text>
          <rect x="272" y="5" width="8" height="38" rx="2" fill="#FFFFFF" />
          <line x1="274" y1="10" x2="274" y2="38" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* 2. MIDDLE BOOK: PRACTICE (Soft Blue) */}
        <g transform="translate(75, 110)">
          <rect x="0" y="0" width="275" height="46" rx="8" fill="#D6EBFE" stroke="#B8DEFD" strokeWidth="1.5" />
          <path d="M0 8C0 3.58 3.58 0 8 0H20V46H8C3.58 46 0 42.42 0 38V8Z" fill="#BCE0FE" />
          <text
            x="145"
            y="28"
            fill="#0B2545"
            fontSize="13"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.5"
            textAnchor="middle"
          >
            PRACTICE
          </text>
          <rect x="267" y="5" width="8" height="36" rx="2" fill="#FFFFFF" />
          <line x1="270" y1="9" x2="270" y2="37" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* 3. TOP BOOK: ACCOUNTS (Light Sky Blue) */}
        <g transform="translate(95, 60)">
          <rect x="0" y="0" width="265" height="46" rx="8" fill="#EDF6FF" stroke="#CCE5FE" strokeWidth="1.5" />
          <path d="M0 8C0 3.58 3.58 0 8 0H20V46H8C3.58 46 0 42.42 0 38V8Z" fill="#D8ECFF" />
          <text
            x="135"
            y="28"
            fill="#0B2545"
            fontSize="13.5"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.5"
            textAnchor="middle"
          >
            ACCOUNTS
          </text>
          <rect x="257" y="5" width="8" height="36" rx="2" fill="#FFFFFF" />
          <line x1="260" y1="9" x2="260" y2="37" stroke="#E2E8F0" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}
