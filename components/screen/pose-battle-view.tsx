"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { listPoseVotes } from "@/lib/supabase/gamification";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import type { PoseBattlePayload, PoseVote } from "@/types/database";
import { cn } from "@/lib/utils";

type PoseBattleViewProps = {
  payload: PoseBattlePayload;
  variant: "tv" | "mirror";
};

export function PoseBattleView({ payload, variant }: PoseBattleViewProps) {
  const isTv = variant === "tv";
  const { remaining, expired } = useSyncedCountdown(
    payload.started_at,
    payload.duration_sec,
  );
  const [votes, setVotes] = useState<PoseVote[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listPoseVotes(payload.battle_id);
        if (!cancelled) setVotes(rows);
      } catch {
        /* ignore */
      }
    }
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`pose_votes:${payload.battle_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pose_votes",
          filter: `battle_id=eq.${payload.battle_id}`,
        },
        (msg) => {
          if (msg.new) setVotes((prev) => [...prev, msg.new as PoseVote]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [payload.battle_id]);

  const { pctA, pctB, countA, countB } = useMemo(() => {
    const countA = votes.filter((v) => v.voted_table === payload.table_a).length;
    const countB = votes.filter((v) => v.voted_table === payload.table_b).length;
    const total = countA + countB;
    if (total === 0) {
      return { pctA: 50, pctB: 50, countA, countB };
    }
    return {
      pctA: Math.round((countA / total) * 100),
      pctB: Math.round((countB / total) * 100),
      countA,
      countB,
    };
  }, [votes, payload.table_a, payload.table_b]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-4 md:px-8">
      <p
        className={cn(
          "uppercase tracking-[0.3em] text-[#D4AF37]",
          isTv ? "text-sm" : "text-[10px]",
        )}
      >
        Pose battle {expired ? "· cerrado" : `· ${remaining}s`}
      </p>
      <h2
        className={cn(
          "font-display mt-2 text-[#f8f0e3]",
          isTv ? "text-4xl md:text-6xl" : "text-xl",
        )}
      >
        Mesa {payload.table_a}{" "}
        <span className="text-[#D4AF37]">VS</span> Mesa {payload.table_b}
      </h2>

      <div
        className={cn(
          "mt-6 grid w-full max-w-6xl items-end gap-3",
          isTv ? "grid-cols-[1fr_auto_1fr] gap-6" : "grid-cols-2",
        )}
      >
        <Side
          url={payload.photo_a_url}
          table={payload.table_a}
          pct={pctA}
          count={countA}
          isTv={isTv}
        />
        {isTv ? (
          <div className="font-display pb-16 text-5xl text-[#D4AF37]">VS</div>
        ) : null}
        <Side
          url={payload.photo_b_url}
          table={payload.table_b}
          pct={pctB}
          count={countB}
          isTv={isTv}
        />
      </div>
    </div>
  );
}

function Side({
  url,
  table,
  pct,
  count,
  isTv,
}: {
  url: string;
  table: number;
  pct: number;
  count: number;
  isTv: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-full overflow-hidden border border-[#D4AF37]/30",
          isTv ? "aspect-[3/4] max-h-[55vh]" : "aspect-[3/4]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Mesa ${table}`} className="h-full w-full object-cover" />
      </div>
      <p className={cn("mt-3 text-[#f4ead7]", isTv ? "text-lg" : "text-xs")}>
        Mesa {table} · {count} votos
      </p>
      <div className="mt-2 h-3 w-full max-w-xs overflow-hidden bg-[#1a1c22]">
        <motion.div
          className="h-full bg-[#D4AF37]"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="font-display mt-1 text-[#D4AF37]">{pct}%</p>
    </div>
  );
}
