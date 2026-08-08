"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveEvent } from "@/lib/events/resolve-event";
import type { Event } from "@/types/database";

export type EventContextValue = {
  event: Event | null;
  loading: boolean;
  error: string | null;
};

export function useEventContext(): EventContextValue {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const resolved = await resolveEvent({ eventId, code });
        if (!cancelled) setEvent(resolved);
      } catch (err) {
        if (!cancelled) {
          setEvent(null);
          setError(
            err instanceof Error ? err.message : "No se pudo resolver el evento",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [eventId, code]);

  return { event, loading, error };
}
