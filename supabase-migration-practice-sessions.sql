-- Migration: Update practice_sessions table for Mixed Practice feature
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists (will lose data - only run if testing)
DROP TABLE IF EXISTS practice_sessions;

-- Create updated practice_sessions table
CREATE TABLE practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('mixed', 'targeted', 'review')),
  problems_count INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for user lookups
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);

-- Enable Row Level Security
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sessions
CREATE POLICY "Users can view own practice sessions"
  ON practice_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own sessions
CREATE POLICY "Users can create own practice sessions"
  ON practice_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own sessions
CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
