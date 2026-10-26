"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

/**
 * StillLifeIllustration - Custom inline SVG depicting the dark study room scene:
 * - Stack of three hardcover books: ACCOUNTANCY, BUSINESS STUDIES, ECONOMICS
 * - Cream ceramic pen cup with ballpoint pens and a sharp yellow pencil
 * - Deep emerald plant leaves at the left
 * - Sleek laptop edge at the bottom
 */
function StillLifeIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 540 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Gradients for books, cup, laptop */}
        <linearGradient id="book-acct" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="50%" stopColor="#152B47" />
          <stop offset="100%" stopColor="#0E1D31" />
        </linearGradient>
        <linearGradient id="book-bs" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDE8DC" />
          <stop offset="50%" stopColor="#DFD8C7" />
          <stop offset="100%" stopColor="#CEC5B1" />
        </linearGradient>
        <linearGradient id="book-eco" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A3354" />
          <stop offset="50%" stopColor="#12253D" />
          <stop offset="100%" stopColor="#0B1727" />
        </linearGradient>
        <linearGradient id="pages-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#F5E6BE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cup-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBF7EE" />
          <stop offset="50%" stopColor="#EFE8D6" />
          <stop offset="100%" stopColor="#D6CEBB" />
        </linearGradient>
        <linearGradient id="laptop-lid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A5568" />
          <stop offset="30%" stopColor="#2D3748" />
          <stop offset="70%" stopColor="#1A202C" />
          <stop offset="100%" stopColor="#0F141C" />
        </linearGradient>
        <linearGradient id="leaf-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D5A43" />
          <stop offset="100%" stopColor="#132B1E" />
        </linearGradient>
        <linearGradient id="leaf-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B7457" />
          <stop offset="100%" stopColor="#1C3D2B" />
        </linearGradient>
      </defs>

      {/* Desk Shadow Foundation */}
      <ellipse cx="270" cy="350" rx="250" ry="25" fill="#03070E" fillOpacity="0.6" />

      {/* PLANT LEAVES (Left background) */}
      <g opacity="0.92">
        {/* Leaf 1 (Large back) */}
        <path
          d="M 15 320 C 5 240 25 150 90 95 C 105 135 100 200 65 270 Z"
          fill="url(#leaf-grad-1)"
        />
        {/* Leaf 2 (Arching front) */}
        <path
          d="M 50 330 C 40 220 70 120 145 70 C 150 120 135 190 95 285 Z"
          fill="url(#leaf-grad-2)"
        />
        {/* Leaf stem */}
        <path
          d="M 45 340 Q 80 200 135 80"
          stroke="#132B1E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Leaf veins */}
        <path
          d="M 75 220 Q 95 205 115 210 M 90 170 Q 110 155 125 160"
          stroke="#4D8E6C"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* STACK OF THREE BOOKS */}
      <g id="books-stack">
        {/* BOOK 3 (BOTTOM): ECONOMICS */}
        <g id="book-economics">
          {/* Base shadow */}
          <rect x="75" y="278" width="220" height="34" rx="5" fill="#02050A" fillOpacity="0.5" />
          {/* Book block (pages) */}
          <rect x="275" y="273" width="22" height="34" rx="2" fill="url(#pages-gold)" />
          {/* Book cover / spine */}
          <rect x="70" y="270" width="215" height="40" rx="6" fill="url(#book-eco)" stroke="#23426A" strokeWidth="1" />
          {/* Spine ribbed bands */}
          <line x1="82" y1="270" x2="82" y2="310" stroke="#FFB800" strokeWidth="1" opacity="0.6" />
          <line x1="86" y1="270" x2="86" y2="310" stroke="#FFB800" strokeWidth="1" opacity="0.6" />
          <line x1="270" y1="270" x2="270" y2="310" stroke="#FFB800" strokeWidth="1" opacity="0.6" />
          {/* Spine Title */}
          <text
            x="175"
            y="295"
            fill="#E2E8F0"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2.5"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ECONOMICS
          </text>
        </g>

        {/* BOOK 2 (MIDDLE): BUSINESS STUDIES */}
        <g id="book-business-studies">
          {/* Shadow over bottom book */}
          <rect x="80" y="235" width="210" height="32" rx="4" fill="#040914" fillOpacity="0.3" />
          {/* Pages */}
          <rect x="268" y="230" width="20" height="34" rx="2" fill="#E2DAC7" />
          {/* Book cover (light cream leather) */}
          <rect x="75" y="228" width="200" height="38" rx="6" fill="url(#book-bs)" stroke="#B8AE96" strokeWidth="1" />
          {/* Embossed title */}
          <text
            x="170"
            y="252"
            fill="#1E293B"
            fontSize="11"
            fontWeight="800"
            letterSpacing="2"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            BUSINESS STUDIES
          </text>
        </g>

        {/* BOOK 1 (TOP): ACCOUNTANCY */}
        <g id="book-accountancy">
          {/* Shadow over middle book */}
          <rect x="85" y="194" width="200" height="30" rx="4" fill="#040914" fillOpacity="0.35" />
          {/* Pages */}
          <rect x="260" y="188" width="20" height="34" rx="2" fill="url(#pages-gold)" />
          {/* Book cover (rich navy) */}
          <rect x="80" y="186" width="190" height="38" rx="6" fill="url(#book-acct)" stroke="#2B517E" strokeWidth="1.2" />
          {/* Golden spine accents */}
          <line x1="92" y1="186" x2="92" y2="224" stroke="#FFB800" strokeWidth="1" opacity="0.8" />
          <line x1="258" y1="186" x2="258" y2="224" stroke="#FFB800" strokeWidth="1" opacity="0.8" />
          {/* Spine Title */}
          <text
            x="172"
            y="210"
            fill="#FFB800"
            fontSize="12"
            fontWeight="800"
            letterSpacing="3"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ACCOUNTANCY
          </text>
        </g>
      </g>

      {/* CREAM PEN CUP WITH PENS & PENCIL */}
      <g id="pen-cup">
        {/* Shadow under cup */}
        <ellipse cx="330" cy="335" rx="36" ry="12" fill="#02060C" fillOpacity="0.65" />

        {/* YELLOW PENCIL */}
        <g id="pencil">
          {/* Pencil body (bright #FFB800 yellow) */}
          <path d="M 342 165 L 350 162 L 340 260 L 332 260 Z" fill="#FFB800" />
          {/* Pencil wood taper */}
          <polygon points="342,165 350,162 346,145" fill="#E8D5B5" />
          {/* Graphite lead tip */}
          <polygon points="345,150 347,149 346,145" fill="#1A202C" />
          {/* Ferrule & Eraser */}
          <rect x="330" y="260" width="10" height="6" rx="1" fill="#CBD5E0" />
        </g>

        {/* PEN 1 (Navy ballpoint with clip) */}
        <g id="pen-navy">
          <path d="M 322 175 L 328 173 L 322 265 L 316 265 Z" fill="#0F1F35" stroke="#25426B" strokeWidth="0.8" />
          {/* Silver clip */}
          <path d="M 325 185 L 327 205 L 325 207" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* PEN 2 (Black marker / stylus) */}
        <g id="pen-black">
          <path d="M 312 188 L 318 186 L 314 265 L 308 265 Z" fill="#1A202C" />
          {/* Gold band */}
          <line x1="310" y1="210" x2="317" y2="208" stroke="#FFB800" strokeWidth="1.5" />
        </g>

        {/* Ceramic Cup Body */}
        <rect x="295" y="240" width="70" height="85" rx="12" fill="url(#cup-grad)" stroke="#EFE5CD" strokeWidth="1" />
        {/* Cup fluted vertical ribs */}
        <line x1="310" y1="248" x2="310" y2="318" stroke="#D3C7AC" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="325" y1="248" x2="325" y2="318" stroke="#D3C7AC" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="340" y1="248" x2="340" y2="318" stroke="#D3C7AC" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="355" y1="248" x2="355" y2="318" stroke="#D3C7AC" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        {/* Cup Rim highlight */}
        <ellipse cx="330" cy="242" rx="34" ry="6" fill="#FDFBF7" stroke="#E6DAC0" strokeWidth="1" />
      </g>

      {/* CLOSED LAPTOP EDGE (Bottom foreground) */}
      <g id="laptop-edge">
        {/* Laptop shadow */}
        <path d="M 160 365 L 530 365 L 510 376 L 190 376 Z" fill="#010408" fillOpacity="0.75" />
        {/* Metallic base wedge */}
        <path d="M 180 348 L 520 348 L 512 368 L 195 368 Z" fill="url(#laptop-lid)" stroke="#4A5568" strokeWidth="0.8" />
        {/* Hinge recess line */}
        <line x1="210" y1="352" x2="490" y2="352" stroke="#718096" strokeWidth="1" opacity="0.7" />
        {/* Sleek edge reflection */}
        <line x1="185" y1="349" x2="515" y2="349" stroke="#E2E8F0" strokeWidth="0.8" opacity="0.4" />
      </g>
    </svg>
  );
}

