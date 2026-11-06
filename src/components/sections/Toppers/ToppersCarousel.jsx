"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import TopperCard from "./TopperCard";

export default function ToppersCarousel({
  toppers = [],
  externalPrev,
  externalNext,
  onCanScrollChange,
}) {
  const count = toppers.length;
  const isFewerThanFive = count < 5;
  const shouldLoop = count >= 6;

  // If 6+ entries and too few slides for a smooth loop with 5 visible, duplicate list internally
  const slides = useMemo(() => {
    if (shouldLoop && count < 10) {
      return [...toppers, ...toppers];
    }
    return toppers;
  }, [toppers, shouldLoop, count]);

  // Center slide as default start index
  const defaultStartIndex = isFewerThanFive
    ? Math.max(0, Math.floor(count / 2))
    : 2;

  const [selectedIndex, setSelectedIndex] = useState(defaultStartIndex);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Configure Embla carousel per specification
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      startIndex: defaultStartIndex,
      align: "center",
      loop: shouldLoop,
      skipSnaps: false,
      containScroll: false,
      duration: 25,
    },
    shouldLoop
      ? [
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]
      : []
  );

  const scrollPrev = useCallback(() => {
    if (isFewerThanFive) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
    } else if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [isFewerThanFive, emblaApi, count]);

  const scrollNext = useCallback(() => {
    if (isFewerThanFive) {
      setSelectedIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
    } else if (emblaApi) {
      emblaApi.scrollNext();
    }
  }, [isFewerThanFive, emblaApi, count]);

  const onSelect = useCallback(() => {
    if (!emblaApi || isFewerThanFive) return;
    const snap = emblaApi.selectedScrollSnap();
    setSelectedIndex(snap);
    const prevOk = emblaApi.canScrollPrev();
    const nextOk = emblaApi.canScrollNext();
    setCanScrollPrev(prevOk);
    setCanScrollNext(nextOk);
    onCanScrollChange?.({ canScrollPrev: prevOk, canScrollNext: nextOk });
  }, [emblaApi, isFewerThanFive, onCanScrollChange]);

  useEffect(() => {
    if (!emblaApi || isFewerThanFive) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, isFewerThanFive, onSelect]);

  // Hook external controller buttons
  useEffect(() => {
    if (externalPrev) externalPrev.current = scrollPrev;
    if (externalNext) externalNext.current = scrollNext;
  }, [externalPrev, externalNext, scrollPrev, scrollNext]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  // Layout for fewer than 5 entries: centered without loop or empty bars
  if (isFewerThanFive) {
    return (
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full relative focus:outline-none"
        aria-label="Board Toppers"
        role="region"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 py-8 overflow-visible">
          {toppers.map((topper, index) => {
            const isFeatured = index === selectedIndex;
            return (
              <div
                key={topper._id || topper.id || index}
                className="w-[245px] flex justify-center transition-transform duration-500"
              >
                <TopperCard
                  topper={topper}
                  isFeatured={isFeatured}
                  onClick={() => setSelectedIndex(index)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Layout for 5+ entries: 5 cards visible on desktop, 3 on tablet, 1.3 on mobile
  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full relative focus:outline-none"
      aria-label="Board Toppers Carousel"
      role="region"
    >
      <div className="overflow-hidden py-10" ref={emblaRef}>
        <div className="flex touch-pan-y items-center">
          {slides.map((topper, index) => {
            const isFeatured = index === selectedIndex;
            return (
              <div
                key={`${topper._id || topper.id || index}-${index}`}
                className="shrink-0 basis-[78%] md:basis-1/3 lg:basis-1/5 px-2 flex justify-center items-center transition-transform duration-500"
              >
                <TopperCard
                  topper={topper}
                  isFeatured={isFeatured}
                  onClick={() => emblaApi && emblaApi.scrollTo(index)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
