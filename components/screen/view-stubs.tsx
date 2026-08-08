"use client";

import { cn } from "@/lib/utils";
import type { PoseBattlePayload, TriviaPayload } from "@/types/database";

type TriviaStubProps = {
  variant: "tv" | "mirror";
  payload?: TriviaPayload | null;
};

export function TriviaStub({ variant, payload }: TriviaStubProps) {
  const isTv = variant === "tv";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <p
        className={cn(
          "uppercase tracking-[0.3em] text-[#D4AF37]",
          isTv ? "text-sm" : "text-[10px]",
        )}
      >
        Trivia en vivo
      </p>
      <h2
        className={cn(
          "font-display mt-4 max-w-4xl text-[#f8f0e3]",
          isTv ? "text-5xl md:text-7xl" : "text-xl",
        )}
      >
        {payload?.question ?? "Prepárense… la pregunta llega pronto"}
      </h2>
      {payload?.options?.length ? (
        <ul
          className={cn(
            "mt-8 grid w-full max-w-3xl gap-3",
            isTv ? "grid-cols-2 text-lg" : "grid-cols-1 text-xs",
          )}
        >
          {payload.options.map((opt, i) => (
            <li
              key={`${i}-${opt}`}
              className="border border-[#D4AF37]/25 bg-[#12141a]/80 px-4 py-3 text-[#f4ead7]/85"
            >
              {opt}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type PoseBattleStubProps = {
  variant: "tv" | "mirror";
  payload?: PoseBattlePayload | null;
};

export function PoseBattleStub({ variant, payload }: PoseBattleStubProps) {
  const isTv = variant === "tv";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <p
        className={cn(
          "uppercase tracking-[0.3em] text-[#D4AF37]",
          isTv ? "text-sm" : "text-[10px]",
        )}
      >
        Pose Battle
      </p>
      <h2
        className={cn(
          "font-display mt-3 text-[#f8f0e3]",
          isTv ? "text-5xl md:text-6xl" : "text-xl",
        )}
      >
        {payload
          ? `Mesa ${payload.table_a} vs Mesa ${payload.table_b}`
          : "Duelo de poses"}
      </h2>
      {payload ? (
        <div
          className={cn(
            "mt-8 grid w-full max-w-5xl gap-4",
            isTv ? "grid-cols-2" : "grid-cols-2 gap-2",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payload.photo_a_url}
            alt={`Mesa ${payload.table_a}`}
            className="aspect-[3/4] w-full border border-[#D4AF37]/30 object-cover"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payload.photo_b_url}
            alt={`Mesa ${payload.table_b}`}
            className="aspect-[3/4] w-full border border-[#D4AF37]/30 object-cover"
          />
        </div>
      ) : (
        <p className="mt-4 text-[#f4ead7]/50">Esperando duelo activo…</p>
      )}
    </div>
  );
}
