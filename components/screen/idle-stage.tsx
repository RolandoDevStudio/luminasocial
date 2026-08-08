"use client";

import { cn } from "@/lib/utils";

type IdleStageProps = {
  variant: "tv" | "mirror";
  eventName?: string;
};

export function IdleStage({ variant, eventName }: IdleStageProps) {
  const isTv = variant === "tv";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(212,175,55,0.14), transparent 60%)",
        }}
      />
      <p
        className={cn(
          "uppercase tracking-[0.35em] text-[#D4AF37]",
          isTv ? "text-sm md:text-base" : "text-[10px]",
        )}
      >
        Lumina Social
      </p>
      <h2
        className={cn(
          "font-display mt-4 text-center text-[#f8f0e3]",
          isTv ? "text-6xl md:text-8xl" : "text-2xl",
        )}
      >
        {eventName ?? "En espera"}
      </h2>
      <p
        className={cn(
          "mt-4 max-w-xl text-center text-[#f4ead7]/55",
          isTv ? "text-lg md:text-xl" : "text-xs px-4",
        )}
      >
        La próxima revelación aparecerá aquí al instante.
      </p>
    </div>
  );
}
