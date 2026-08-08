"use client";

import { AnimatePresence, motion } from "framer-motion";

type ToastProps = {
  message: string | null;
  variant?: "success" | "error";
};

export function Toast({ message, variant = "success" }: ToastProps) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={message}
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 border px-4 py-3 text-center text-sm font-medium shadow-lg ${
            variant === "success"
              ? "border-[#D4AF37]/50 bg-[#1a140c] text-[#D4AF37]"
              : "border-red-400/40 bg-[#1a0c0c] text-red-200"
          }`}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
