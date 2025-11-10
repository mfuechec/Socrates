/**
 * User Report Component
 * Displays all stored user data from Supabase
 */

import { useEffect, useState, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import type { Database } from '@/lib/supabase';

interface UserReportProps {
  onClose: () => void;
}

export default function UserReport({ onClose }: UserReportProps) {
  const session = useSession();
  const supabase = useSupabaseClient<Database>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    problemAttempts: any[];
    topicProgress: any[];
    practiceSessions: any[];
  }>({
    problemAttempts: [],
    topicProgress: [],
    practiceSessions: [],
  });

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const userId = session.user.id;

      // Fetch all data in parallel
      const [attemptsRes, progressRes, sessionsRes] = await Promise.all([
        supabase
          .from('problem_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('topic_progress')
          .select('*')
          .eq('user_id', userId)
          .order('strength', { ascending: false }),
        supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      setData({
        problemAttempts: attemptsRes.data || [],
        topicProgress: progressRes.data || [],
        practiceSessions: sessionsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="card-bg rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <p className="text-center text-primary">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card-bg rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-heading">User Data Report</h2>
          <div className="flex gap-3 items-center">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors text-sm"
              title="Refresh data"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 card-secondary-bg rounded-lg">
          <h3 className="text-lg font-semibold text-heading mb-2">User Info</h3>
          <p className="text-sm text-secondary">Email: {session?.user?.email}</p>
          <p className="text-sm text-secondary">User ID: {session?.user?.id}</p>
        </div>

        {/* Topic Progress */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-heading mb-3">
            Topic Progress ({data.topicProgress.length})
          </h3>
          {data.topicProgress.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="card-secondary-bg">
                  <tr>
                    <th className="px-4 py-2 text-left text-heading">Topic</th>
                    <th className="px-4 py-2 text-left text-heading">Strength</th>
                    <th className="px-4 py-2 text-left text-heading">Ease Factor</th>
                    <th className="px-4 py-2 text-left text-heading">Interval (days)</th>
                    <th className="px-4 py-2 text-left text-heading">Review Count</th>
                    <th className="px-4 py-2 text-left text-heading">Next Review</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topicProgress.map((topic, idx) => (
                    <tr key={idx} className="border-t border-secondary">
                      <td className="px-4 py-2 text-primary capitalize">
                        {topic.topic.replace(/-/g, ' ')}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {(topic.strength * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {topic.ease_factor ? topic.ease_factor.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {topic.interval_days ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-primary">{topic.review_count}</td>
                      <td className="px-4 py-2 text-primary">
                        {topic.next_review
                          ? new Date(topic.next_review).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary">No topic progress data</p>
          )}
        </div>

        {/* Problem Attempts */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-heading mb-3">
            Problem Attempts ({data.problemAttempts.length})
          </h3>
          {data.problemAttempts.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.problemAttempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className="p-3 card-secondary-bg rounded text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-primary">
                      {attempt.problem_text?.substring(0, 80)}...
                    </span>
                    <span className="text-xs text-secondary">
                      {new Date(attempt.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-secondary">
                    <span className="capitalize">Mastery: {attempt.mastery_level}</span>
                    <span>Turns: {attempt.turns_taken}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">No problem attempts</p>
          )}
        </div>

        {/* Practice Sessions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-heading mb-3">
            Practice Sessions ({data.practiceSessions.length})
          </h3>
          {data.practiceSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="card-secondary-bg">
                  <tr>
                    <th className="px-4 py-2 text-left text-heading">Type</th>
                    <th className="px-4 py-2 text-left text-heading">Problems</th>
                    <th className="px-4 py-2 text-left text-heading">Completed</th>
                    <th className="px-4 py-2 text-left text-heading">Status</th>
                    <th className="px-4 py-2 text-left text-heading">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.practiceSessions.map((session, idx) => (
                    <tr key={idx} className="border-t border-secondary">
                      <td className="px-4 py-2 text-primary capitalize">
                        {session.session_type}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {session.problems_count}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {session.completed_count}
                      </td>
                      <td className="px-4 py-2 text-primary capitalize">
                        {session.status}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary">No practice sessions</p>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
