export default function ChecklistClock({ className = "w-full h-full", ...props }) {
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
        <linearGradient id="cc-clock" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.6" stopColor="#6D28D9" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <filter id="cc-shadow" x="15" y="15" width="130" height="105" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#5B21B6" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#cc-shadow)">
        {/* Test Checklist Clipboard (Tilted on Left) */}
        <g transform="translate(42, 24) rotate(-8)">
          {/* Clipboard Board */}
          <rect x="0" y="4" width="60" height="76" rx="6" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1.5" />
          {/* Metal Clip */}
          <rect x="18" y="0" width="24" height="8" rx="2" fill="#8B5CF6" />
          <circle cx="30" cy="4" r="1.5" fill="#FFFFFF" />

          {/* Test Paper Lines & Purple Ticks */}
          {[16, 28, 40, 52, 64].map((y, i) => (
            <g key={i}>
              <path
                d={`M10 ${y}L13 ${y + 2.5}L18 ${y - 2}`}
                stroke="#6D28D9"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="24"
                y1={y}
                x2={i % 2 === 0 ? "50" : "44"}
                y2={y}
                stroke="#A78BFA"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* Purple Desktop Clock (Right foreground) */}
        <g transform="translate(108, 80)">
          {/* Clock Bezel / Case */}
          <circle cx="0" cy="0" r="24" fill="url(#cc-clock)" />
          {/* Clock Face White */}
          <circle cx="0" cy="0" r="19" fill="#FFFFFF" />

          {/* 12, 3, 6, 9 markers */}
          <circle cx="0" cy="-14" r="1" fill="#6D28D9" />
          <circle cx="14" cy="0" r="1" fill="#6D28D9" />
          <circle cx="0" cy="14" r="1" fill="#6D28D9" />
          <circle cx="-14" cy="0" r="1" fill="#6D28D9" />

          {/* Clock Hands pointing ~10:10 */}
          {/* Hour hand */}
          <line x1="0" y1="0" x2="-6" y2="-7" stroke="#4C1D95" strokeWidth="2.2" strokeLinecap="round" />
          {/* Minute hand */}
          <line x1="0" y1="0" x2="8" y2="-9" stroke="#6D28D9" strokeWidth="1.6" strokeLinecap="round" />
          {/* Center Pin */}
          <circle cx="0" cy="0" r="2" fill="#8B5CF6" />

          {/* Twin Bells / Feet at base */}
          <path d="M-14 20L-18 25" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 20L18 25" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
