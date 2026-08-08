-- =============================================================================
-- Lumina Social — Archive / album columns (migración aditiva)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS album_token TEXT,
  ADD COLUMN IF NOT EXISTS album_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_album_token
  ON events (album_token)
  WHERE album_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events (deleted_at);

-- Backfill stable magazine tokens for existing events (vivo + archivado)
UPDATE events
SET album_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE album_token IS NULL;
