"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getApprovedPhotos,
  getClosestPoseBattle,
  getMostPhotogenicTable,
  getTriviaTableLeaders,
  type TableScore,
} from "@/lib/supabase/gamification";
import type { Event, Photo, PoseBattle } from "@/types/database";
import { MagazineCover } from "@/components/magazine/cover";
import { MasonryGallery } from "@/components/magazine/masonry-gallery";
import { ShareBar } from "@/components/magazine/share-bar";
import { StatsSection } from "@/components/magazine/stats-section";
import { AlbumExpiryBanner } from "@/components/magazine/album-expiry-banner";

type MagazineAppProps = {
  event: Event;
  isAlbum: boolean;
};

export function MagazineApp({ event, isAlbum }: MagazineAppProps) {
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
        const [approved, photoTable, leaders, battle] = await Promise.all([
          getApprovedPhotos(event.id),
          getMostPhotogenicTable(event.id),
          getTriviaTableLeaders(event.id),
          getClosestPoseBattle(event.id),
        ]);
        if (cancelled) return;
        setPhotos(approved);
        setPhotogenic(photoTable);
        setTriviaLeaders(leaders);
        setClosestBattle(battle);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando álbum");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] px-6 text-center text-red-200">
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="magazine-root min-h-dvh bg-[#080706] text-[#f4ead7] print:bg-white print:text-black">
      {isAlbum && event.album_expires_at ? (
        <AlbumExpiryBanner expiresAt={event.album_expires_at} />
      ) : null}
      <ShareBar
        eventName={event.name}
        showDownload={isAlbum}
        event={event}
        photos={photos}
        photogenic={photogenic}
        triviaLeaders={triviaLeaders}
        closestBattle={closestBattle}
      />
      <MagazineCover
        eventName={event.name}
        code={event.code}
        photoCount={photos.length}
        isAlbum={isAlbum}
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
