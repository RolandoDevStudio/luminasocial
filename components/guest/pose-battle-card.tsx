"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import { submitPoseVote } from "@/lib/supabase/gamification";
import type { PoseBattlePayload } from "@/types/database";
import { cn } from "@/lib/utils";

type PoseBattleCardProps = {
  payload: PoseBattlePayload;
};

export function PoseBattleCard({ payload }: PoseBattleCardProps) {
  const { remaining, expired } = useSyncedCountdown(
    payload.started_at,
    payload.duration_sec,
  );
  const [voted, setVoted] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `lumina.pose.${payload.battle_id}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw != null) setVoted(Number(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  async function vote(table: number) {
    if (voted != null || expired || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPoseVote(payload.battle_id, table);
      setVoted(table);
      try {
        sessionStorage.setItem(storageKey, String(table));
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
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 border border-[#D4AF37]/30 bg-[#12100e] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
          Pose battle
        </p>
        <span className="font-display text-2xl text-[#D4AF37]">
          {expired ? "0" : remaining}s
        </span>
      </div>
      <h2 className="font-display mt-2 text-xl text-[#f8f0e3]">
        Mesa {payload.table_a} vs Mesa {payload.table_b}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            [payload.table_a, payload.photo_a_url],
            [payload.table_b, payload.photo_b_url],
          ] as const
        ).map(([table, url]) => (
          <button
            key={table}
            type="button"
            disabled={voted != null || expired || submitting}
            onClick={() => void vote(table)}
            className={cn(
              "overflow-hidden border",
              voted === table
                ? "border-[#D4AF37]"
                : "border-[#D4AF37]/20 opacity-90",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Mesa ${table}`}
              className="aspect-[3/4] w-full object-cover"
            />
            <span className="block bg-black/50 py-2 text-center text-xs font-semibold">
              Mesa {table}
            </span>
          </button>
        ))}
      </div>

      {voted != null ? (
        <p className="mt-3 text-xs text-[#D4AF37]">
          Voto registrado por Mesa {voted}
        </p>
      ) : null}
      {expired && voted == null ? (
        <p className="mt-3 text-xs text-[#f4ead7]/45">Votación cerrada.</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </motion.section>
  );
}
