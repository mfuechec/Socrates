/**
 * Mixed Practice Modal Component
 * Shows session preview before starting and celebration on completion
 */

import { useState } from 'react';

interface MixedPracticeModalProps {
  mode: 'preview' | 'celebration';
  darkMode: boolean;
  onClose: () => void;
  onStart?: () => void;
  sessionData?: {
    problems: Array<{ topic: string; problemText: string }>;
    totalCount: number;
  };
  completionStats?: {
    totalProblems: number;
    mastered: number;
    competent: number;
    struggling: number;
    topicsEncountered: string[];
  };
}

export default function MixedPracticeModal({
  mode,
  darkMode,
  onClose,
  onStart,
  sessionData,
  completionStats,
}: MixedPracticeModalProps) {
  // Preview mode
  if (mode === 'preview' && sessionData) {
    // Count topics
    const topicCounts: Record<string, number> = {};
    sessionData.problems.forEach((p) => {
      topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
    });

    const topicsList = Object.entries(topicCounts).map(([topic, count]) => ({
      topic,
      count,
    }));

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div
          className={`max-w-2xl w-full rounded-lg shadow-2xl p-6 animate-scaleIn ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2 animate-bounce-subtle">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Practice Session</h2>
            <p className="text-gray-400">
              Practice different topics to strengthen your skills
            </p>
          </div>

          {/* Session Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total Problems:</span>
              <span className="text-2xl font-bold text-blue-400">{sessionData.totalCount}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-400 mb-2">Topics in this session:</div>
              <div className="space-y-2">
                {topicsList.map(({ topic, count }) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm font-medium capitalize">
                        {topic.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{count} problem{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onStart}
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Celebration mode
  if (mode === 'celebration' && completionStats) {
    const totalAttempts = completionStats.mastered + completionStats.competent + completionStats.struggling;
    const successRate = totalAttempts > 0
      ? Math.round(((completionStats.mastered + completionStats.competent) / totalAttempts) * 100)
      : 0;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div
          className={`max-w-2xl w-full rounded-lg shadow-2xl p-6 animate-scaleIn ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce-subtle">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
            <p className="text-gray-400">
              Great work! You've practiced {completionStats.totalProblems} problems
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-green-900/30 border border-green-700">
              <div className="text-3xl font-bold text-green-400">{completionStats.mastered}</div>
              <div className="text-xs text-gray-400 mt-1">Mastered</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-900/30 border border-yellow-700">
              <div className="text-3xl font-bold text-yellow-400">{completionStats.competent}</div>
              <div className="text-xs text-gray-400 mt-1">Competent</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-900/30 border border-orange-700">
              <div className="text-3xl font-bold text-orange-400">{completionStats.struggling}</div>
              <div className="text-xs text-gray-400 mt-1">Need Practice</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Success Rate</span>
              <span className="text-lg font-bold text-blue-400">{successRate}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Topics Practiced */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-400 mb-2">Topics Practiced:</div>
            <div className="flex flex-wrap gap-2">
              {completionStats.topicsEncountered.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs rounded-full bg-blue-900/30 text-blue-300 border border-blue-700"
                >
                  {topic.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => {
                onClose();
                if (onStart) onStart();
              }}
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
