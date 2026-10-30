export default function ContactDecoration() {
  return (
    <div
      aria-hidden="true"
      className="hidden xl:block absolute -right-28 bottom-2 w-72 h-80 pointer-events-none select-none z-10"
    >
      <svg
        viewBox="0 0 280 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
      >
        {/* Soft Shadow on ground */}
        <ellipse cx="140" cy="295" rx="110" ry="14" fill="#000000" opacity="0.08" />

        {/* --- BOOK STACK (Right/Foreground) --- */}
        {/* Bottom Book (Deep Navy) */}
        <g transform="translate(110, 240)">
          {/* Base Book Shadow */}
          <path d="M10 24L110 24L120 42L20 42Z" fill="#0A192F" opacity="0.3" />
          {/* Front / Spine */}
          <path
            d="M5 20C5 18 7 16 9 16L125 16C127 16 129 18 129 20L129 36C129 38 127 40 125 40L9 40C7 40 5 38 5 36Z"
            fill="#1E3A8A"
          />
          {/* Top cover */}
          <path
            d="M5 16L35 0L155 0L125 16Z"
            fill="#1D4ED8"
          />
          {/* Pages (cream/white side) */}
          <path
            d="M125 18L153 2L153 18L125 36Z"
            fill="#FFFBEB"
          />
          <path
            d="M127 20L151 4L151 18L127 34Z"
            fill="#FEF3C7"
          />
        </g>

        {/* Top Book (Rich Blue with Gold Accent) */}
        <g transform="translate(105, 205)">
          {/* Spine */}
          <path
            d="M5 18C5 16 7 15 9 15L120 15C122 15 124 16 124 18L124 33C124 35 122 36 120 36L9 36C7 36 5 35 5 33Z"
            fill="#1E40AF"
          />
          {/* Gold bookmark ribbon */}
          <path d="M60 20L72 20L72 37L66 33L60 37Z" fill="#FBBF24" />
          {/* Top cover */}
          <path
            d="M5 15L32 2L147 2L120 15Z"
            fill="#2563EB"
          />
          {/* Pages */}
          <path
            d="M120 17L145 4L145 18L120 32Z"
            fill="#FAF5FF"
          />
        </g>

        {/* --- POTTED PLANT (Left side, standing tall) --- */}
        {/* Pot Saucer / Base */}
        <ellipse cx="65" cy="275" rx="36" ry="7" fill="#E2E8F0" />
        
        {/* Ceramic White Planter */}
        <path
          d="M34 200L42 270C43 273 47 275 52 275H78C83 275 87 273 88 270L96 200Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        {/* Pot rim highlight */}
        <ellipse cx="65" cy="200" rx="31" ry="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        {/* Soil inside pot */}
        <ellipse cx="65" cy="200" rx="27" ry="4.5" fill="#583101" opacity="0.8" />

        {/* Plant Stems and Foliage (Lush Botanical Greens) */}
        {/* Stem 1 (Center upright) */}
        <path
          d="M65 198Q62 140 70 80"
          stroke="#15803D"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Leaf 1 (Top Center) */}
        <path
          d="M70 80C65 50 85 25 95 30C105 35 110 65 85 85C78 90 70 85 70 80Z"
          fill="#16A34A"
        />
        <path d="M72 78Q85 55 95 32" stroke="#22C55E" strokeWidth="1.5" />

        {/* Stem 2 (Left arching) */}
        <path
          d="M65 198Q50 150 25 115"
          stroke="#166534"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Leaf 2 (Left broad leaf) */}
        <path
          d="M25 115C10 95 10 70 25 72C40 75 55 95 40 120C32 122 26 120 25 115Z"
          fill="#15803D"
        />
        <path d="M28 112Q25 90 25 74" stroke="#4ADE80" strokeWidth="1.2" />

        {/* Stem 3 (Right arching toward books) */}
        <path
          d="M65 198Q85 160 115 135"
          stroke="#15803D"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Leaf 3 (Right broad leaf) */}
        <path
          d="M115 135C135 120 150 130 145 145C140 160 115 170 102 150C100 144 108 138 115 135Z"
          fill="#22C55E"
        />
        <path d="M112 140Q130 135 143 143" stroke="#86EFAC" strokeWidth="1.2" />

        {/* Lower Left Leaf */}
        <path
          d="M65 198Q40 175 18 170"
          stroke="#166534"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M18 170C5 158 8 140 22 142C35 145 42 165 30 180C24 182 19 175 18 170Z"
          fill="#16A34A"
        />

        {/* Front Foreground Sprout Leaf */}
        <path
          d="M65 198Q70 170 82 165"
          stroke="#15803D"
          strokeWidth="2.5"
        />
        <path
          d="M82 165C92 155 102 160 98 172C92 182 80 180 78 172Z"
          fill="#4ADE80"
        />
      </svg>
    </div>
  );
}

