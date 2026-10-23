import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function StandaloneAuthBar({ theme = "light" }) {
  const isDark = theme === "dark";

  return (
    <header className="w-full shrink-0 z-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          className={`inline-flex items-center justify-center rounded-xl p-1.5 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] ${
            isDark
              ? "bg-white/10 border border-white/15"
              : "bg-white border border-black/5 shadow-2xs"
          }`}
          aria-label="RD Classes Home"
        >
          <Image
            src="/images/logo-rd.png"
            alt="RD Classes"
            width={76}
            height={38}
            priority
            style={{ width: "auto", height: "30px" }}
            className="object-contain select-none"
          />
        </Link>

        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all rounded-xl px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] ${
            isDark
              ? "text-slate-300 hover:text-white hover:bg-white/10"
              : "text-[#4B5563] hover:text-[#111827] hover:bg-black/5"
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Back to website</span>
        </Link>
      </div>
    </header>
  );
}
