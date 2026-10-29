"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import LaurelWreath from "./LaurelWreath";
import {
  SIDE_CARD_PATH_100,
  SIDE_CARD_PATH_UNIT,
  FEATURED_CARD_PATH_100,
  FEATURED_CARD_PATH_UNIT,
  V_PANEL_PATH_100,
} from "@/constants/topperShapes";

/**
 * Animated count-up component for scores
 */
function ScoreCounter({ score, isFeatured }) {
  const [val, setVal] = useState(score);

  useEffect(() => {
    if (!isFeatured) return;
    let startTime;
    const duration = 700;
    const target = Number(score) || 0;

    let animId = requestAnimationFrame((timestamp) => {
      startTime = timestamp;
      setVal(0);
      const step = (t) => {
        const progress = Math.min((t - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(ease * target));
        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };
      animId = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(animId);
  }, [score, isFeatured]);

  return <span>{isFeatured ? val : score}</span>;
}

/**
 * TopperCard component.
 * Base size: 318u x 428u for featured, 266u x 380u for side.
 */
export default function TopperCard({ topper, isFeatured, onClick }) {
  const topperId = topper.id || topper._id;
  const isBlue = topper.tone === "blue";
  const clipId = `topper-card-clip-${topperId}`;
  const photoClipId = `topper-photo-clip-${topperId}`;
  const photo = topper.photoUrl || topper.photo || "/images/portal/avatars/default.webp";
  const score = topper.marks || topper.score || "100";

  const path100 = isFeatured ? FEATURED_CARD_PATH_100 : SIDE_CARD_PATH_100;
  const pathUnit = isFeatured ? FEATURED_CARD_PATH_UNIT : SIDE_CARD_PATH_UNIT;

  const borderColor = isFeatured ? "#FF8A1F" : isBlue ? "#1E4478" : "#7A4219";
  const borderWidth = isFeatured ? 2 : 1.5;

  return (
    <div
      onClick={onClick}
      role="group"
      data-featured={isFeatured ? "true" : "false"}
      aria-label={`${topper.name}, score ${topper.score} out of 100`}
      className="relative select-none cursor-pointer [container-type:inline-size] w-full h-full"
    >
      {/* Featured static orange radial glow behind card (measured from reference, NO blur) */}
      {isFeatured && (
        <div
          className="absolute -inset-[18%] rounded-full pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 138, 31, 0.45) 0%, rgba(242, 106, 10, 0.18) 45%, transparent 72%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* SVG Definitions for clipping and fills */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={pathUnit} />
          </clipPath>
          <clipPath id={photoClipId} clipPathUnits="objectBoundingBox">
            <path d="M 0 0 L 1 0 L 1 0.60 L 0.50 0.68 L 0 0.60 Z" />
          </clipPath>
          <linearGradient id={`grad-card-${topperId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {isBlue ? (
              <>
                <stop offset="0%" stopColor="#0F1F32" />
                <stop offset="50%" stopColor="#0B1522" />
                <stop offset="100%" stopColor="#08101C" />
              </>
            ) : isFeatured ? (
              <>
                <stop offset="0%" stopColor="#5E3311" />
                <stop offset="45%" stopColor="#4A230D" />
                <stop offset="100%" stopColor="#0A1426" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#321E14" />
                <stop offset="50%" stopColor="#271811" />
                <stop offset="100%" stopColor="#18100C" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>

      {/* Clipped Outer Shield Body Container */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
        }}
      >
        {/* Card Background SVG with crisp stroke and top corner ears */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <path
            d={path100}
            fill={`url(#grad-card-${topperId})`}
            stroke={borderColor}
            strokeWidth={borderWidth}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Golden Laurel Wreath for featured card (shoulder level up to above crown) */}
        {isFeatured && (
          <div
            className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[90%] h-[60%] z-10 pointer-events-none"
            aria-hidden="true"
          >
            <LaurelWreath />
          </div>
        )}

        {/* Student Portrait (Clipped above the V line, feathered with mask-image) */}
        <div
          className="absolute inset-x-[3%] top-[8%] h-[62%] z-15 overflow-hidden"
          style={{
            clipPath: `url(#${photoClipId})`,
            WebkitClipPath: `url(#${photoClipId})`,
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 10%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 10%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        >
          <Image
            src={photo}
            alt={topper.alt || topper.name}
            fill
            sizes="(max-width: 768px) 240px, 320px"
            className="object-cover object-top"
            priority={isFeatured}
          />
        </div>

        {/* Shallow V-Shaped Dark Bottom Panel (sides at 60%, center at 68%) */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full z-18 pointer-events-none"
          aria-hidden="true"
        >
          <path
            d={V_PANEL_PATH_100}
            fill="#0A1426"
            stroke="none"
          />
        </svg>

        {/* Score Circle (Exactly 30% of card width, centered at ~65% of H) */}
        <div
          data-score-circle="true"
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center z-25 text-white font-extrabold shadow-md"
          style={{
            top: "65%",
            width: "30cqw",
            height: "30cqw",
            background: isFeatured
              ? "linear-gradient(135deg, #FF9A2E 0%, #F26A0A 100%)"
              : isBlue
              ? "#0B1B36"
              : "#261408",
            border: isFeatured
              ? "none"
              : `3px solid ${isBlue ? "#2D5DA8" : "#E8731A"}`,
            boxShadow: isFeatured ? "0 4px 18px rgba(242,106,10,0.55)" : "none",
          }}
        >
          <span style={{ fontSize: "9.3cqw", lineHeight: 1 }}>
            <ScoreCounter score={score} isFeatured={isFeatured} />
          </span>
          <span
            style={{
              fontSize: "3.9cqw",
              lineHeight: 1,
              marginTop: "0.8cqw",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
            }}
          >
            /100
          </span>
        </div>

        {/* Name (center at 80% of H) */}
        <div
          className="absolute inset-x-2 text-center text-white font-bold truncate z-25 -translate-y-1/2"
          style={{
            top: "80%",
            fontSize: "7.4cqw",
            lineHeight: 1.2,
          }}
        >
          {topper.name}
        </div>

        {/* School (center at 87.5% of H) */}
        <div
          className="absolute inset-x-2 text-center text-[#9AA7BA] font-medium truncate z-25 -translate-y-1/2"
          style={{
            top: "87.5%",
            fontSize: "5.2cqw",
            lineHeight: 1.2,
          }}
        >
          {topper.school}
        </div>
      </div>

      {/* Year Pill:
          Side cards = INSIDE the card top (top 5.5%, 40% W x 7.5% H, bordered)
          Featured card = filled orange pill straddling the top edge by ~25% of its height
      */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold whitespace-nowrap z-30 shadow-xs"
        style={{
          top: isFeatured ? "-2.2%" : "5.5%",
          width: isFeatured ? "38cqw" : "40cqw",
          height: isFeatured ? "8.4cqw" : "7.5cqw",
          background: isFeatured
            ? "linear-gradient(90deg, #FF9A2E, #F26A0A)"
            : isBlue
            ? "rgba(45, 93, 168, 0.28)"
            : "rgba(232, 115, 26, 0.28)",
          border: isFeatured ? "none" : `1px solid ${isBlue ? "#2D5DA8" : "#E8731A"}`,
          color: isFeatured ? "#FFFFFF" : "#FFFFFF",
          fontSize: "5.2cqw",
        }}
      >
        {topper.year}
      </div>
    </div>
  );
}
