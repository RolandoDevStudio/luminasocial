"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  buildTriviaPodium,
  listTriviaAnswers,
} from "@/lib/supabase/gamification";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import type { TriviaAnswer, TriviaPayload } from "@/types/database";
import { cn } from "@/lib/utils";

type LiveTriviaViewProps = {
  payload: TriviaPayload;
  variant: "tv" | "mirror";
};

function ConfettiBurst({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: (i % 7) * 0.05,
        color: i % 2 === 0 ? "#D4AF37" : "#f4ead7",
      })),
    [],
  );

  return (
    <AnimatePresence>
      {show ? (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute top-0 h-2 w-2 rounded-sm"
              style={{ left: p.left, background: p.color }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: 0.2, rotate: 240 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, delay: p.delay, ease: "easeIn" }}
            />
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function LiveTriviaView({ payload, variant }: LiveTriviaViewProps) {
  const isTv = variant === "tv";
  const { remaining, progress, expired } = useSyncedCountdown(
    payload.started_at,
    payload.duration_sec,
  );
  const [answers, setAnswers] = useState<TriviaAnswer[]>([]);
  const podium = useMemo(() => buildTriviaPodium(answers).slice(0, 5), [answers]);
  const maxScore = podium[0]?.correct ?? 1;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listTriviaAnswers(payload.question_id);
        if (!cancelled) setAnswers(rows);
      } catch {
        /* ignore */
      }
    }
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`trivia_answers:${payload.question_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trivia_answers",
          filter: `question_id=eq.${payload.question_id}`,
        },
        (msg) => {
          if (msg.new) {
            setAnswers((prev) => [...prev, msg.new as TriviaAnswer]);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [payload.question_id]);

  const radius = isTv ? 54 : 36;
  const stroke = isTv ? 6 : 4;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (1 - progress);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-6">
      <ConfettiBurst show={expired} />

      <p
        className={cn(
          "uppercase tracking-[0.3em] text-[#D4AF37]",
          isTv ? "text-sm" : "text-[10px]",
        )}
      >
        Trivia de los festejados
      </p>

      <h2
        className={cn(
          "font-display mt-4 max-w-4xl text-center text-[#f8f0e3]",
          isTv ? "text-5xl md:text-7xl" : "text-xl",
        )}
      >
        {payload.question}
      </h2>

      {!expired ? (
        <div className={cn("relative mt-8", isTv ? "h-36 w-36" : "h-24 w-24")}>
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(212,175,55,0.2)"
              strokeWidth={stroke}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#D4AF37"
              strokeWidth={stroke}
              strokeDasharray={circ}
              strokeDashoffset={dash}
              strokeLinecap="round"
            />
          </svg>
          <span
            className={cn(
              "font-display absolute inset-0 flex items-center justify-center text-[#D4AF37]",
              isTv ? "text-4xl" : "text-2xl",
            )}
          >
            {remaining}
          </span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-3xl"
        >
          <p
            className={cn(
              "text-center uppercase tracking-[0.25em] text-[#D4AF37]",
              isTv ? "text-xs" : "text-[9px]",
            )}
          >
            Respuesta correcta
          </p>
          <p
            className={cn(
              "font-display mt-2 text-center text-[#f8f0e3]",
              isTv ? "text-4xl" : "text-lg",
            )}
          >
            {payload.options[payload.correct_option] ?? "—"}
          </p>

          <div className="mt-8 space-y-3">
            <p
              className={cn(
                "uppercase tracking-[0.2em] text-[#f4ead7]/45",
                isTv ? "text-xs" : "text-[9px]",
              )}
            >
              Podio de mesas
            </p>
            {podium.length === 0 ? (
              <p className="text-sm text-[#f4ead7]/40">Sin aciertos aún</p>
            ) : (
              podium.map((row, i) => (
                <div key={row.table_number} className="space-y-1">
                  <div className="flex justify-between text-sm text-[#f4ead7]/80">
                    <span>
                      #{i + 1} Mesa {row.table_number}
                    </span>
                    <span className="text-[#D4AF37]">{row.correct}</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-[#1a1c22]">
                    <motion.div
                      className="h-full bg-[#D4AF37]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(row.correct / maxScore) * 100}%`,
                      }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
