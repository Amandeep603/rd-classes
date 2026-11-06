import Image from "next/image";

export default function ContactDecoration() {
  return (
    <div
      aria-hidden="true"
      className="hidden lg:flex flex-col justify-between items-start h-full min-h-[480px] relative select-none pointer-events-none w-full max-w-[260px] xl:max-w-[280px]"
    >
      <style>{`
        @keyframes contactFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-contact-float {
            animation: contactFloat 5s ease-in-out infinite;
          }
        }
      `}</style>

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

      {/* Bottom: 3D Plant & Books Illustration matching reference */}
      <div className="w-full mt-auto pt-4 animate-contact-float">
        <Image
          src="/contact-illustration.png"
          alt="3D plant in pot with textbooks and bookmark"
          width={1200}
          height={1200}
          priority
          className="w-full h-auto object-contain"
          sizes="(max-width: 1280px) 260px, 280px"
        />
      </div>
    </div>
  );
}
