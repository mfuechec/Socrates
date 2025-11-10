/**
 * Struggle Badge Component
 * Visible indicator of student's current struggle state
 * Provides encouragement and adaptive feedback
 */

interface StruggleBadgeProps {
  effectiveStruggleLevel: number;
  darkMode: boolean;
}

export default function StruggleBadge({ effectiveStruggleLevel, darkMode }: StruggleBadgeProps) {
  const hintLevel = Math.min(3, effectiveStruggleLevel);

  // Define badge states
  const badgeStates = {
    0: {
      emoji: '😊',
      message: "You've got this!",
      color: 'bg-green-900/30 text-green-300 border-green-700',
    },
    1: {
      emoji: '🤔',
      message: 'Making good progress',
      color: 'bg-blue-900/30 text-blue-300 border-blue-700',
    },
    2: {
      emoji: '💭',
      message: "Taking your time - that's ok!",
      color: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
    },
    3: {
      emoji: '🧩',
      message: 'Working through it carefully',
      color: 'bg-orange-900/30 text-orange-300 border-orange-700',
    },
  };

  const state = badgeStates[hintLevel as keyof typeof badgeStates];

  // Don't show badge if no struggle (level 0) to reduce UI clutter
  if (hintLevel === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${state.color}`}
    >
      <span className="text-base">{state.emoji}</span>
      <span>{state.message}</span>
      {hintLevel > 1 && (
        <span className="ml-1 opacity-70 text-[10px]">(Hint level: {hintLevel}/3)</span>
      )}
    </div>
  );
}
