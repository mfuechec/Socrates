-- Migration: Add SM-2 State Persistence
-- Date: 2025-11-04
-- Purpose: Store ease_factor and interval_days for complete SM-2 algorithm state

-- Add ease_factor column (tracks how easy/hard a topic is for the user)
ALTER TABLE topic_progress
  ADD COLUMN IF NOT EXISTS ease_factor FLOAT DEFAULT 2.5
  CHECK (ease_factor >= 1.3);

-- Add interval_days column (tracks current review interval)
ALTER TABLE topic_progress
  ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1
  CHECK (interval_days >= 1);

-- Add comment for documentation
COMMENT ON COLUMN topic_progress.ease_factor IS 'SM-2 ease factor (≥1.3), adjusted based on recall quality';
COMMENT ON COLUMN topic_progress.interval_days IS 'Current review interval in days, grows exponentially with successful reviews';

-- Update existing records to have default values
UPDATE topic_progress
SET
  ease_factor = 2.5,
  interval_days = 1
WHERE ease_factor IS NULL OR interval_days IS NULL;

-- Create composite index for efficient mixed practice queries
-- This index speeds up queries that filter by user_id, strength, and next_review
CREATE INDEX IF NOT EXISTS idx_topic_progress_mixed_practice
  ON topic_progress(user_id, strength, next_review)
  WHERE strength < 0.6 OR next_review <= NOW();

-- Create partial index for weak topics (strength < 0.6)
-- Speeds up identification of topics needing review
CREATE INDEX IF NOT EXISTS idx_topic_progress_weak_topics
  ON topic_progress(user_id, strength)
  WHERE strength < 0.6;

-- Create index for lapsed topics (overdue reviews)
CREATE INDEX IF NOT EXISTS idx_topic_progress_lapsed
  ON topic_progress(user_id, next_review, interval_days)
  WHERE next_review < NOW();

-- Verify migration
DO $$
BEGIN
  -- Check that columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topic_progress' AND column_name = 'ease_factor'
  ) THEN
    RAISE EXCEPTION 'Migration failed: ease_factor column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topic_progress' AND column_name = 'interval_days'
  ) THEN
    RAISE EXCEPTION 'Migration failed: interval_days column not created';
  END IF;

  RAISE NOTICE 'Migration successful: SM-2 state persistence columns added';
END $$;

-- Display sample data to verify
SELECT
  topic,
  strength,
  ease_factor,
  interval_days,
  review_count,
  next_review
FROM topic_progress
LIMIT 5;
