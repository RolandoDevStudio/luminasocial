"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import { submitTriviaAnswer } from "@/lib/supabase/gamification";
import type { TriviaPayload } from "@/types/database";
import { cn } from "@/lib/utils";

type TriviaCardProps = {
  payload: TriviaPayload;
  tableNumber: number | null;
  onNeedTable: () => void;
};

export function TriviaCard({
  payload,
  tableNumber,
  onNeedTable,
}: TriviaCardProps) {
  const { remaining, expired } = useSyncedCountdown(
    payload.started_at,
    payload.duration_sec,
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `lumina.trivia.${payload.question_id}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw != null) {
        setSelected(Number(raw));
        setDone(true);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  async function choose(option: number) {
    if (done || expired || submitting) return;
    if (tableNumber == null) {
      onNeedTable();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitTriviaAnswer(
        payload.question_id,
        tableNumber,
        option,
        payload.correct_option,
      );
      setSelected(option);
      setDone(true);
      try {
        sessionStorage.setItem(storageKey, String(option));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al votar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 border border-[#D4AF37]/30 bg-[#12100e] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
            Trivia en vivo
          </p>
          <span
            className={cn(
              "font-display text-2xl",
              expired ? "text-[#f4ead7]/40" : "text-[#D4AF37]",
            )}
          >
            {expired ? "0" : remaining}s
          </span>
        </div>

        <h2 className="font-display mt-3 text-2xl text-[#f8f0e3]">
          {payload.question}
        </h2>

        <div className="mt-5 grid gap-2">
          {payload.options.map((opt, i) => {
            const active = selected === i;
            return (
              <button
                key={`${i}-${opt}`}
                type="button"
                disabled={done || expired || submitting}
                onClick={() => void choose(i)}
                className={cn(
                  "min-h-14 border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.99]",
                  active
                    ? "border-[#D4AF37] bg-[#D4AF37] text-[#1a140c]"
                    : "border-[#D4AF37]/25 bg-[#0c0b0a] text-[#f4ead7]",
                  (done || expired) && !active && "opacity-40",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {done ? (
          <p className="mt-3 text-xs text-[#D4AF37]">
            Respuesta enviada. Espera el revelado en pantalla.
          </p>
        ) : null}
        {expired && !done ? (
          <p className="mt-3 text-xs text-[#f4ead7]/45">Tiempo agotado.</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      </motion.section>
    </AnimatePresence>
  );
}
