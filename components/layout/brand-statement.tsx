import React from "react";

export function BrandStatement() {
  return (
    <section
      aria-label="Kanhaiya Collection Brand Signature"
      className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[500px] flex items-center justify-center bg-[#FFFDF7] select-none px-4 sm:px-6 md:px-8"
    >
      {/* Editorial Luxury Signature Typography */}
      <div className="w-full flex items-center justify-center text-center pointer-events-none">
        <span
          className="font-serif font-normal md:font-medium text-[clamp(1.35rem,7.2vw,8.6rem)] leading-none tracking-[0.06em] sm:tracking-[0.08em] uppercase whitespace-nowrap select-none"
          style={{
            color: "#C9A45C",
            opacity: 0.15,
          }}
        >
          KANHAIYA COLLECTION
        </span>
      </div>
    </section>
  );
}

