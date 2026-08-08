"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEventPhotos } from "@/lib/supabase/queries";
import type { Photo } from "@/types/database";

export function usePhotosRealtime(eventId: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  const upsertPhoto = useCallback((photo: Photo) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photo.id);
      if (idx === -1) return [...prev, photo];
      const next = [...prev];
      next[idx] = photo;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!eventId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const activeEventId = eventId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await getEventPhotos(activeEventId);
        if (!cancelled) setPhotos(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error cargando fotos",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`photos:${activeEventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${activeEventId}`,
        },
        (payload) => {
          if (eventIdRef.current !== activeEventId) return;

          if (payload.eventType === "INSERT" && payload.new) {
            upsertPhoto(payload.new as Photo);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            upsertPhoto(payload.new as Photo);
          } else if (payload.eventType === "DELETE" && payload.old) {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) {
              setPhotos((prev) => prev.filter((p) => p.id !== oldId));
            }
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [eventId, upsertPhoto]);

  return { photos, setPhotos, loading, error, upsertPhoto };
}
