"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

import type { Variants } from "framer-motion";

const fade: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12 * i,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function LandingHero() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#080706] text-[#f4ead7]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(196,165,116,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(120,90,50,0.12), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,234,215,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(244,234,215,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 35%, black, transparent)",
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <motion.p
          custom={0}
          initial="hidden"
          animate="show"
          variants={fade}
          className="font-display text-2xl tracking-tight text-[#f4ead7]"
        >
          Lumina Social
        </motion.p>
        <motion.div
          custom={1}
          initial="hidden"
          animate="show"
          variants={fade}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#c4a574]"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Supabase ready
        </motion.div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-10">
        <motion.p
          custom={1}
          initial="hidden"
          animate="show"
          variants={fade}
          className="text-xs font-medium uppercase tracking-[0.28em] text-[#c4a574]"
        >
          Experiencias interactivas
        </motion.p>

        <motion.h1
          custom={2}
          initial="hidden"
          animate="show"
          variants={fade}
          className="font-display mt-5 max-w-3xl text-5xl leading-[1.05] tracking-tight text-[#f8f0e3] sm:text-7xl"
        >
          El entorno está limpio y listo para brillar.
        </motion.h1>

        <motion.p
          custom={3}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-6 max-w-lg text-base leading-relaxed text-[#f4ead7]/65 sm:text-lg"
        >
          Next.js 15, Tailwind y clientes Supabase configurados. Continúa hacia
          la experiencia de invitados o la pantalla en vivo.
        </motion.p>

        <motion.div
          custom={4}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/paparazzi"
            className="group inline-flex items-center gap-2 border border-[#D4AF37] bg-[#D4AF37] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#1a140c] transition hover:bg-[#e0c15a]"
          >
            Modo Paparazzi
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/moderator"
            className="inline-flex items-center border border-[#D4AF37]/40 px-6 py-3.5 text-sm font-medium tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37] hover:text-[#f4ead7]"
          >
            Moderador
          </Link>
          <Link
            href="/screen"
            className="inline-flex items-center border border-[#c4a574]/40 px-6 py-3.5 text-sm font-medium tracking-wide text-[#c4a574] transition hover:border-[#c4a574] hover:text-[#f4ead7]"
          >
            Ver pantalla
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center border border-[#D4AF37]/40 px-6 py-3.5 text-sm font-medium tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37] hover:text-[#f4ead7]"
          >
            Admin
          </Link>
          <Link
            href="/guest"
            className="inline-flex items-center border border-[#c4a574]/40 px-6 py-3.5 text-sm font-medium tracking-wide text-[#c4a574] transition hover:border-[#c4a574] hover:text-[#f4ead7]"
          >
            Invitado
          </Link>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="show"
          variants={fade}
          className="mt-16 h-px w-full max-w-md bg-gradient-to-r from-[#c4a574]/70 via-[#c4a574]/25 to-transparent"
        />
      </section>
    </main>
  );
}
