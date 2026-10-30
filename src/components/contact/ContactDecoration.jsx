export default function ContactDecoration() {
  return (
    <div
      aria-hidden="true"
      className="hidden lg:flex flex-col justify-between items-start h-full min-h-[480px] relative select-none pointer-events-none w-full max-w-[260px] xl:max-w-[280px] transition-transform duration-300 max-xl:scale-[0.82] max-xl:origin-top-left"
    >
      {/* Large Soft Light-Blue Circular Background */}
      <div className="w-[300px] h-[300px] xl:w-[340px] xl:h-[340px] rounded-full bg-[#E0F2FE]/75 blur-xs absolute -top-8 -right-8 -z-10" />

      {/* Top: Handwritten Note in Caveat font with yellow stroke */}
      <div className="pt-2 pl-2 rotate-[-3deg]">
        <div className="font-[family-name:var(--font-caveat)] text-[28px] xl:text-[32px] font-bold text-[#1E293B] leading-[1.05]">
          Learn
          <br />
          Practice
          <br />
          Score Higher
        </div>
        {/* Yellow wavy underline SVG */}
        <svg
          className="w-28 h-4 text-[#FFB800] -mt-1 ml-1"
          viewBox="0 0 100 14"
          fill="none"
        >
          <path
            d="M2 10C26 3 70 2 98 9"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom: Potted Plant & Navy Books Illustration */}
      <div className="w-full h-64 mt-auto relative">
        <svg
          viewBox="0 0 280 290"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.06)]"
        >
          {/* Ground shadow */}
          <ellipse cx="140" cy="270" rx="100" ry="12" fill="#000000" opacity="0.07" />

          {/* --- STACK OF NAVY HARDCOVER BOOKS (Right) --- */}
          {/* Bottom Book */}
          <g transform="translate(115, 215)">
            <path d="M8 22L105 22L115 38L18 38Z" fill="#0A192F" opacity="0.3" />
            <path
              d="M4 18C4 16 6 15 8 15L120 15C122 15 124 16 124 18L124 33C124 35 122 36 120 36L8 36C6 36 4 35 4 33Z"
              fill="#1E3A8A"
            />
            <path d="M4 15L32 2L145 2L120 15Z" fill="#1D4ED8" />
            <path d="M120 17L145 3L145 18L120 32Z" fill="#FFFBEB" />
          </g>

          {/* Top Book */}
          <g transform="translate(110, 185)">
            <path
              d="M4 16C4 14 6 13 8 13L115 13C117 13 119 14 119 16L119 30C119 32 117 33 115 33L8 33C6 33 4 32 4 30Z"
              fill="#1E40AF"
            />
            {/* Gold Bookmark Ribbon */}
            <path d="M55 18L66 18L66 34L60.5 30L55 34Z" fill="#FBBF24" />
            <path d="M4 13L29 2L138 2L115 13Z" fill="#2563EB" />
            <path d="M115 15L138 3L138 17L115 29Z" fill="#FAF5FF" />
          </g>

          {/* --- POTTED PLANT (Left) --- */}
          {/* Pot Saucer */}
          <ellipse cx="60" cy="255" rx="34" ry="6" fill="#E2E8F0" />

          {/* Ceramic White Planter */}
          <path
            d="M32 185L39 250C40 253 44 255 49 255H71C76 255 80 253 81 250L88 185Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          <ellipse cx="60" cy="185" rx="28" ry="5.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <ellipse cx="60" cy="185" rx="25" ry="4" fill="#583101" opacity="0.8" />

          {/* Plant Stems and Lush Foliage */}
          {/* Center Stem */}
          <path d="M60 183Q58 130 65 75" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          {/* Top Leaf */}
          <path
            d="M65 75C60 48 78 25 88 30C98 35 102 62 80 80C73 85 65 80 65 75Z"
            fill="#16A34A"
          />
          <path d="M67 73Q80 52 88 32" stroke="#22C55E" strokeWidth="1.5" />

          {/* Left Arching Stem */}
          <path d="M60 183Q46 140 24 105" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M24 105C10 88 10 65 24 67C38 70 50 88 36 110C30 112 25 110 24 105Z"
            fill="#15803D"
          />
          <path d="M26 102Q24 82 24 68" stroke="#4ADE80" strokeWidth="1.2" />

          {/* Right Arching Stem */}
          <path d="M60 183Q78 150 105 125" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M105 125C122 112 136 120 132 134C128 147 106 155 94 138C92 133 99 127 105 125Z"
            fill="#22C55E"
          />
          <path d="M103 129Q118 124 130 132" stroke="#86EFAC" strokeWidth="1.2" />

          {/* Lower Sprout Leaf */}
          <path d="M60 183Q74 160 84 155" stroke="#15803D" strokeWidth="2.5" />
          <path
            d="M84 155C93 146 101 150 98 160C92 168 82 166 80 160Z"
            fill="#4ADE80"
          />
        </svg>
      </div>
    </div>
  );
}
