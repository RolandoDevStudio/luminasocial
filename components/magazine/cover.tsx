"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

type MagazineCoverProps = {
  eventName: string;
  code: string;
  photoCount: number;
  isAlbum?: boolean;
};

export function MagazineCover({
  eventName,
  code,
  photoCount,
  isAlbum = false,
}: MagazineCoverProps) {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
      className="relative overflow-hidden border-b border-[#D4AF37]/25 px-6 pb-16 pt-14 print:border-black"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 print:hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.16), transparent 55%)",
        }}
      />
      <motion.p
        variants={fadeUp}
        className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#D4AF37]"
      >
        {isAlbum
          ? "Lumina Social · Álbum del evento"
          : "Lumina Social · Revista digital"}
      </motion.p>
      <motion.h1
        variants={fadeUp}
        className="font-display mt-6 max-w-3xl text-5xl leading-[1.05] text-[#f8f0e3] sm:text-7xl print:text-black"
      >
        {eventName}
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="mt-4 text-sm uppercase tracking-[0.2em] text-[#f4ead7]/50 print:text-neutral-600"
      >
        {isAlbum ? "Álbum recuerdo" : "Edición especial"} · {code} ·{" "}
        {photoCount} momentos
      </motion.p>
    </motion.header>
  );
}
