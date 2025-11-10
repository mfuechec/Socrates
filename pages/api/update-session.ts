/**
 * API Endpoint: Update Practice Session
 * Increments completed_count and updates status when a problem is completed
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';

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

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const userId = session.user.id;

    console.log('=== Update Practice Session ===');
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId);

    // 1. Get current session
    const { data: currentSession, error: fetchError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return res.status(404).json({ error: 'Session not found' });
    }

    // 2. Increment completed_count
    const newCompletedCount = currentSession.completed_count + 1;
    const totalProblems = currentSession.problems_count;

    // 3. Determine new status
    let newStatus: 'in_progress' | 'completed' | 'abandoned' = 'in_progress';
    if (newCompletedCount >= totalProblems) {
      newStatus = 'completed';
    }

    console.log(`Progress: ${newCompletedCount}/${totalProblems}`);
    console.log(`Status: ${currentSession.status} → ${newStatus}`);

    // 4. Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        completed_count: newCompletedCount,
        status: newStatus,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return res.status(500).json({ error: 'Failed to update session' });
    }

    console.log('✅ Session updated:', updatedSession);

    return res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error('Error in update-session API:', error);
    return res.status(500).json({ error: error.message });
  }
}
