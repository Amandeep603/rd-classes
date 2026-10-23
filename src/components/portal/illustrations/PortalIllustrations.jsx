import React from "react";

/**
 * 3D isometric stack of books in navy and golden yellow.
 */
export function BookStackIllustration({ className = "w-28 h-20" }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft Ground Shadow */}
      <ellipse cx="80" cy="108" rx="60" ry="10" fill="#0F172A" fillOpacity="0.12" />

      {/* Book 1 (Bottom, Dark Blue) */}
      <g id="book-bottom">
        <path
          d="M30 84 L120 72 L140 82 L50 94 Z"
          fill="#0B2A47"
        />
        <path
          d="M50 94 L140 82 L140 92 L50 104 Z"
          fill="#06182B"
        />
        <path
          d="M30 84 L50 94 L50 104 L30 94 Z"
          fill="#13436E"
        />
        {/* Pages Edge */}
        <path
          d="M136 83 L138 90 L52 102 L52 95 Z"
          fill="#FFFDF7"
        />
      </g>

      {/* Book 2 (Middle, Cyan Blue) */}
      <g id="book-middle">
        <path
          d="M36 68 L124 58 L142 67 L54 77 Z"
          fill="#3B82F6"
        />
        <path
          d="M54 77 L142 67 L142 75 L54 85 Z"
          fill="#1D4ED8"
        />
        <path
          d="M36 68 L54 77 L54 85 L36 76 Z"
          fill="#60A5FA"
        />
        {/* Pages Edge */}
        <path
          d="M138 68 L140 73 L56 83 L56 78 Z"
          fill="#F8FAFC"
        />
      </g>

      {/* Book 3 (Top, Golden Yellow) */}
      <g id="book-top">
        <path
          d="M45 52 L128 44 L144 52 L61 60 Z"
          fill="#FFC21A"
        />
        <path
          d="M61 60 L144 52 L144 58 L61 66 Z"
          fill="#D99E0B"
        />
        <path
          d="M45 52 L61 60 L61 66 L45 58 Z"
          fill="#FFD54A"
        />
        {/* Pages Edge */}
        <path
          d="M140 53 L142 57 L63 65 L63 61 Z"
          fill="#FFFBF0"
        />
        {/* Top Cover Bookmark Ribbon */}
        <path
          d="M85 49 L94 48 L97 66 L90 62 L83 66 Z"
          fill="#DC2626"
        />
      </g>
    </svg>
  );
}

/**
 * Botanical decorative leaves branch.
 */
export function LeavesIllustration({ className = "w-24 h-28" }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 130 C40 100 65 60 90 20"
        stroke="#A7D7F9"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M90 20 C85 35 70 42 55 35 C65 25 80 18 90 20 Z"
        fill="#72BAF5"
        opacity="0.85"
      />
      <path
        d="M72 45 C78 60 70 72 54 70 C56 55 65 46 72 45 Z"
        fill="#90CCF8"
        opacity="0.75"
      />
      <path
        d="M52 75 C60 90 50 102 36 98 C40 85 46 76 52 75 Z"
        fill="#B8DFFC"
        opacity="0.65"
      />
      <path
        d="M35 105 C42 118 34 128 22 124 C26 112 30 106 35 105 Z"
        fill="#CCE8FD"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Combined bottom card art for the Student Sidebar and Login Left Panel.
 */
export function SidebarBottomArt({ className = "w-full" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-t from-[#E6F3FD] to-transparent p-4 pt-6 text-left ${className}`}>
      {/* Background Soft Wave */}
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-[#D7EDFC]/60 blur-xl pointer-events-none" />
      <div className="absolute top-2 right-1 opacity-70 pointer-events-none">
        <LeavesIllustration className="w-16 h-20" />
      </div>

      <div className="relative z-10 flex flex-col justify-end">
        <h3 className="text-sm font-extrabold text-[#0B1E36] leading-tight">
          Consistent<br />
          Learning<br />
          Brighter<br />
          Results
        </h3>
        <div className="w-6 h-0.5 bg-[#FFC21A] rounded-full mt-2 mb-3" />

        <div className="flex justify-end pr-1">
          <BookStackIllustration className="w-24 h-16" />
        </div>
      </div>
    </div>
  );
}
