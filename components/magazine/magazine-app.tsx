"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getApprovedPhotos,
  getClosestPoseBattle,
  getEventById,
  getMostPhotogenicTable,
  getTriviaTableLeaders,
  type TableScore,
} from "@/lib/supabase/gamification";
import type { Event, Photo, PoseBattle } from "@/types/database";
import { MagazineCover } from "@/components/magazine/cover";
import { MasonryGallery } from "@/components/magazine/masonry-gallery";
import { ShareBar } from "@/components/magazine/share-bar";
import { StatsSection } from "@/components/magazine/stats-section";

type MagazineAppProps = {
  eventId: string;
};

export function MagazineApp({ eventId }: MagazineAppProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photogenic, setPhotogenic] = useState<TableScore | null>(null);
  const [triviaLeaders, setTriviaLeaders] = useState<TableScore[]>([]);
  const [closestBattle, setClosestBattle] = useState<
    (PoseBattle & { votes_a: number; votes_b: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ev, approved, photoTable, leaders, battle] = await Promise.all([
          getEventById(eventId),
          getApprovedPhotos(eventId),
          getMostPhotogenicTable(eventId),
          getTriviaTableLeaders(eventId),
          getClosestPoseBattle(eventId),
        ]);
        if (cancelled) return;
        if (!ev) {
          setError("Evento no encontrado");
          return;
        }
        setEvent(ev);
        setPhotos(approved);
        setPhotogenic(photoTable);
        setTriviaLeaders(leaders);
        setClosestBattle(battle);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando revista");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] px-6 text-center text-red-200">
        <p>{error ?? "Revista no disponible"}</p>
      </main>
    );
  }

  return (
    <main className="magazine-root min-h-dvh bg-[#080706] text-[#f4ead7] print:bg-white print:text-black">
      <ShareBar eventName={event.name} />
      <MagazineCover
        eventName={event.name}
        code={event.code}
        photoCount={photos.length}
      />
      <StatsSection
        photogenic={photogenic}
        triviaLeaders={triviaLeaders}
        closestBattle={closestBattle}
      />
      <MasonryGallery photos={photos} />
      <footer className="px-6 py-10 text-center text-xs uppercase tracking-[0.25em] text-[#f4ead7]/35 print:text-neutral-500">
        Lumina Social
      </footer>
    </main>
  );
}
