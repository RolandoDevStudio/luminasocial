"use client";

import type { Transition, Variants } from "framer-motion";

export const easeOutSoft: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: easeOutSoft },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: easeOutSoft },
};

export const tapSoft = { scale: 0.98 };
export const hoverLift = { y: -2 };
