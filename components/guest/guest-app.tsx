"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEventContext } from "@/hooks/useEventContext";
import { useGuestTable } from "@/hooks/useGuestTable";
import { useLiveScreenSync } from "@/hooks/useLiveScreenSync";
import { LiveSyncDrawer } from "@/components/guest/live-sync-drawer";
import { PoseBattleCard } from "@/components/guest/pose-battle-card";
import { TriviaCard } from "@/components/guest/trivia-card";
import type { PoseBattlePayload, TriviaPayload } from "@/types/database";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainer, tapSoft } from "@/lib/motion";

function isTriviaPayload(payload: unknown): payload is TriviaPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as TriviaPayload).question_id === "string" &&
    typeof (payload as TriviaPayload).started_at === "string"
  );
}

function isPosePayload(payload: unknown): payload is PoseBattlePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as PoseBattlePayload).battle_id === "string" &&
    typeof (payload as PoseBattlePayload).started_at === "string"
  );
}

export function GuestApp() {
  const reduce = useReducedMotion();
  const { event, loading: eventLoading, error: eventError } = useEventContext();
  const live = useLiveScreenSync(event?.id ?? null);
  const tableCount = event?.table_count ?? 30;
  const { tableNumber, setTableNumber, ready } = useGuestTable(tableCount);
  const [highlightTable, setHighlightTable] = useState(false);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  if (eventLoading || live.loading || !ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (eventError || !event) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] px-6 text-center text-red-200">
        <p>{eventError ?? "Evento no disponible"}</p>
      </main>
    );
  }

  const trivia =
    live.view === "TRIVIA" && isTriviaPayload(live.payload)
      ? live.payload
      : null;
  const pose =
    live.view === "POSE_BATTLE" && isPosePayload(live.payload)
      ? live.payload
      : null;

  return (
    <motion.main
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
      className="relative min-h-dvh bg-[#080706] px-5 pb-16 pt-16 text-[#f4ead7]"
    >
      <LiveSyncDrawer
        view={live.view}
        payload={live.payload}
        eventName={event.name}
        connected={live.connected}
      />

      <motion.p
        variants={fadeUp}
        className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#D4AF37]"
      >
        Invitado
      </motion.p>
      <motion.h1
        variants={fadeUp}
        className="font-display mt-2 text-4xl text-[#f8f0e3]"
      >
        {event.name}
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="mt-2 max-w-sm text-sm text-[#f4ead7]/55"
      >
        Elige tu mesa para votar en trivia y duelos. Mira la pantalla con{" "}
        <span className="text-[#D4AF37]">En vivo</span>.
      </motion.p>

      <motion.section
        variants={fadeUp}
        className={cn(
          "mt-6 border p-4",
          highlightTable
            ? "border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.25)]"
            : "border-[#D4AF37]/20",
        )}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
          Tu mesa {tableNumber != null ? `· ${tableNumber}` : ""}
        </p>
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {tables.map((n) => (
            <motion.button
              key={n}
              type="button"
              whileTap={reduce ? undefined : tapSoft}
              onClick={() => {
                setTableNumber(n);
                setHighlightTable(false);
              }}
              className={cn(
                "min-h-9 text-xs font-semibold",
                tableNumber === n
                  ? "bg-[#D4AF37] text-[#1a140c]"
                  : "border border-[#D4AF37]/20 text-[#f4ead7]/70",
              )}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {trivia ? (
        <TriviaCard
          payload={trivia}
          tableNumber={tableNumber}
          onNeedTable={() => setHighlightTable(true)}
        />
      ) : null}

      {pose ? <PoseBattleCard payload={pose} /> : null}

      <motion.div variants={fadeUp} className="mt-10 space-y-3">
        <Link
          href={
            event.code
              ? `/paparazzi?code=${encodeURIComponent(event.code)}`
              : "/paparazzi"
          }
          className="flex min-h-14 items-center justify-center border border-[#D4AF37] bg-[#D4AF37] text-sm font-semibold uppercase tracking-wider text-[#1a140c]"
        >
          Abrir Paparazzi
        </Link>
        {event.album_token ? (
          <Link
            href={`/magazine/${event.album_token}`}
            className="flex min-h-12 items-center justify-center border border-[#D4AF37]/35 text-sm font-medium text-[#D4AF37]"
          >
            Revista digital
          </Link>
        ) : (
          <p className="text-center text-xs text-[#f4ead7]/40">
            Revista no disponible (falta token del evento)
          </p>
        )}
        <Link
          href={
            event.code
              ? `/screen?code=${encodeURIComponent(event.code)}`
              : "/screen"
          }
          className="flex min-h-12 items-center justify-center border border-[#D4AF37]/25 text-sm font-medium text-[#f4ead7]/60"
        >
          Ver pantalla completa
        </Link>
      </motion.div>

      {live.error ? (
        <p className="mt-6 text-sm text-red-300">{live.error}</p>
      ) : null}
    </motion.main>
  );
}
