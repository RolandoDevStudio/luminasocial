"use client";

import { Loader2 } from "lucide-react";
import { useEventContext } from "@/hooks/useEventContext";
import { useLiveScreenSync } from "@/hooks/useLiveScreenSync";
import { LiveDisplayView } from "@/components/screen/live-display-view";
import { NewsTicker } from "@/components/screen/news-ticker";

export function GiantScreen() {
  const { event, loading: eventLoading, error: eventError } = useEventContext();
  const live = useLiveScreenSync(event?.id ?? null);

  if (eventLoading || live.loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0B0C10] text-[#D4AF37]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </main>
    );
  }

  if (eventError || !event) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0B0C10] px-6 text-center text-red-200">
        <p>{eventError ?? "Evento no disponible"}</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0B0C10] text-[#f4ead7]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(80,60,20,0.2), transparent 50%)",
        }}
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-8 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
            Pantalla gigante
          </p>
          <h1 className="font-display mt-2 text-3xl text-[#f8f0e3] md:text-4xl">
            {event.name}
          </h1>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.22em] text-[#f4ead7]/40">
          <p>{live.connected ? "Realtime · conectado" : "Realtime · reconectando"}</p>
          <p className="mt-1 text-[#D4AF37]/80">{live.view}</p>
        </div>
      </header>

      <div className="absolute inset-0 pb-16 pt-24">
        <LiveDisplayView
          view={live.view}
          payload={live.payload}
          variant="tv"
          eventName={event.name}
        />
      </div>

      <NewsTicker />

      {live.error ? (
        <p className="absolute left-6 top-24 z-30 text-sm text-red-300">
          {live.error}
        </p>
      ) : null}
    </main>
  );
}
