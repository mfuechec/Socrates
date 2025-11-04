/**
 * Type definitions for solution path analysis system
 * Supports multiple valid approaches with step-by-step guidance
 */

/**
 * Hint levels for progressive specificity
 */
export type HintLevel = 1 | 2 | 3;

/**
 * Difficulty level for each step
 */
export type StepDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Step status for UI tracking
 */
export type StepStatus = 'pending' | 'current' | 'completed' | 'skipped';

/**
 * Hints at three levels of specificity
 */
export interface StepHints {
  /** Level 1: General guidance referencing problem specifics */
  level1: string;
  /** Level 2: Point to exact part, suggest specific operation */
  level2: string;
  /** Level 3: Very concrete guidance with actual numbers */
  level3: string;
}

/**
 * A single step in a solution approach
 */
export interface SolutionStep {
  /** Step number (1-indexed) */
  stepNumber: number;
  /** What the student should do in this step */
  action: string;
  /** Why this step is necessary/helpful */
  reasoning: string;
  /** Progressive hints at three levels */
  hints: StepHints;
  /** Difficulty level for this step */
  difficulty?: StepDifficulty;
  /** Key concepts involved in this step */
  keyConcepts?: string[];
  /** Common mistakes students make on this step */
  commonMistakes?: string[];
}

/**
 * A complete solution approach (e.g., "Elimination Method" or "Substitution Method")
 */
export interface SolutionApproach {
  /** Name of this approach */
  name: string;
  /** Description of when/why to use this approach */
  description?: string;
  /** Steps in this approach */
  steps: SolutionStep[];
  /** Estimated difficulty of this approach */
  difficulty?: StepDifficulty;
}

/**
 * Complete solution path analysis for a problem
 */
export interface SolutionPath {
  /** The original problem statement */
  problemStatement: string;
  /** Type of problem (e.g., "Linear Equation", "System of Equations") */
  problemType: string;
  /** All valid solution approaches */
  approaches: SolutionApproach[];
  /** Index of the recommended/default approach */
  recommendedApproachIndex: number;
  /** Overall concepts needed to solve this problem */
  requiredConcepts?: string[];
  /** Timestamp when path was generated */
  generatedAt: Date;
}

/**
 * Step progression metadata returned by AI
 */
export interface StepProgression {
  /** Whether current step is completed */
  currentStepCompleted: boolean;
  /** Whether student took an alternative valid approach */
  alternativeApproachDetected?: boolean;
  /** Index of alternative approach if detected */
  alternativeApproachIndex?: number;
  /** Whether student is struggling on current step (AI assessment) */
  studentStrugglingOnCurrentStep?: boolean;
  /** Suggested action: 'continue' | 'advance' | 'switch_approach' */
  suggestedAction?: 'continue' | 'advance' | 'switch_approach';
}

/**
 * Struggle tracking state
 */
export interface StruggleState {
  /** Number of consecutive struggles on current step (keyword-based) */
  keywordStruggleCount: number;
  /** Number of consecutive incorrect attempts */
  incorrectAttemptCount: number;
  /** AI's assessment of struggle (overrides keyword if higher) */
  aiStruggleAssessment?: number;
  /** Effective struggle count (max of keyword and AI) */
  effectiveStruggleLevel: number;
}
