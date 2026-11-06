"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { GraduationCap, UsersRound, ChartNoAxesCombined } from "lucide-react";

function CountUpItem({ target, suffix = "", prefix = "", isNumeric = true, textValue = "", isInView, shouldReduceMotion }) {
  const [val, setVal] = useState(shouldReduceMotion || !isNumeric ? target : 0);

  useEffect(() => {
    if (shouldReduceMotion || !isNumeric || !isInView) {
      if (isNumeric) setVal(target);
      return;
    }

    let startTime = null;
    let animId;
    const duration = 1500; // 1.5s easeOut

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isInView, target, isNumeric, shouldReduceMotion]);

  if (!isNumeric) {
    return <span>{textValue}</span>;
  }

  return (
    <span>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

export default function AboutStatsCard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  const stats = [
    {
      icon: GraduationCap,
      isNumeric: true,
      target: 10,
      suffix: "+ Years",
      label: "Teaching Excellence",
    },
    {
      icon: UsersRound,
      isNumeric: true,
      target: 100,
      suffix: "/100",
      label: "Century Board Scores",
    },
    {
      icon: ChartNoAxesCombined,
      isNumeric: false,
      textValue: "Hundreds",
      label: "of Successful Students",
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto max-w-6xl rounded-3xl bg-white border border-amber-100 shadow-[0_8px_30px_rgba(11,27,58,0.06)] hover:shadow-[0_16px_40px_rgba(11,27,58,0.1)] transition-shadow duration-300 px-4 py-6 sm:py-8 lg:py-9"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/70">
        {stats.map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.5,
                delay: shouldReduceMotion ? 0 : 0.15 * idx,
                ease: "easeOut",
              }}
              className="group relative cursor-default rounded-2xl px-6 py-4 border border-transparent transition-all duration-300 hover:border-[#FFC107]/60 hover:bg-[#FFFBEB] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(255,184,0,0.18)]"
            >
              <div className="flex items-center justify-center gap-4">
                {/* Icon with spring pop-in and hover scale/rotate/glow */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { scale: 1, rotate: 0 }
                      : { scale: 0.6, rotate: -10 }
                  }
                  animate={
                    isInView
                      ? { scale: 1, rotate: 0 }
                      : shouldReduceMotion
                      ? { scale: 1, rotate: 0 }
                      : { scale: 0.6, rotate: -10 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: shouldReduceMotion ? 0 : 0.15 * idx + 0.1,
                  }}
                  className="shrink-0"
                >
                  <IconComp
                    className="h-11 w-11 text-[#FFB800] shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-[0_4px_12px_rgba(255,184,0,0.45)]"
                    strokeWidth={1.6}
                  />
                </motion.div>

                {/* Text Block */}
                <div className="text-left">
                  <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1B3A] leading-tight transition-colors duration-300 group-hover:text-[#0B1B3A]">
                    <CountUpItem
                      target={stat.target}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      isNumeric={stat.isNumeric}
                      textValue={stat.textValue}
                      isInView={isInView}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  </div>

                  {/* 3px amber underline bar grows from left (width 0 to 60%) */}
                  <span
                    className="block h-[3px] bg-[#FFC107] rounded-full w-0 group-hover:w-[60%] transition-all duration-300 mt-1"
                    aria-hidden="true"
                  />

                  <div className="text-[15px] text-slate-600 font-medium leading-tight mt-1">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

