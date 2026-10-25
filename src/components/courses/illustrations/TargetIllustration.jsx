export default function TargetIllustration({ className = "w-full h-full", ...props }) {
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
        <radialGradient id="tgt-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(75 65) rotate(45) scale(50)">
          <stop stopColor="#FB923C" />
          <stop offset="0.7" stopColor="#F97316" />
          <stop offset="1" stopColor="#C2410C" />
        </radialGradient>
        <filter id="tgt-shadow" x="20" y="15" width="120" height="105" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#EA580C" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#tgt-shadow)">
        {/* Outer Orange Disc with 3D tilt */}
        <ellipse cx="78" cy="68" rx="46" ry="42" fill="url(#tgt-grad)" />
        {/* White Ring 1 */}
        <ellipse cx="78" cy="68" rx="36" ry="33" fill="#FFFFFF" />
        {/* Orange Ring 2 */}
        <ellipse cx="78" cy="68" rx="26" ry="24" fill="#F97316" />
        {/* White Ring 3 */}
        <ellipse cx="78" cy="68" rx="17" ry="15.5" fill="#FFFFFF" />
        {/* Bullseye Red/Orange */}
        <ellipse cx="78" cy="68" rx="8" ry="7.5" fill="#DC2626" />

        {/* Arrow hitting Bullseye */}
        <g transform="translate(78, 68) rotate(-42)">
          {/* Shaft */}
          <line x1="0" y1="0" x2="52" y2="0" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          {/* Arrowhead in bullseye */}
          <path d="M0 0L8 -4V4L0 0Z" fill="#B45309" />
          {/* Feathers / Fletching */}
          <path d="M42 0L48 -7L54 -7L48 0Z" fill="#F97316" />
          <path d="M42 0L48 7L54 7L48 0Z" fill="#F97316" />
          <path d="M46 0L50 -9L56 -9L52 0Z" fill="#FEF3C7" />
          <path d="M46 0L50 9L56 9L52 0Z" fill="#FEF3C7" />
        </g>
      </g>
    </svg>
  );
}
