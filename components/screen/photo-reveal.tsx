"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { PhotoPayload } from "@/types/database";

type PhotoRevealProps = {
  payload: PhotoPayload;
  variant: "tv" | "mirror";
  revealKey: string;
};

export function PhotoReveal({ payload, variant, revealKey }: PhotoRevealProps) {
  const isTv = variant === "tv";
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 520);
    return () => window.clearTimeout(t);
  }, [revealKey]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <AnimatePresence>
        {flash ? (
          <motion.div
            key={`flash-${revealKey}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.12, 1] }}
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        key={revealKey}
        className={cn(
          "relative z-10 overflow-hidden border border-[#D4AF37]/35 shadow-[0_0_80px_rgba(212,175,55,0.18)]",
          isTv ? "h-[78%] max-h-[820px] w-[min(72vw,920px)]" : "h-[70%] w-[88%]",
        )}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={payload.photo_url}
          alt={`Mesa ${payload.table_number}`}
          className="h-full w-full object-cover"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className={cn(
            "absolute bottom-4 left-4 border border-[#D4AF37]/50 bg-black/55 backdrop-blur-sm",
            isTv ? "px-5 py-3" : "px-3 py-2",
          )}
        >
          <p
            className={cn(
              "font-medium uppercase tracking-[0.2em] text-[#D4AF37]",
              isTv ? "text-xs" : "text-[9px]",
            )}
          >
            Capturado en Mesa {payload.table_number}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
