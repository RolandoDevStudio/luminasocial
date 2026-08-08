"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TableScore } from "@/lib/supabase/gamification";
import type { PoseBattle } from "@/types/database";
import { fadeUp, staggerContainer } from "@/lib/motion";

type StatsSectionProps = {
  photogenic: TableScore | null;
  triviaLeaders: TableScore[];
  closestBattle: (PoseBattle & { votes_a: number; votes_b: number }) | null;
};

export function StatsSection({
  photogenic,
  triviaLeaders,
  closestBattle,
}: StatsSectionProps) {
  const reduce = useReducedMotion();

  return (
    <section className="border-y border-[#D4AF37]/20 px-6 py-12 print:border-neutral-300">
      <motion.h2
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={fadeUp}
        className="font-display text-3xl text-[#f8f0e3] print:text-black"
      >
        Estadísticas de la gala
      </motion.h2>
      <motion.div
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={staggerContainer}
        className="mt-8 grid gap-6 md:grid-cols-3"
      >
        <StatCard
          label="Mesa más fotogénica"
          value={
            photogenic ? `Mesa ${photogenic.table_number}` : "Sin datos"
          }
          detail={
            photogenic ? `${photogenic.score} fotos aprobadas` : undefined
          }
        />
        <StatCard
          label="Campeones de la Trivia"
          value={
            triviaLeaders[0]
              ? `Mesa ${triviaLeaders[0].table_number}`
              : "Sin datos"
          }
          detail={
            triviaLeaders[0]
              ? `${triviaLeaders[0].score} aciertos`
              : undefined
          }
        />
        <StatCard
          label="Duelo más reñido"
          value={
            closestBattle
              ? `${closestBattle.table_a} vs ${closestBattle.table_b}`
              : "Sin datos"
          }
          detail={
            closestBattle
              ? `${closestBattle.votes_a}–${closestBattle.votes_b} votos`
              : undefined
          }
        />
      </motion.div>
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <motion.article
      variants={fadeUp}
      className="border border-[#D4AF37]/15 bg-[#12100e] p-5 print:border-neutral-300 print:bg-white"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] print:text-neutral-600">
        {label}
      </p>
      <p className="font-display mt-3 text-2xl text-[#f8f0e3] print:text-black">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-[#f4ead7]/45 print:text-neutral-500">
          {detail}
        </p>
      ) : null}
    </motion.article>
  );
}
