"use client";

import { AnimatePresence, motion } from "framer-motion";

type FlashOverlayProps = {
  show: boolean;
};

export function FlashOverlay({ show }: FlashOverlayProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="flash"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, times: [0, 0.15, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );
}