/**
 * Shared AuthScene component powering both /student/login and /admin/login.
 * Faithfully matches /reference/student-login.png at 1536px canvas without photos:
 * - Layered navy gradients
 * - Soft warm bokeh circles (radial gradients, zero blur filters)
 * - Inline-SVG still life bottom-left
 * - Frosted-glass card on right
 */
export default function AuthScene({
  role = "student",
  action,
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [showPassword, setShowPassword] = useState(false);

  const isStudent = role === "student";

  const whatsappPhone =
    SITE_CONFIG?.contact?.whatsapp?.replace(/\D/g, "") || "919999999999";
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    isStudent
      ? "Hello RD Classes, I am a student and need assistance with my account."
      : "Hello RD Classes admin support."
  )}`;

  return (
    <div
      className="relative min-h-[100svh] w-full flex flex-col justify-between overflow-x-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 18% 28%, rgba(255, 184, 0, 0.08) 0%, transparent 42%), radial-gradient(circle at 35% 75%, rgba(255, 194, 26, 0.06) 0%, transparent 48%), radial-gradient(circle at 75% 45%, rgba(28, 52, 92, 0.45) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(255, 214, 102, 0.07) 0%, transparent 35%), linear-gradient(135deg, #050B14 0%, #0A1628 40%, #0D1E36 75%, #08111F 100%)",
      }}
    >
      {/* Dark theme autofill styles */}
      <style jsx global>{`
        .auth-scene-input:-webkit-autofill,
        .auth-scene-input:-webkit-autofill:hover,
        .auth-scene-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #0b1524 inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
        @media (min-width: 1024px) {
          .auth-frosted-card {
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            background: rgba(14, 27, 49, 0.72) !important;
          }
        }
        @media (max-width: 1023px) {
          .auth-frosted-card {
            background: #0e1b31 !important;
          }
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-12 lg:px-16 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-xl"
        >
          <div className="relative h-11 w-32 sm:h-12 sm:w-36">
            <Image
              src="/images/logo-rd-light.png"
              alt="RD Classes"
              fill
              priority
              className="object-contain object-left transition-transform group-hover:scale-[1.02]"
            />
          </div>
        </Link>

        {isStudent && (
          <Link
            href="/courses"
            className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Explore Courses →
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
        <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Typography & Scene */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 sm:space-y-8">
            <div className="space-y-4 pt-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.08]">
                {isStudent ? (
                  <>
                    Learn. Practice.<br />
                    Score <span className="text-[#FFB800]">Higher.</span>
                  </>
                ) : (
                  <>
                    Manage. Teach.<br />
                    <span className="text-[#FFB800]">Grow.</span>
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-[480px] leading-relaxed font-medium">
                {isStudent
                  ? "Access your lectures, notes, practice questions and track your progress — all in one place."
                  : "Sign in to the management console to supervise courses, students, and curriculum delivery."}
              </p>
            </div>

            {/* Bottom Still Life Illustration */}
            <div className="relative w-full max-w-[460px] pt-4 hidden sm:block">
              <StillLifeIllustration className="w-full h-auto drop-shadow-2xl" />
            </div>
          </div>

          {/* Right Column: Frosted Glass Login Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="auth-frosted-card w-full max-w-[560px] rounded-[32px] p-6 sm:p-10 lg:p-12 border border-white/12 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55)]">
              {/* Card Title & Sub */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {isStudent ? "Student Login" : "Admin Login"}
                </h2>
                <p className="mt-2 text-sm text-slate-300 font-medium">
                  {isStudent
                    ? "Access your learning dashboard."
                    : "Sign in to the management console."}
                </p>
              </div>

              {/* Error Message */}
              {state?.error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-5 flex items-start gap-3 rounded-2xl bg-red-950/60 p-4 border border-red-500/40 text-xs sm:text-sm text-red-200"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Login Form */}
              <form action={formAction} className="space-y-5">
                {/* Field 1: Login ID */}
                <div>
                  <label
                    htmlFor="auth-loginId"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                  >
                    {isStudent ? "Login ID" : "Admin ID"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      id="auth-loginId"
                      name="loginId"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder={
                        isStudent
                          ? "Login ID given by RD Classes"
                          : "Enter admin login ID"
                      }
                      disabled={isPending}
                      className="auth-scene-input w-full min-h-[50px] rounded-2xl border border-white/12 bg-[#0B1524] py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#FFB800] focus:outline-none focus:ring-2 focus:ring-[#FFB800]/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      disabled={isPending}
                      className="auth-scene-input w-full min-h-[50px] rounded-2xl border border-white/12 bg-[#0B1524] py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-[#FFB800] focus:outline-none focus:ring-2 focus:ring-[#FFB800]/30 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-4 flex w-full min-h-[56px] sm:min-h-[60px] items-center justify-center gap-2 rounded-[30px] bg-gradient-to-r from-[#FFB800] via-[#FFA800] to-[#FF9500] py-3.5 px-6 font-extrabold text-[#0A0A0A] text-base shadow-[0_6px_24px_rgba(255,184,0,0.35)] hover:shadow-[0_8px_30px_rgba(255,184,0,0.5)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-neutral-950" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <span>{isStudent ? "Login →" : "Sign In →"}</span>
                  )}
                </button>
              </form>

              {/* Card Footer Helper & Device Lock Note */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
                {isStudent ? (
                  <>
                    <p className="text-xs text-slate-300">
                      Don&apos;t have an account?{" "}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#FFB800] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-sm"
                      >
                        Contact your institute.
                      </a>
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Your account works on one approved device</span>
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Restricted to authorised faculty only</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-20 w-full py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} RD Classes. All rights reserved.
      </footer>
    </div>
  );
}
