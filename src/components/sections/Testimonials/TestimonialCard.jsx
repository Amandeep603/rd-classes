"use client";

import React from "react";
import { Star } from "lucide-react";

/**
 * 3 Cycle Themes:
 * 1. Light blue (#EAF4FD, blue avatar)
 * 2. Navy (#0B2A4A, white text, teal avatar)
 * 3. Soft cream-yellow (#FFF3D1, amber avatar)
 */
const THEMES = [
  {
    bg: "#EAF4FD",
    border: "#D7E9FB",
    quoteBadgeBg: "#D4E8FA",
    quoteGlyph: "#0284C7",
    textColor: "#0F2844",
    dividerColor: "rgba(15, 40, 68, 0.12)",
    avatarBg: "#BCE0FD",
    avatarText: "#0B2A4A",
    nameColor: "#0B1B3B",
    metaColor: "#596F85",
  },
  {
    bg: "#0B2A4A",
    border: "rgba(255, 255, 255, 0.12)",
    quoteBadgeBg: "#123C66",
    quoteGlyph: "#38BDF8",
    textColor: "#F1F5F9",
    dividerColor: "rgba(255, 255, 255, 0.14)",
    avatarBg: "#0D7A94",
    avatarText: "#FFFFFF",
    nameColor: "#FFFFFF",
    metaColor: "#94A3B8",
  },
  {
    bg: "#FFF3D1",
    border: "#FEE59D",
    quoteBadgeBg: "#FFE7A3",
    quoteGlyph: "#D97706",
    textColor: "#2E2405",
    dividerColor: "rgba(46, 36, 5, 0.12)",
    avatarBg: "#FCD34D",
    avatarText: "#451A03",
    nameColor: "#291D02",
    metaColor: "#796C4A",
  },
];

function getInitial(name, explicitInitial) {
  if (explicitInitial) return explicitInitial;
  if (!name) return "R";
  const cleaned = name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/i, "").trim();
  return (cleaned.charAt(0) || name.charAt(0)).toUpperCase();
}

/**
 * TestimonialCard Component
 * - Padding: 22px
 * - Radius: 20px
 * - Equal card heights with quote clamped to 6 lines
 * - Quote: 15px (14px mobile), line-height: 1.6
 * - Name: 15px semibold, Meta: 13px muted
 * - Stars: 14px, Avatar: 44px
 * - Subtle hover lift of 4px
 */
export default function TestimonialCard({ item, index = 0, isVisible = true }) {
  const theme = THEMES[index % THEMES.length];
  const initial = getInitial(item.name, item.initial);
  const rating = item.rating || 5;

  return (
    <article
      data-testimonial-card="true"
      className="relative flex flex-col justify-between w-full h-full rounded-[20px] p-[22px] select-none transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.12)] group opacity-100"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        transitionDelay: `${Math.min(index * 80, 400)}ms`,
      }}
    >
      {/* Top Row: Quote Badge (left) & 5 Stars (right, 13px) */}
      <div className="flex items-center justify-between w-full mb-3.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
          style={{ backgroundColor: theme.quoteBadgeBg }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" style={{ color: theme.quoteGlyph }}>
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
        </div>

        {/* 5 Stars: 13px */}
        <div role="img" className="flex items-center gap-0.5 shrink-0" aria-label={`${rating} out of 5 stars`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-[13px] h-[13px] ${
                i < rating ? "fill-[#FFB800] text-[#FFB800]" : "fill-transparent text-[#CBD5E1]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quote Text: 14.5px, line-height 1.6, full review text with NO truncation */}
      <blockquote className="flex-1 my-1">
        <p
          className="text-[14.5px] font-normal leading-[1.6] text-pretty"
          style={{ color: theme.textColor }}
        >
          &ldquo;{item.quote}&rdquo;
        </p>
      </blockquote>

      {/* Bottom Area: Divider + Author Row pinned at bottom */}
      <div className="mt-auto pt-3">
        <div className="w-full h-[1px] mb-3.5" style={{ backgroundColor: theme.dividerColor }} aria-hidden="true" />

        <div className="flex items-center gap-3">
          {/* Avatar (42px circle) */}
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-bold text-[15px] shrink-0 shadow-xs"
            style={{ backgroundColor: theme.avatarBg, color: theme.avatarText }}
            aria-hidden="true"
          >
            {initial}
          </div>

          {/* Name (15px semibold) & Meta (12.5px muted) */}
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold truncate leading-tight" style={{ color: theme.nameColor }}>
              {item.name}
            </span>
            <span className="text-[12.5px] truncate mt-0.5 leading-tight" style={{ color: theme.metaColor }}>
              {item.meta}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
