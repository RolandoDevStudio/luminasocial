import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MagazineResolveResult =
  | {
      status: "ok";
      event: Event;
      /** Client deliverable mode: countdown + download */
      isAlbum: boolean;
      expired: false;
    }
  | { status: "expired"; event: Event }
  | { status: "redirect"; token: string }
  | { status: "not_found" };

function isExpired(event: Event): boolean {
  if (!event.album_expires_at) return false;
  return new Date(event.album_expires_at).getTime() < Date.now();
}

/** Deliverable album UX (banner + ZIP) after archive / soft-delete / expiry set. */
export function isClientAlbumMode(event: Event): boolean {
  return Boolean(
    event.archived_at || event.deleted_at || event.album_expires_at,
  );
}

export async function resolveMagazineSlug(
  slug: string,
): Promise<MagazineResolveResult> {
  const supabase = await createServerClient();
  const trimmed = slug.trim();
  if (!trimmed) return { status: "not_found" };

  const { data: byToken, error: tokenError } = await supabase
    .from("events")
    .select("*")
    .eq("album_token", trimmed)
    .maybeSingle();

  if (tokenError) {
    throw new Error(`Failed to resolve album token: ${tokenError.message}`);
  }

  if (byToken) {
    if (isExpired(byToken)) {
      return { status: "expired", event: byToken };
    }
    return {
      status: "ok",
      event: byToken,
      isAlbum: isClientAlbumMode(byToken),
      expired: false,
    };
  }

  // Legacy UUID bookmarks → redirect to stable token URL when possible
  if (!UUID_RE.test(trimmed)) {
    return { status: "not_found" };
  }

  const { data: byId, error: idError } = await supabase
    .from("events")
    .select("*")
    .eq("id", trimmed)
    .maybeSingle();

  if (idError) {
    throw new Error(`Failed to resolve event id: ${idError.message}`);
  }

  if (!byId) return { status: "not_found" };

  if (isExpired(byId)) {
    return { status: "expired", event: byId };
  }

  if (byId.album_token) {
    return { status: "redirect", token: byId.album_token };
  }

  // Rare: legacy row without token — allow live preview by UUID
  if (byId.archived_at || byId.deleted_at) {
    return { status: "not_found" };
  }

  return {
    status: "ok",
    event: byId,
    isAlbum: false,
    expired: false,
  };
}

/** Client helper: load event by album token. */
export async function getEventByAlbumToken(
  token: string,
): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("album_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
