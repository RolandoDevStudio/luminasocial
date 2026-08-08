import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/** Server-only Supabase client with service role (bypasses RLS). */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (necesaria para borrar archivos del Storage)",
    );
  }
  return createClient<Database>(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
