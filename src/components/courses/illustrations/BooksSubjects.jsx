export default function BooksSubjects({ className = "" }) {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Warm golden-cream circle backdrop */}
        <radialGradient id="backdrop-subjects" cx="70%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFEAA7" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#FFE082" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFF9EB" stopOpacity="0" />
        </radialGradient>
        {/* Soft shadow for stacked books */}
        <filter id="shadow-book" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#0B1B3D" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Backdrop decorative orb */}
      <circle cx="280" cy="150" r="130" fill="url(#backdrop-subjects)" />

      {/* STACKED 3 BOOKS */}
      <g filter="url(#shadow-book)">
        {/* 1. BOTTOM BOOK: FINANCIAL STATEMENTS (Deep Navy) */}
        <g transform="translate(60, 160)">
          {/* Main Book Spine & Body */}
          <rect x="0" y="0" width="280" height="48" rx="8" fill="#0B2545" />
          {/* Book Spine Edge Highlight */}
          <path d="M0 8C0 3.58 3.58 0 8 0H20V48H8C3.58 48 0 44.42 0 40V8Z" fill="#071A36" />
          {/* Gold Decorative Spine Line */}
          <line x1="28" y1="6" x2="28" y2="42" stroke="#FFB800" strokeWidth="2" strokeDasharray="3 3" />
          {/* Text: FINANCIAL STATEMENTS */}
          <text
            x="148"
            y="29"
            fill="#FFFFFF"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.2"
            textAnchor="middle"
          >
            FINANCIAL STATEMENTS
          </text>
          {/* Pages Edge on the right */}
          <rect x="272" y="5" width="8" height="38" rx="2" fill="#F8FAFC" />
          <line x1="274" y1="10" x2="274" y2="38" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="277" y1="10" x2="277" y2="38" stroke="#CBD5E1" strokeWidth="1" />
        </g>

        {/* 2. MIDDLE BOOK: COMPANY ACCOUNTS (Cream) */}
        <g transform="translate(75, 110)">
          {/* Main Book Spine & Body */}
          <rect x="0" y="0" width="275" height="46" rx="8" fill="#FFF8E7" stroke="#F6E7C1" strokeWidth="1.5" />
          {/* Book Spine Edge */}
          <path d="M0 8C0 3.58 3.58 0 8 0H20V46H8C3.58 46 0 42.42 0 38V8Z" fill="#FCEAC0" />
          {/* Text: COMPANY ACCOUNTS */}
          <text
            x="145"
            y="28"
            fill="#0B2545"
            fontSize="13"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2"
            textAnchor="middle"
          >
            COMPANY ACCOUNTS
          </text>
          {/* Pages Edge on the right */}
          <rect x="267" y="5" width="8" height="36" rx="2" fill="#FFFFFF" />
          <line x1="270" y1="9" x2="270" y2="37" stroke="#E2E8F0" strokeWidth="1" />
        </g>

        {/* 3. TOP BOOK: PARTNERSHIP (Navy) */}
        <g transform="translate(95, 60)">
          {/* Main Book Spine & Body */}
          <rect x="0" y="0" width="265" height="46" rx="8" fill="#0E3366" />
          {/* Book Spine Edge */}
          <path d="M0 8C0 3.58 3.58 0 8 0H20V46H8C3.58 46 0 42.42 0 38V8Z" fill="#0A254C" />
          {/* Gold Decorative Corner Ribbon */}
          <polygon points="215,0 235,0 235,16 225,12 215,16" fill="#FFB800" />
          {/* Text: PARTNERSHIP */}
          <text
            x="135"
            y="28"
            fill="#FFFFFF"
            fontSize="13.5"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2.5"
            textAnchor="middle"
          >
            PARTNERSHIP
          </text>
          {/* Pages Edge on the right */}
          <rect x="257" y="5" width="8" height="36" rx="2" fill="#F1F5F9" />
          <line x1="260" y1="9" x2="260" y2="37" stroke="#CBD5E1" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}
