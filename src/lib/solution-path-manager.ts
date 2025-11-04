/**
 * Solution path management utilities
 * Handles step tracking, hint selection, and struggle detection
 */

import type {
  SolutionPath,
  SolutionStep,
  SolutionApproach,
  HintLevel,
  StruggleState,
  StepProgression,
} from '@/types/solution-path';

/**
 * Keywords that indicate student is struggling
 */
const STRUGGLE_KEYWORDS = [
  "don't know",
  "dont know",
  "not sure",
  "confused",
  "lost",
  "stuck",
  "help",
  "i have no idea",
  "no clue",
  "what do i do",
];

/**
 * Get the current step from solution path
 */
export function getCurrentStep(
  path: SolutionPath,
  approachIndex: number,
  stepIndex: number
): SolutionStep | null {
  const approach = path.approaches[approachIndex];
  if (!approach || stepIndex >= approach.steps.length) {
    return null;
  }
  return approach.steps[stepIndex];
}

/**
 * Get the current approach
 */
export function getCurrentApproach(
  path: SolutionPath,
  approachIndex: number
): SolutionApproach | null {
  return path.approaches[approachIndex] || null;
}

/**
 * Get appropriate hint based on struggle level
 */
export function getHintForStruggleLevel(
  step: SolutionStep,
  struggleLevel: number
): string {
  // Map struggle level to hint level (1-3)
  let hintLevel: HintLevel;
  if (struggleLevel === 0 || struggleLevel === 1) {
    hintLevel = 1;
  } else if (struggleLevel === 2) {
    hintLevel = 2;
  } else {
    hintLevel = 3;
  }

  return step.hints[`level${hintLevel}` as keyof typeof step.hints];
}

/**
 * Detect if message contains struggle keywords
 */
export function detectStruggleKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return STRUGGLE_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Calculate effective struggle level (hybrid approach)
 * Takes max of keyword-based count and AI assessment
 */
export function calculateEffectiveStruggleLevel(
  keywordCount: number,
  aiAssessment: boolean = false
): number {
  // AI assessment adds 2 to struggle level if it detects struggling
  const aiStruggleValue = aiAssessment ? 2 : 0;
  return Math.max(keywordCount, aiStruggleValue);
}

/**
 * Update struggle state based on new message and AI response
 */
export function updateStruggleState(
  currentState: StruggleState,
  studentMessage: string,
  stepProgression?: StepProgression
): StruggleState {
  // Detect keywords in student message
  const hasStruggleKeywords = detectStruggleKeywords(studentMessage);

  // Increment keyword struggle count if keywords detected
  const keywordStruggleCount = hasStruggleKeywords
    ? currentState.keywordStruggleCount + 1
    : currentState.keywordStruggleCount;

  // Get AI assessment from step progression
  const aiAssessment = stepProgression?.studentStrugglingOnCurrentStep || false;

  // Calculate effective struggle level
  const effectiveStruggleLevel = calculateEffectiveStruggleLevel(
    keywordStruggleCount,
    aiAssessment
  );

  return {
    keywordStruggleCount,
    incorrectAttemptCount: currentState.incorrectAttemptCount,
    aiStruggleAssessment: aiAssessment ? 2 : 0,
    effectiveStruggleLevel,
  };
}

/**
 * Reset struggle state (when advancing to next step)
 */
export function resetStruggleState(): StruggleState {
  return {
    keywordStruggleCount: 0,
    incorrectAttemptCount: 0,
    aiStruggleAssessment: 0,
    effectiveStruggleLevel: 0,
  };
}

/**
 * Format step context for system prompt
 * Returns a concise summary of current step and relevant hints
 */
export function formatStepContextForPrompt(
  path: SolutionPath,
  approachIndex: number,
  stepIndex: number,
  struggleLevel: number
): string {
  const approach = getCurrentApproach(path, approachIndex);
  const step = getCurrentStep(path, approachIndex, stepIndex);

  if (!approach || !step) {
    return '';
  }

  const hint = getHintForStruggleLevel(step, struggleLevel);

  // Build context string
  let context = `SOLUTION PATH CONTEXT:

Current Approach: ${approach.name}
Step ${step.stepNumber} of ${approach.steps.length}: ${step.action}
Reasoning: ${step.reasoning}

Current Struggle Level: ${struggleLevel}
Suggested Hint (adapt naturally): "${hint}"
`;

  // Add key concepts if available
  if (step.keyConcepts && step.keyConcepts.length > 0) {
    context += `\nKey Concepts: ${step.keyConcepts.join(', ')}`;
  }

  // Add common mistakes if available
  if (step.commonMistakes && step.commonMistakes.length > 0) {
    context += `\nCommon Mistakes to Watch For: ${step.commonMistakes.join(', ')}`;
  }

  // Add information about next step if available
  if (stepIndex + 1 < approach.steps.length) {
    const nextStep = approach.steps[stepIndex + 1];
    context += `\n\nNext Step Preview: ${nextStep.action}`;
  }

  return context;
}

/**
 * Check if we're on the last step of current approach
 */
export function isLastStep(
  path: SolutionPath,
  approachIndex: number,
  stepIndex: number
): boolean {
  const approach = getCurrentApproach(path, approachIndex);
  if (!approach) return false;
  return stepIndex === approach.steps.length - 1;
}

/**
 * Get progress percentage through current approach
 */
export function getProgressPercentage(
  path: SolutionPath,
  approachIndex: number,
  stepIndex: number
): number {
  const approach = getCurrentApproach(path, approachIndex);
  if (!approach || approach.steps.length === 0) return 0;

  // Step index is 0-based, so add 1 for completed steps
  const completedSteps = stepIndex;
  const totalSteps = approach.steps.length;

  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Handle step progression based on AI response
 * Returns new step index and approach index
 */
export function handleStepProgression(
  stepProgression: StepProgression | undefined,
  currentApproachIndex: number,
  currentStepIndex: number,
  path: SolutionPath
): { approachIndex: number; stepIndex: number; changed: boolean } {
  if (!stepProgression) {
    return {
      approachIndex: currentApproachIndex,
      stepIndex: currentStepIndex,
      changed: false,
    };
  }

  // Handle alternative approach detection
  if (
    stepProgression.alternativeApproachDetected &&
    stepProgression.alternativeApproachIndex !== undefined
  ) {
    return {
      approachIndex: stepProgression.alternativeApproachIndex,
      stepIndex: 0, // Start from beginning of new approach
      changed: true,
    };
  }

  // Handle step completion
  if (stepProgression.currentStepCompleted) {
    const approach = getCurrentApproach(path, currentApproachIndex);
    if (!approach) {
      return {
        approachIndex: currentApproachIndex,
        stepIndex: currentStepIndex,
        changed: false,
      };
    }

    // Advance to next step if not on last step
    if (currentStepIndex < approach.steps.length - 1) {
      return {
        approachIndex: currentApproachIndex,
        stepIndex: currentStepIndex + 1,
        changed: true,
      };
    }

    // If on last step and completed, stay on last step
    return {
      approachIndex: currentApproachIndex,
      stepIndex: currentStepIndex,
      changed: false,
    };
  }

  // No change
  return {
    approachIndex: currentApproachIndex,
    stepIndex: currentStepIndex,
    changed: false,
  };
}

/**
 * Format all approaches for display (used in UI)
 */
export function formatApproachesForDisplay(path: SolutionPath): {
  name: string;
  description: string;
  stepCount: number;
}[] {
  return path.approaches.map((approach) => ({
    name: approach.name,
    description: approach.description || '',
    stepCount: approach.steps.length,
  }));
}
