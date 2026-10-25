export default function NotebookRed({ className = "w-full h-full", ...props }) {
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
        <linearGradient id="nr-cover" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F87171" />
          <stop offset="0.5" stopColor="#EF4444" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
        <filter id="nr-shadow" x="15" y="15" width="130" height="105" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#B91C1C" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#nr-shadow)" transform="rotate(7 80 65)">
        {/* Red Notebook Cover */}
        <rect x="36" y="24" width="86" height="82" rx="7" fill="url(#nr-cover)" />
        {/* Inside page reveal */}
        <rect x="42" y="27" width="76" height="76" rx="4" fill="#FFF5F5" />

        {/* Wire Spiral across top/side */}
        {[32, 44, 56, 68, 80, 92].map((y, i) => (
          <g key={i}>
            <circle cx="36" cy={y} r="2.2" fill="#B91C1C" />
            <path
              d={`M32 ${y - 2}C30 ${y - 4} 34 ${y - 5} 38 ${y - 2}`}
              stroke="#E2E8F0"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Notebook Lines */}
        {[38, 48, 58, 68, 78, 88].map((y, i) => (
          <line
            key={i}
            x1="48"
            y1={y}
            x2={i % 2 === 0 ? "110" : "102"}
            y2={y}
            stroke="#FECACA"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ))}

        {/* Red / Dark Pen on the right */}
        <g transform="translate(120, 40) rotate(16)">
          <rect x="-2.5" y="0" width="5" height="50" rx="1.5" fill="#991B1B" />
          <rect x="-2.5" y="8" width="5" height="3" fill="#F87171" />
          <path d="M-2.5 50L0 56L2.5 50H-2.5Z" fill="#FCA5A5" />
          <path d="M-0.6 53L0 55.5L0.6 53H-0.6Z" fill="#1E293B" />
        </g>
      </g>
    </svg>
  );
}
