/**
 * Solution Path Progress Component (SIMPLIFIED)
 * Clean, student-focused progress indicator
 */

import type { SolutionPath } from '@/types/solution-path';
import type { MasteryLevel } from '@/types/whiteboard';

interface SolutionPathProgressProps {
  solutionPath?: SolutionPath;
  currentApproachIndex: number;
  currentStepIndex: number;
  masteryLevel: MasteryLevel | null;
  darkMode: boolean;
}

export default function SolutionPathProgress({
  solutionPath,
  currentApproachIndex,
  currentStepIndex,
  masteryLevel,
  darkMode,
}: SolutionPathProgressProps) {
  const currentApproach = solutionPath?.approaches[currentApproachIndex];

  if (!currentApproach) {
    return null;
  }

  const totalSteps = currentApproach.steps.length;
  const isProblemComplete = masteryLevel === 'mastered' || masteryLevel === 'competent';

  return (
    <div className="flex items-center gap-2 justify-center">
      {currentApproach.steps.map((_, index) => {
        const isCompleted = isProblemComplete ? true : index < currentStepIndex;
        const isCurrent = !isProblemComplete && index === currentStepIndex;

        return (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-green-500 animate-scaleIn'
                : isCurrent
                ? 'bg-blue-600 ring-2 ring-blue-400 animate-pulse-slow'
                : 'bg-gray-700'
            }`}
          >
            {isCompleted ? (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <span className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                {index + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
