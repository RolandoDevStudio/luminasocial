"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLiveScreenState } from "@/lib/supabase/queries";
import type { Json, ScreenViewType } from "@/types/database";

export type LiveScreenSyncState = {
  view: ScreenViewType;
  payload: Json;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
};

const IDLE: Omit<LiveScreenSyncState, "loading" | "error" | "connected"> = {
  view: "IDLE",
  payload: {},
  updatedAt: null,
};

export function useLiveScreenSync(eventId: string | null): LiveScreenSyncState {
  const [view, setView] = useState<ScreenViewType>("IDLE");
  const [payload, setPayload] = useState<Json>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  useEffect(() => {
    if (!eventId) {
      setView(IDLE.view);
      setPayload(IDLE.payload);
      setUpdatedAt(null);
      setLoading(false);
      setConnected(false);
      return;
    }

    const activeEventId = eventId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const snap = await getLiveScreenState(activeEventId);
        if (!cancelled) {
          setView(snap.current_view);
          setPayload(snap.active_payload);
          setUpdatedAt(snap.updated_at);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error cargando estado en vivo",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    const supabase = createClient();
    const channel = supabase
      .channel(`live_screen:${activeEventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_screen_state",
          filter: `event_id=eq.${activeEventId}`,
        },
        (msg) => {
          if (eventIdRef.current !== activeEventId) return;
          if (msg.eventType === "DELETE") {
            setView("IDLE");
            setPayload({});
            setUpdatedAt(null);
            return;
          }
          const row = msg.new as {
            current_view?: ScreenViewType;
            active_payload?: Json;
            updated_at?: string;
          } | null;
          if (!row) return;
          if (row.current_view) setView(row.current_view);
          if (row.active_payload !== undefined) setPayload(row.active_payload);
          if (row.updated_at) setUpdatedAt(row.updated_at);
        },
      )
      .subscribe((status) => {
        if (!cancelled) {
          setConnected(status === "SUBSCRIBED");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { view, payload, updatedAt, loading, error, connected };
}
