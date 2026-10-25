export default function LaptopPlay({ className = "w-full h-full", ...props }) {
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
        <linearGradient id="lp-screen" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#065F46" />
          <stop offset="0.7" stopColor="#047857" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="lp-body" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#334155" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <filter id="lp-shadow" x="15" y="20" width="130" height="95" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#064E3B" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#lp-shadow)">
        {/* Laptop Display Lid Back */}
        <rect x="36" y="28" width="88" height="58" rx="6" fill="#1E293B" />
        {/* Bezel */}
        <rect x="39" y="31" width="82" height="52" rx="4" fill="#0F172A" />
        {/* Screen with green gradient */}
        <rect x="42" y="34" width="76" height="46" rx="2" fill="url(#lp-screen)" />

        {/* Circular Play Button on Screen */}
        <circle cx="80" cy="57" r="13" fill="#FFFFFF" fillOpacity="0.95" />
        {/* Play Triangle */}
        <path d="M76 50.5L87 57L76 63.5V50.5Z" fill="#047857" />

        {/* Webcam dot */}
        <circle cx="80" cy="32.5" r="1" fill="#475569" />

        {/* Laptop Base (Perspective Keyboard deck) */}
        <path
          d="M24 90L36 86H124L136 90C138 91 138 93 135 94L128 97C126 98 124 98 122 98H38C36 98 34 98 32 97L25 94C22 93 22 91 24 90Z"
          fill="url(#lp-body)"
        />
        {/* Trackpad */}
        <rect x="68" y="91" width="24" height="4" rx="1" fill="#475569" />
        {/* Opening notch */}
        <path d="M72 87H88L86 89H74L72 87Z" fill="#64748B" />
      </g>
    </svg>
  );
}
