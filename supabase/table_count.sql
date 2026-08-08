-- =============================================================================
-- Lumina Social — table_count por evento (migración aditiva)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS table_count INTEGER NOT NULL DEFAULT 30;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_table_count_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_table_count_check
      CHECK (table_count >= 1 AND table_count <= 100);
  END IF;
END $$;
