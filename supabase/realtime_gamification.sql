-- Enable Realtime for gamification vote tables
-- Run once in Supabase SQL Editor after schema.sql

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trivia_answers;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pose_votes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
