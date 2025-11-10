/**
 * API Endpoint: Save Problem Attempt
 * Saves a completed problem attempt to the database and updates topic progress
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { inferTopic, calculateMasteryLevel } from '@/lib/learning-algorithm';
import { updateTopicProgressAfterAttempt } from '@/lib/spaced-repetition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient<Database>({ req, res });

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { problemText, turnsTaken } = req.body;

    if (!problemText || typeof turnsTaken !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = session.user.id;

    // Determine mastery level and topic
    const masteryLevel = calculateMasteryLevel(turnsTaken);
    const topic = inferTopic(problemText);

    console.log('=== Save Attempt ===');
    console.log('User:', userId);
    console.log('Problem:', problemText);
    console.log('Turns:', turnsTaken);
    console.log('Mastery:', masteryLevel);
    console.log('Topic:', topic);

    // 1. Save the problem attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('problem_attempts')
      .insert({
        user_id: userId,
        problem_text: problemText,
        topic,
        mastery_level: masteryLevel,
        turns_taken: turnsTaken,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error saving attempt:', attemptError);
      return res.status(500).json({ error: 'Failed to save attempt' });
    }

    console.log('✅ Attempt saved:', attemptData.id);

    // 2. Get or create topic progress
    console.log('Fetching existing progress for topic:', topic);
    const { data: existingProgress, error: fetchError } = await supabase
      .from('topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine (new topic)
      console.error('Error fetching progress:', fetchError);
    } else {
      console.log('Existing progress:', existingProgress || 'none (new topic)');
    }

    // 3. Calculate updated progress
    console.log('Calculating updated progress...');
    const updatedProgress = updateTopicProgressAfterAttempt(
      topic,
      masteryLevel,
      existingProgress
    );
    console.log('Updated progress calculated:', updatedProgress);

    // 4. Upsert topic progress
    console.log('Upserting topic progress...');
    const { data: progressData, error: progressError } = await supabase
      .from('topic_progress')
      .upsert({
        user_id: userId,
        ...updatedProgress,
      })
      .select()
      .single();

    if (progressError) {
      console.error('❌ Error updating progress:', progressError);
      // Don't fail the request - attempt was still saved
    } else {
      console.log('✅ Progress updated:', progressData);
    }

    return res.status(200).json({
      success: true,
      attempt: attemptData,
      progress: progressData,
    });
  } catch (error: any) {
    console.error('Error in save-attempt API:', error);
    return res.status(500).json({ error: error.message });
  }
}
