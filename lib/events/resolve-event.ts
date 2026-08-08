import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/types/database";

export type EventLookupParams = {
  eventId?: string | null;
  code?: string | null;
};

function isLiveOperable(event: Event | null): event is Event {
  if (!event) return false;
  if (event.deleted_at || event.archived_at) return false;
  return true;
}

async function fetchEventById(id: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event by id: ${error.message}`);
  }

  return isLiveOperable(data) ? data : null;
}

async function fetchEventByCode(code: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event by code: ${error.message}`);
  }

  return isLiveOperable(data) ? data : null;
}

async function getOrCreateDemoEvent(): Promise<Event> {
  const supabase = createClient();

  const existing = await fetchEventByCode("DEMO");
  if (existing) return existing;

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: "Demo Event",
      code: "DEMO",
      is_active: true,
      album_token:
        crypto.randomUUID().replace(/-/g, "") +
        crypto.randomUUID().replace(/-/g, "").slice(0, 8),
      table_count: 30,
    })
    .select("*")
    .single();

  if (data) return data;

  // Race: another client may have created DEMO
  const retry = await fetchEventByCode("DEMO");
  if (retry) return retry;

  throw new Error(
    error?.message
      ? `Failed to create DEMO event: ${error.message}`
      : "Failed to create or recover DEMO event",
  );
}

/**
 * Resolves the active event for Paparazzi / Moderator.
 * Priority: eventId → code → NEXT_PUBLIC_DEMO_EVENT_ID → get/create DEMO.
 */
export async function resolveEvent(
  params: EventLookupParams = {},
): Promise<Event> {
  if (params.eventId?.trim()) {
    const byId = await fetchEventById(params.eventId.trim());
    if (byId) return byId;
  }

  if (params.code?.trim()) {
    const byCode = await fetchEventByCode(params.code.trim());
    if (byCode) return byCode;
  }

  const demoId = process.env.NEXT_PUBLIC_DEMO_EVENT_ID?.trim();
  if (demoId) {
    const byDemoId = await fetchEventById(demoId);
    if (byDemoId) return byDemoId;
  }

  return getOrCreateDemoEvent();
}
