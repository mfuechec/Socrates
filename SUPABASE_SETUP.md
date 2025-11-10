# Supabase Setup Guide

Follow these steps to set up authentication and database for the Socrates app.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `socrates-math-tutor` (or your choice)
   - Database Password: (generate a strong password - save it!)
   - Region: Choose closest to you
   - Pricing Plan: Free tier is fine
5. Wait 2-3 minutes for project to provision

## Step 2: Get API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon) in sidebar
2. Go to "API" section
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key, NOT the `service_role` key)

4. Update your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Run Database Migrations

1. In Supabase dashboard, click "SQL Editor" in sidebar
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- problem_attempts: Track every problem solved
CREATE TABLE IF NOT EXISTS problem_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_text TEXT NOT NULL,
  topic TEXT NOT NULL,
  mastery_level TEXT NOT NULL CHECK (mastery_level IN ('mastered', 'competent', 'struggling')),
  turns_taken INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- topic_progress: Track mastery of each topic
CREATE TABLE IF NOT EXISTS topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  review_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- practice_sessions: Track Daily Practice sessions
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problems_completed INTEGER DEFAULT 0,
  problems_total INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problem_attempts_user_id ON problem_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_topic ON problem_attempts(topic);
CREATE INDEX IF NOT EXISTS idx_problem_attempts_created_at ON problem_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_id ON topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_next_review ON topic_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies: Users can only access their own data
CREATE POLICY "Users can view own problem attempts"
  ON problem_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problem attempts"
  ON problem_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own topic progress"
  ON topic_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic progress"
  ON topic_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
  ON topic_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own practice sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

4. Click "Run" button
5. You should see "Success. No rows returned"

## Step 4: Configure Auth Providers

### Email Auth (Always Enabled)
This is enabled by default - no action needed.

### Google OAuth (Optional but Recommended)
1. In Supabase dashboard, go to "Authentication" → "Providers"
2. Find "Google" in the list
3. Toggle it ON
4. Follow Supabase's instructions to:
   - Create Google OAuth credentials
   - Add authorized redirect URL
   - Enter Client ID and Client Secret

## Step 5: Create Auth Callback Route

This is already set up in the code at `/pages/auth/callback.tsx`

## Step 6: Test Your Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000
3. You should see a "Sign In" button appear
4. Try signing up with email or Google
5. Check Supabase dashboard → Authentication → Users to see your new user

## Troubleshooting

**"Invalid API key" error:**
- Double-check you copied the `anon` key, not the `service_role` key
- Make sure there are no extra spaces in `.env.local`
- Restart your dev server after updating `.env.local`

**"relation does not exist" error:**
- Make sure you ran the SQL migration in Step 3
- Check for any SQL errors in the Supabase SQL Editor

**Can't sign in:**
- Check Supabase → Authentication → Providers that Email is enabled
- For Google OAuth, ensure redirect URL is correct
- Check browser console for errors

## Next Steps

Once setup is complete, the app will:
- Save every problem you solve to the database
- Track your mastery level for each topic
- Schedule spaced repetition reviews
- Generate personalized practice problems based on your progress

Enjoy learning! 🎉
