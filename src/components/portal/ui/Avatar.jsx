import React from "react";

function hashColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { bg: "#FFE8A3", text: "#784D00", border: "#FCD34D" }, // Gold/Yellow
    { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" }, // Sky Blue
    { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" }, // Mint Green
    { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" }, // Coral Red
    { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" }, // Lavender Purple
    { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" }, // Warm Peach
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

export default function Avatar({
  name = "User",
  size = "md",
  className = "",
  badge = null,
  src = null,
}) {
  const sizeConfig = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base font-bold",
    xl: "w-14 h-14 text-lg font-bold",
  }[size] || "w-10 h-10 text-sm";

  // Initials (max 2 characters)
  const parts = name.trim().split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || "U").toUpperCase();

  const color = hashColor(name);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`${sizeConfig} rounded-full object-cover border border-black/5`}
        />
      ) : (
        <div
          style={{
            backgroundColor: color.bg,
            color: color.text,
            borderColor: color.border,
          }}
          className={`${sizeConfig} rounded-full border flex items-center justify-center font-extrabold select-none shadow-xs`}
        >
          {initials}
        </div>
      )}
      {badge && (
        <span className="absolute -bottom-0.5 -right-0.5">{badge}</span>
      )}
    </div>
  );
}
