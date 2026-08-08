-- =============================================================================
-- Lumina Social — Database Schema
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE photo_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE screen_view_type AS ENUM ('IDLE', 'PHOTO', 'TRIVIA', 'POSE_BATTLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 1. events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_code ON events (code);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events (is_active);

-- -----------------------------------------------------------------------------
-- 2. photos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  status photo_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos (event_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_status ON photos (event_id, status);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos (created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. trivia_questions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trivia_questions_correct_option_check CHECK (correct_option >= 0)
);

CREATE INDEX IF NOT EXISTS idx_trivia_questions_event_id ON trivia_questions (event_id);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_active ON trivia_questions (event_id, is_active);

-- -----------------------------------------------------------------------------
-- 4. trivia_answers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trivia_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES trivia_questions (id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trivia_answers_question_id ON trivia_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_trivia_answers_table ON trivia_answers (question_id, table_number);

-- -----------------------------------------------------------------------------
-- 5. pose_battles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pose_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  table_a INTEGER NOT NULL,
  table_b INTEGER NOT NULL,
  photo_a_url TEXT NOT NULL,
  photo_b_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pose_battles_event_id ON pose_battles (event_id);
CREATE INDEX IF NOT EXISTS idx_pose_battles_active ON pose_battles (event_id, is_active);

-- -----------------------------------------------------------------------------
-- 6. pose_votes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pose_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES pose_battles (id) ON DELETE CASCADE,
  voted_table INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pose_votes_battle_id ON pose_votes (battle_id);

-- -----------------------------------------------------------------------------
-- 7. live_screen_state
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS live_screen_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events (id) ON DELETE CASCADE,
  current_view screen_view_type NOT NULL DEFAULT 'IDLE',
  active_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_screen_state_event_id ON live_screen_state (event_id);

CREATE OR REPLACE FUNCTION set_live_screen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_live_screen_updated_at ON live_screen_state;
CREATE TRIGGER trg_live_screen_updated_at
  BEFORE UPDATE ON live_screen_state
  FOR EACH ROW
  EXECUTE FUNCTION set_live_screen_updated_at();

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE photos;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE live_screen_state;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trivia_questions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pose_battles;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Storage bucket: event-photos
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  TRUE,
  10485760,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "event_photos_public_read" ON storage.objects;
CREATE POLICY "event_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

DROP POLICY IF EXISTS "event_photos_public_insert" ON storage.objects;
CREATE POLICY "event_photos_public_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-photos');

-- -----------------------------------------------------------------------------
-- RLS — MVP permissive (anon key, no login friction)
-- -----------------------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pose_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pose_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_screen_state ENABLE ROW LEVEL SECURITY;

-- events
DROP POLICY IF EXISTS "events_select_public" ON events;
CREATE POLICY "events_select_public" ON events FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "events_insert_public" ON events;
CREATE POLICY "events_insert_public" ON events FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "events_update_public" ON events;
CREATE POLICY "events_update_public" ON events FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- photos
DROP POLICY IF EXISTS "photos_select_public" ON photos;
CREATE POLICY "photos_select_public" ON photos FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "photos_insert_public" ON photos;
CREATE POLICY "photos_insert_public" ON photos FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "photos_update_public" ON photos;
CREATE POLICY "photos_update_public" ON photos FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- trivia_questions
DROP POLICY IF EXISTS "trivia_questions_select_public" ON trivia_questions;
CREATE POLICY "trivia_questions_select_public" ON trivia_questions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "trivia_questions_insert_public" ON trivia_questions;
CREATE POLICY "trivia_questions_insert_public" ON trivia_questions FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "trivia_questions_update_public" ON trivia_questions;
CREATE POLICY "trivia_questions_update_public" ON trivia_questions FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- trivia_answers
DROP POLICY IF EXISTS "trivia_answers_select_public" ON trivia_answers;
CREATE POLICY "trivia_answers_select_public" ON trivia_answers FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "trivia_answers_insert_public" ON trivia_answers;
CREATE POLICY "trivia_answers_insert_public" ON trivia_answers FOR INSERT WITH CHECK (TRUE);

-- pose_battles
DROP POLICY IF EXISTS "pose_battles_select_public" ON pose_battles;
CREATE POLICY "pose_battles_select_public" ON pose_battles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "pose_battles_insert_public" ON pose_battles;
CREATE POLICY "pose_battles_insert_public" ON pose_battles FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "pose_battles_update_public" ON pose_battles;
CREATE POLICY "pose_battles_update_public" ON pose_battles FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- pose_votes
DROP POLICY IF EXISTS "pose_votes_select_public" ON pose_votes;
CREATE POLICY "pose_votes_select_public" ON pose_votes FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "pose_votes_insert_public" ON pose_votes;
CREATE POLICY "pose_votes_insert_public" ON pose_votes FOR INSERT WITH CHECK (TRUE);

-- live_screen_state
DROP POLICY IF EXISTS "live_screen_state_select_public" ON live_screen_state;
CREATE POLICY "live_screen_state_select_public" ON live_screen_state FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "live_screen_state_insert_public" ON live_screen_state;
CREATE POLICY "live_screen_state_insert_public" ON live_screen_state FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "live_screen_state_update_public" ON live_screen_state;
CREATE POLICY "live_screen_state_update_public" ON live_screen_state FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
