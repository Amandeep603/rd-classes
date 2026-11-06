import React from "react";
import Image from "next/image";

/**
 * IMAGE FIT RULE for student photos (Results + Home toppers):
 * Render inside a fixed aspect-ratio frame using object-contain, centered.
 * Behind it, put a blurred, low-opacity (about 35%) scaled copy of the SAME photo
 * (object-cover, blur-2xl, scale-110) so no empty bars show for portrait or landscape uploads.
 * No other background decoration, no laurels, no cut-outs.
 */
export default function StudentPhoto({
  src,
  alt = "Student photo",
  aspectRatio = "aspect-[4/5]",
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 360px",
}) {
  if (!src) return null;

  return (
    <div
      className={`relative overflow-hidden w-full ${aspectRatio} ${className} bg-slate-900/40 select-none`}
    >
      {/* Blurred, low-opacity (35%) scaled copy of the same photo */}
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        aria-hidden="true"
        className="object-cover blur-2xl scale-110 opacity-35 select-none pointer-events-none"
      />
      {/* Crisp foreground photo: object-contain, centered */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain object-center z-10"
      />
    </div>
  );
}
