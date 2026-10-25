export default function RevisionPlan({ className = "w-full h-full", ...props }) {
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
        <linearGradient id="rp-pencil" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FB923C" />
          <stop offset="0.6" stopColor="#EA580C" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
        <filter id="rp-shadow" x="15" y="15" width="130" height="105" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#C2410C" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#rp-shadow)" transform="rotate(-6 80 65)">
        {/* Notepad Base */}
        <rect x="36" y="22" width="86" height="84" rx="8" fill="#FFFBF5" stroke="#FDE68A" strokeWidth="1.5" />
        {/* Spiral Ring Holes and Rings */}
        {[30, 42, 54, 66, 78, 90, 102].map((y, i) => (
          <g key={i}>
            <circle cx="36" cy={y} r="2.2" fill="#E2E8F0" />
            <path
              d={`M32 ${y - 2}C30 ${y - 4} 34 ${y - 5} 38 ${y - 2}`}
              stroke="#64748B"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Title "Revision Plan" */}
        <text
          x="50"
          y="38"
          fill="#1E293B"
          fontSize="8"
          fontWeight="800"
          letterSpacing="0.4"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Revision Plan
        </text>

        {/* Checkboxes & lines */}
        {[50, 64, 78, 92].map((y, i) => (
          <g key={i}>
            <rect x="50" y={y - 6} width="8" height="8" rx="2" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
            {i < 3 && (
              <path
                d={`M52 ${y - 2}L54.5 ${y}L57 ${y - 4}`}
                stroke="#D97706"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <line
              x1="64"
              y1={y - 2}
              x2={i % 2 === 0 ? "108" : "96"}
              y2={y - 2}
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Orange Pencil resting beside/across notepad */}
        <g transform="translate(118, 46) rotate(22)">
          <rect x="-3" y="0" width="6" height="52" rx="1.5" fill="url(#rp-pencil)" />
          {/* Wood cone & lead tip */}
          <path d="M-3 0L0 -7L3 0H-3Z" fill="#FDE68A" />
          <path d="M-1.2 -4L0 -7L1.2 -4H-1.2Z" fill="#1E293B" />
          {/* Eraser & metal collar */}
          <rect x="-3" y="44" width="6" height="4" fill="#CBD5E1" />
          <rect x="-3" y="48" width="6" height="6" rx="1" fill="#F43F5E" />
        </g>
      </g>
    </svg>
  );
}
