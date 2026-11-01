/**
 * Custom inline vector graphics for About page:
 * - SparkCluster: 3 short angled yellow strokes
 * - CtaBooksIllustration: Two stacked hardcover books (Yellow on top, Deep Blue below)
 *   with visible cover thickness, white page blocks with ledger lines, and crisp isometric perspective.
 * - DecorativeArcLeft & DecorativeArcRight: Thin yellow curved SVG lines
 */

// 3 angled yellow spark strokes
export function SparkCluster({ className = "w-6 h-6 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 12L8.5 2.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12.5 14L20 4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M18.5 22.5L25.5 14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// CTA 3D Stacked Hardcover Books Illustration
export function CtaBooksIllustration({ className = "w-44 sm:w-52 h-32 sm:h-38" }) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft Drop Shadow under bottom book */}
      <ellipse
        cx="96"
        cy="124"
        rx="82"
        ry="13"
        fill="#05101E"
        fillOpacity="0.5"
      />

      {/* ========================================================================= */}
      {/* BOTTOM BOOK: Deep Blue Hardcover with White Pages                         */}
      {/* ========================================================================= */}
      <g id="bottom-book">
        {/* Bottom book lower board */}
        <path
          d="M16 88L96 117L182 86L102 59L16 88Z"
          fill="#0B1B32"
        />

        {/* Bottom book page block - front edge */}
        <path
          d="M18 86L96 114V99L18 72V86Z"
          fill="#DDE5ED"
        />
        {/* Bottom book page block - right edge */}
        <path
          d="M96 114L180 84V69L96 99V114Z"
          fill="#F2F6FA"
        />
        {/* Subtle page lines on right edge */}
        <line x1="96" y1="104" x2="178" y2="75" stroke="#CAD5E2" strokeWidth="0.8" />
        <line x1="96" y1="109" x2="178" y2="79" stroke="#CAD5E2" strokeWidth="0.8" />

        {/* Bottom book top cover board */}
        <path
          d="M15 69L96 98L183 67L102 41L15 69Z"
          fill="#1B3A68"
        />
        {/* Front cover edge rim / thickness */}
        <path
          d="M15 69L96 98V102L15 73V69Z"
          fill="#112543"
        />
        {/* Left spine rim */}
        <path
          d="M15 69L102 41V44L15 73V69Z"
          fill="#0E1E36"
        />
      </g>

      {/* ========================================================================= */}
      {/* TOP BOOK: Vibrant Yellow Hardcover (#FFC629) with Crisp White Pages       */}
      {/* ========================================================================= */}
      <g id="top-book" transform="translate(4, -14)">
        {/* Top book lower board */}
        <path
          d="M18 76L96 104L180 75L102 49L18 76Z"
          fill="#CC9408"
        />

        {/* Top book page block - front edge */}
        <path
          d="M20 74L96 101V81L20 54V74Z"
          fill="#EDF2F7"
        />
        {/* Top book page block - right edge */}
        <path
          d="M96 101L178 72V52L96 81V101Z"
          fill="#FFFFFF"
        />
        {/* Clean page lines on right edge */}
        <line x1="96" y1="88" x2="176" y2="59" stroke="#CBD5E1" strokeWidth="0.9" />
        <line x1="96" y1="94" x2="176" y2="65" stroke="#CBD5E1" strokeWidth="0.9" />

        {/* Top book main top cover */}
        <path
          d="M17 51L96 79L182 50L102 24L17 51Z"
          fill="#FFC629"
        />
        {/* Front cover edge thickness / spine rim */}
        <path
          d="M17 51L96 79V83L17 55V51Z"
          fill="#E5A812"
        />
        {/* Left spine edge */}
        <path
          d="M17 51L102 24V28L17 55V51Z"
          fill="#CC9408"
        />
      </g>
    </svg>
  );
}

// Decorative Yellow Arcs for the Pillars Section
export function DecorativeArcLeft({ className = "w-32 h-32 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M-10 130 C40 130, 90 90, 130 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function DecorativeArcRight({ className = "w-20 h-40 text-[#FFC629]" }) {
  return (
    <svg
      viewBox="0 0 60 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M70 10 C20 40, 20 80, 70 110"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
