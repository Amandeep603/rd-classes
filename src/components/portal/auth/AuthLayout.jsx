"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Shared AuthLayout Component
 * Rebuilt to match reference design with full-bleed background image,
 * exact percentage-based desktop positions, translucent glass card, and no vertical scroll.
 */
export default function AuthLayout({
  role = "student",
  adminPill = false,
  cardTitle = "Student Login",
  cardSubtitle = "Access your learning dashboard.",
  topRightLink = { label: "Explore Courses →", href: "/courses" },
  headlineParts = {
    line1: "Learn.",
    line2: "Practice.",
    prefix: "Score ",
    highlight: "Higher.",
  },
  paragraph = "Access your lectures, notes, practice questions and track your progress, all in one place.",
  children,
}) {
  return (
    <div className="auth-viewport-wrapper">
      {/* 1. Dark Navy Gradient Overlay */}
      <div className="auth-overlay" aria-hidden="true" />

      {/* 2. Top-Left Logo: left 8%, top 5%, height 56px */}
      <header className="auth-logo-header">
        <Link
          href="/"
          className="auth-logo-link group"
          aria-label="RD Classes Home"
        >
          <div className="relative h-[36px] w-[105px] sm:h-[44px] sm:w-[128px] lg:h-[56px] lg:w-[160px]">
            <Image
              src="/images/logo-rd-light.png"
              alt="RD Classes"
              fill
              priority
              className="object-contain object-left transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </div>
        </Link>
      </header>

      {/* 3. Top-Right Link: right 8%, top 5%, 16px white */}
      {topRightLink && (
        <aside className="auth-top-right">
          <Link
            href={topRightLink.href}
            className="auth-top-link"
          >
            {topRightLink.label}
          </Link>
        </aside>
      )}

      {/* 4. Left Headline Block: left 8%, top 21%, 3 lines, paragraph under */}
      <section className="auth-left-block">
        <h1 className="auth-headline">
          <span>{headlineParts.line1}</span>
          <br />
          <span>{headlineParts.line2}</span>
          <br />
          <span>
            {headlineParts.prefix ? headlineParts.prefix : ""}
            <span className="text-[#FFB800]">{headlineParts.highlight}</span>
          </span>
        </h1>

        {paragraph && (
          <p className="auth-paragraph">
            {paragraph}
          </p>
        )}
      </section>

      {/* 5. Translucent Glass Card: left 53%, width 40%, centered vertically */}
      <main className="auth-card-stage">
        <div className="auth-glass-card">
          {/* Admin pill */}
          {adminPill && (
            <div className="flex justify-center mb-2.5">
              <span className="inline-flex items-center px-3.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 shadow-xs">
                ADMIN
              </span>
            </div>
          )}

          {/* Card Header */}
          <div className="auth-card-header text-center">
            <h2 className="auth-card-title font-bold text-white leading-tight">
              {cardTitle}
            </h2>
            <p className="auth-card-subtitle text-white/80 font-normal">
              {cardSubtitle}
            </p>
          </div>

          {/* Form & Card Body */}
          {children}
        </div>
      </main>

      {/* Scoped CSS Styles */}
      <style jsx>{`
        /* Root Viewport */
        .auth-viewport-wrapper {
          position: relative;
          width: 100vw;
          min-height: 100dvh;
          background-image: url('/images/auth/background-login.webp');
          background-size: cover;
          background-repeat: no-repeat;
          box-sizing: border-box;
          color: #ffffff;
        }

        /* Autofill override */
        :global(.auth-input:-webkit-autofill),
        :global(.auth-input:-webkit-autofill:hover),
        :global(.auth-input:-webkit-autofill:focus) {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(11, 21, 36, 0.95) inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        /* Glass Card Foundation */
        .auth-glass-card {
          width: 100%;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(22px) saturate(140%);
          -webkit-backdrop-filter: blur(22px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          border-radius: 36px;
          box-sizing: border-box;
        }

        /* DESKTOP (1024px and up): Absolute exact percentage positions, 100dvh, NO SCROLL */
        @media (min-width: 1024px) {
          .auth-viewport-wrapper {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
            background-position: left bottom;
          }

          .auth-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(6, 16, 36, 0.55) 0%, rgba(6, 16, 36, 0.15) 60%, rgba(6, 16, 36, 0.25) 100%);
            pointer-events: none;
            z-index: 1;
          }

          .auth-logo-header {
            position: absolute;
            left: 8%;
            top: 5%;
            height: 56px;
            z-index: 20;
          }

          .auth-top-right {
            position: absolute;
            right: 8%;
            top: 5%;
            z-index: 20;
          }

          .auth-top-link {
            font-size: 16px;
            font-weight: 500;
            color: #ffffff;
            text-decoration: none;
            transition: color 0.2s ease, opacity 0.2s ease;
            opacity: 0.95;
          }
          .auth-top-link:hover {
            opacity: 1;
            text-decoration: underline;
          }

          .auth-left-block {
            position: absolute;
            left: 8%;
            top: 21%;
            max-width: 440px;
            z-index: 10;
            pointer-events: none;
          }

          .auth-headline {
            font-size: clamp(40px, 4.3vw, 68px);
            line-height: 1.02;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin: 0;
          }

          .auth-paragraph {
            margin-top: 20px;
            font-size: clamp(16px, 1.35vw, 21px);
            line-height: 1.45;
            color: rgba(255, 255, 255, 0.82);
            max-width: 440px;
          }

          .auth-card-stage {
            position: absolute;
            left: 53%;
            top: 50%;
            transform: translateY(-50%);
            width: 40%;
            min-width: 420px;
            max-width: 620px;
            z-index: 10;
          }

          .auth-glass-card {
            padding: clamp(28px, 4vh, 48px) clamp(28px, 3.2vw, 56px);
          }

          .auth-card-title {
            font-size: 34px;
          }

          .auth-card-subtitle {
            font-size: 17px;
            margin-top: 6px;
            margin-bottom: 28px;
          }
        }

        /* Input & Button base styles */
        :global(.auth-input) {
          height: 60px;
        }
        :global(.auth-btn-primary) {
          height: 60px;
        }
        :global(.auth-btn-google) {
          height: 60px;
        }

        /* SHORT DESKTOP SCREENS (height under 800px) */
        @media (min-width: 1024px) and (max-height: 800px) {
          .auth-logo-header {
            top: 3.5% !important;
          }
          .auth-top-right {
            top: 3.5% !important;
          }
          .auth-left-block {
            top: 17% !important;
          }
          .auth-headline {
            font-size: clamp(34px, 3.8vw, 52px) !important;
          }
          .auth-paragraph {
            font-size: 15px !important;
            margin-top: 12px !important;
          }
          .auth-card-stage {
            top: 52% !important;
          }
          .auth-glass-card {
            padding: 22px 34px !important;
            border-radius: 28px !important;
          }
          .auth-card-title {
            font-size: 28px !important;
          }
          .auth-card-subtitle {
            font-size: 14.5px !important;
            margin-bottom: 16px !important;
          }
          :global(.auth-input) {
            height: 52px !important;
          }
          :global(.auth-btn-primary) {
            height: 52px !important;
          }
          :global(.auth-btn-google) {
            height: 52px !important;
          }
          :global(.auth-form-gap) {
            gap: 12px !important;
          }
          :global(.auth-forgot-row) {
            margin: 8px 0 14px !important;
          }
          :global(.auth-divider-row) {
            margin: 12px 0 !important;
          }
        }

        /* TABLET (641px to 1023px) */
        @media (min-width: 641px) and (max-width: 1023px) {
          .auth-viewport-wrapper {
            min-height: 100dvh;
            background-position: 25% bottom;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 32px 24px;
          }

          .auth-overlay {
            position: absolute;
            inset: 0;
            background: rgba(6, 16, 36, 0.6);
            pointer-events: none;
            z-index: 1;
          }

          .auth-logo-header {
            position: relative;
            z-index: 10;
            margin-bottom: 24px;
            align-self: flex-start;
          }

          .auth-top-right {
            position: absolute;
            top: 32px;
            right: 24px;
            z-index: 10;
          }
          .auth-top-link {
            font-size: 15px;
            color: #ffffff;
            text-decoration: none;
          }

          .auth-left-block {
            position: relative;
            z-index: 10;
            text-align: center;
            margin-bottom: 28px;
            max-width: 540px;
          }

          .auth-headline {
            font-size: 38px;
            line-height: 1.15;
            font-weight: 700;
          }

          .auth-paragraph {
            font-size: 16px;
            margin-top: 10px;
            color: rgba(255, 255, 255, 0.85);
          }

          .auth-card-stage {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 520px;
          }

          .auth-glass-card {
            padding: 36px 36px;
          }

          .auth-card-title {
            font-size: 30px;
          }

          .auth-card-subtitle {
            font-size: 16px;
            margin-top: 6px;
            margin-bottom: 24px;
          }
        }

        /* MOBILE (up to 640px) */
        @media (max-width: 640px) {
          .auth-viewport-wrapper {
            min-height: 100dvh;
            background-position: 18% bottom;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: calc(env(safe-area-inset-top, 16px) + 16px) 16px calc(env(safe-area-inset-bottom, 16px) + 16px) 16px;
          }

          .auth-overlay {
            position: absolute;
            inset: 0;
            background: rgba(6, 16, 36, 0.65);
            pointer-events: none;
            z-index: 1;
          }

          .auth-logo-header {
            position: relative;
            z-index: 10;
            align-self: flex-start;
            margin-bottom: 18px;
          }

          .auth-top-right {
            position: absolute;
            top: calc(env(safe-area-inset-top, 16px) + 18px);
            right: 16px;
            z-index: 10;
          }
          .auth-top-link {
            font-size: 13.5px;
            color: #ffffff;
            text-decoration: none;
          }

          .auth-left-block {
            position: relative;
            z-index: 10;
            text-align: center;
            margin-bottom: 18px;
            width: 100%;
          }

          .auth-headline {
            font-size: 30px;
            line-height: 1.15;
            font-weight: 700;
          }

          .auth-paragraph {
            display: none;
          }

          .auth-card-stage {
            position: relative;
            z-index: 10;
            width: 100%;
          }

          .auth-glass-card {
            padding: 24px 20px;
            border-radius: 24px;
          }

          .auth-card-title {
            font-size: 26px;
          }

          .auth-card-subtitle {
            font-size: 14px;
            margin-top: 4px;
            margin-bottom: 18px;
          }
        }
      `}</style>
    </div>
  );
}
