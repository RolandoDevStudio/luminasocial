import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getPublishableKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

/** Browser Supabase client (publishable / anon key — respects RLS). */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getPublishableKey());
}
