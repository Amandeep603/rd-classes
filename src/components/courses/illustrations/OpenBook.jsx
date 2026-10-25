export default function OpenBook({ className = "w-full h-full", ...props }) {
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
        <linearGradient id="ob-page-l" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#F8FAFC" />
          <stop offset="0.8" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="ob-page-r" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#E2E8F0" />
          <stop offset="0.2" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1F5F9" />
        </linearGradient>
        <linearGradient id="ob-pen-gold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FCD34D" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <filter id="ob-shadow" x="5" y="20" width="150" height="95" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#78350F" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#ob-shadow)">
        {/* Book cover back base */}
        <path
          d="M16 86C38 78 70 82 80 88C90 82 122 78 144 86L142 92C120 84 90 88 80 94C70 88 40 84 18 92L16 86Z"
          fill="#B45309"
        />

        {/* Left Pages Block */}
        <path
          d="M18 42C44 38 72 44 80 52V88C72 80 44 76 18 80V42Z"
          fill="url(#ob-page-l)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        {/* Right Pages Block */}
        <path
          d="M80 52C88 44 116 38 142 42V80C116 76 88 80 80 88V52Z"
          fill="url(#ob-page-r)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />

        {/* Center Spine shadow */}
        <path
          d="M78 52C79.5 50 80.5 50 82 52V88C80.5 87 79.5 87 78 88V52Z"
          fill="#CBD5E1"
        />

        {/* Ruled lines on Left Page */}
        <line x1="28" y1="52" x2="70" y2="56" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="28" y1="58" x2="68" y2="62" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="28" y1="64" x2="70" y2="68" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="28" y1="70" x2="65" y2="74" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

        {/* Ruled lines on Right Page */}
        <line x1="90" y1="56" x2="132" y2="52" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="92" y1="62" x2="132" y2="58" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="90" y1="68" x2="132" y2="64" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
        <line x1="95" y1="74" x2="130" y2="70" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

        {/* Gold & Dark Pen lying across book */}
        <g transform="translate(108, 48) rotate(32)">
          {/* Pen body */}
          <rect x="-3" y="0" width="6" height="42" rx="2" fill="#1E293B" />
          {/* Gold accents */}
          <rect x="-3" y="6" width="6" height="3" fill="url(#ob-pen-gold)" />
          <rect x="-3" y="24" width="6" height="2" fill="url(#ob-pen-gold)" />
          {/* Gold Clip */}
          <path d="M-4 6V20C-4 21 -3 21 -3 20V6H-4Z" fill="url(#ob-pen-gold)" />
          {/* Nib */}
          <path d="M-2.5 42L0 49L2.5 42H-2.5Z" fill="url(#ob-pen-gold)" />
          <path d="M-0.5 44L0 48L0.5 44H-0.5Z" fill="#1E293B" />
        </g>
      </g>
    </svg>
  );
}
