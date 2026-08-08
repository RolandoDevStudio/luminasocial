import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Event } from "@/types/database";

function generateAlbumToken(): string {
  return randomBytes(16).toString("base64url");
}

export async function listEvents(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list events: ${error.message}`);
  }
  return data ?? [];
}

export async function listDeletedEventsWithAlbum(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .not("deleted_at", "is", null)
    .not("album_token", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list deleted events: ${error.message}`);
  }
  return data ?? [];
}

export async function createEvent(input: {
  name: string;
  code: string;
  is_active?: boolean;
  table_count?: number;
}): Promise<Event> {
  const supabase = await createServerClient();
  const code = input.code.trim().toUpperCase();
  const tableCount = clampTableCount(input.table_count ?? 30);

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: input.name.trim(),
      code,
      is_active: input.is_active ?? true,
      album_token: generateAlbumToken(),
      table_count: tableCount,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  await supabase.from("live_screen_state").upsert(
    {
      event_id: data.id,
      current_view: "IDLE",
      active_payload: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id" },
  );

  return data;
}

export async function updateEvent(
  id: string,
  input: Partial<Pick<Event, "name" | "code" | "is_active" | "table_count">>,
): Promise<Event> {
  const supabase = await createServerClient();
  const patch: {
    name?: string;
    code?: string;
    is_active?: boolean;
    table_count?: number;
  } = {};
  if (input.name != null) patch.name = input.name.trim();
  if (input.code != null) patch.code = input.code.trim().toUpperCase();
  if (input.is_active != null) patch.is_active = input.is_active;
  if (input.table_count != null) patch.table_count = clampTableCount(input.table_count);

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }
  return data;
}

function clampTableCount(n: number): number {
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(1, Math.round(n)));
}

export async function archiveEvent(
  id: string,
  days: number,
  options: { regenerateToken?: boolean } = {},
): Promise<{ event: Event; albumUrlPath: string }> {
  if (!Number.isFinite(days) || days < 1 || days > 3650) {
    throw new Error("Los días de vigencia deben estar entre 1 y 3650");
  }

  const supabase = await createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Evento no encontrado");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const token =
    options.regenerateToken || !existing.album_token
      ? generateAlbumToken()
      : existing.album_token;

  const { data, error } = await supabase
    .from("events")
    .update({
      is_active: false,
      archived_at: now.toISOString(),
      album_token: token,
      album_expires_at: expires.toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to archive event: ${error.message}`);
  }

  return { event: data, albumUrlPath: `/magazine/${token}` };
}

/** Ensures an existing event has a stable album_token (legacy rows). */
export async function ensureAlbumToken(id: string): Promise<Event> {
  const supabase = await createServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Evento no encontrado");
  }

  if (existing.album_token) return existing;

  const { data, error } = await supabase
    .from("events")
    .update({ album_token: generateAlbumToken() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to ensure album token: ${error.message}`);
  }
  return data;
}

export async function softDeleteEvent(
  id: string,
  albumDays = 30,
): Promise<Event> {
  const supabase = await createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Evento no encontrado");
  }

  const now = new Date();
  const patch: {
    is_active: boolean;
    deleted_at: string;
    archived_at?: string;
    album_token?: string;
    album_expires_at?: string;
  } = {
    is_active: false,
    deleted_at: now.toISOString(),
  };

  if (!existing.album_token) {
    const days = Number.isFinite(albumDays) && albumDays >= 1 ? albumDays : 30;
    patch.archived_at = existing.archived_at ?? now.toISOString();
    patch.album_token = generateAlbumToken();
    patch.album_expires_at = new Date(
      now.getTime() + days * 24 * 60 * 60 * 1000,
    ).toISOString();
  } else if (!existing.album_expires_at) {
    const days = Number.isFinite(albumDays) && albumDays >= 1 ? albumDays : 30;
    patch.archived_at = existing.archived_at ?? now.toISOString();
    patch.album_expires_at = new Date(
      now.getTime() + days * 24 * 60 * 60 * 1000,
    ).toISOString();
  } else if (!existing.archived_at) {
    patch.archived_at = now.toISOString();
  }

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to soft-delete event: ${error.message}`);
  }
  return data;
}

async function removeEventStorageFolder(eventId: string) {
  const admin = createServiceClient();
  const bucket = "event-photos";
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const { data: files, error } = await admin.storage
      .from(bucket)
      .list(eventId, { limit: pageSize, offset });

    if (error) {
      throw new Error(`Failed to list storage files: ${error.message}`);
    }
    if (!files?.length) break;

    const paths = files.map((f) => `${eventId}/${f.name}`);
    const { error: removeError } = await admin.storage
      .from(bucket)
      .remove(paths);
    if (removeError) {
      throw new Error(`Failed to remove storage files: ${removeError.message}`);
    }

    if (files.length < pageSize) break;
    offset += pageSize;
  }
}

export async function purgeEvent(id: string): Promise<void> {
  await removeEventStorageFolder(id);

  const supabase = await createServerClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to purge event: ${error.message}`);
  }
}

/** Browser helper for dashboard client components */
export async function listEventsBrowser(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
