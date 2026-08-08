import { createClient } from "@/lib/supabase/client";
import type {
  Json,
  LiveScreenState,
  Photo,
  PhotoStatus,
  ScreenViewType,
} from "@/types/database";

const BUCKET = "event-photos";

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["webp", "jpg", "jpeg", "png"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  return "jpg";
}

/**
 * Uploads a photo to Storage and inserts a pending row in `photos`.
 */
export async function uploadEventPhoto(
  file: File,
  eventId: string,
  tableNumber: number,
): Promise<Photo> {
  const supabase = createClient();
  const ext = extensionFromFile(file);
  const objectPath = `${eventId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  const { data, error } = await supabase
    .from("photos")
    .insert({
      event_id: eventId,
      table_number: tableNumber,
      photo_url: publicUrl,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create photo record: ${error.message}`);
  }

  return data;
}

/**
 * Returns all photos for an event (newest first for display, pending sorted separately in UI).
 */
export async function getEventPhotos(eventId: string): Promise<Photo[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch event photos: ${error.message}`);
  }

  return data ?? [];
}

export type PhotoStats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export function computePhotoStats(photos: Photo[]): PhotoStats {
  const stats: PhotoStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: photos.length,
  };

  for (const photo of photos) {
    if (photo.status === "pending") stats.pending += 1;
    else if (photo.status === "approved") stats.approved += 1;
    else if (photo.status === "rejected") stats.rejected += 1;
  }

  return stats;
}

/**
 * Returns pending photos for the moderator queue.
 */
export async function getPendingPhotos(eventId: string): Promise<Photo[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pending photos: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Updates a photo moderation status.
 */
export async function updatePhotoStatus(
  photoId: string,
  status: Extract<PhotoStatus, "approved" | "rejected">,
): Promise<Photo> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("photos")
    .update({ status })
    .eq("id", photoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update photo status: ${error.message}`);
  }

  return data;
}

/**
 * Upserts the live screen state projected to TVs and guest devices.
 */
export async function updateLiveState(
  eventId: string,
  viewType: ScreenViewType,
  payload: Json = {},
): Promise<LiveScreenState> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("live_screen_state")
    .upsert(
      {
        event_id: eventId,
        current_view: viewType,
        active_payload: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update live screen state: ${error.message}`);
  }

  return data;
}

export type LiveScreenSnapshot = {
  current_view: ScreenViewType;
  active_payload: Json;
  updated_at: string | null;
};

/**
 * Fetches live screen state for an event, or IDLE default if missing.
 */
export async function getLiveScreenState(
  eventId: string,
): Promise<LiveScreenSnapshot> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("live_screen_state")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch live screen state: ${error.message}`);
  }

  if (!data) {
    return {
      current_view: "IDLE",
      active_payload: {},
      updated_at: null,
    };
  }

  return {
    current_view: data.current_view,
    active_payload: data.active_payload,
    updated_at: data.updated_at,
  };
}
