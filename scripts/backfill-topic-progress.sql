-- Backfill ease_factor and interval_days for existing topic_progress records
-- Run this in your Supabase SQL editor

UPDATE topic_progress
SET
  ease_factor = 2.5,  -- Default initial ease factor
  interval_days = 1   -- Default first interval
WHERE
  ease_factor IS NULL
  OR interval_days IS NULL;

-- Verify the update
SELECT
  topic,
  strength,
  ease_factor,
  interval_days,
  review_count
FROM topic_progress
ORDER BY topic;
