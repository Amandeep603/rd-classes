import React from "react";

export default function Card({
  children,
  className = "",
  hoverLift = false,
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      style={{
        borderRadius: "var(--portal-card-radius, 22px)",
        boxShadow: "var(--portal-card-shadow, 0 10px 30px -18px rgba(120, 90, 20, 0.16))",
      }}
      className={`bg-white border border-black/[0.04] p-6 transition-all ${
        hoverLift ? "portal-card-lift" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
