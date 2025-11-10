/**
 * Learning Algorithm
 * Analyzes problem attempts and calculates learning progress
 * Implements adaptive difficulty and mastery tracking
 */

import type {
  MasteryLevel,
  MathTopic,
  ProblemAttempt,
  TopicLearningProgress,
  TopicProgress,
} from '@/types/learning';
import type { SolutionPath } from '@/types/solution-path';
import {
  MASTERY_THRESHOLDS,
  MASTERY_STRENGTH_SCORES,
  STRENGTH_THRESHOLDS,
  STRENGTH_CALCULATION,
  getDifficultyMultiplier,
} from './learning-constants';

/**
 * Struggle data for enhanced mastery calculation
 */
export interface StruggleData {
  /** Number of hints requested (level 1, 2, 3) */
  hintsRequested: number;
  /** Number of incorrect attempts before getting it right */
  incorrectAttempts: number;
  /** Time spent on problem in seconds (optional) */
  timeSpentSeconds?: number;
  /** Number of times user asked for clarification */
  clarificationRequests: number;
}

/**
 * Determines mastery level based on turns taken
 *
 * OPTIONS:
 * 1. Basic (legacy): Fixed thresholds (5/10 turns)
 * 2. Problem-type adjusted: Scales thresholds by difficulty multiplier
 * 3. Step-based (best): Uses solution path step count as baseline
 *
 * @param turnsTaken Number of conversation turns to solve
 * @param problemType Optional problem type for difficulty adjustment
 * @param solutionPath Optional solution path for step-based calculation
 * @param approachIndex Which approach was used (default: 0)
 */
export function calculateMasteryLevel(
  turnsTaken: number,
  problemType?: string,
  solutionPath?: SolutionPath,
  approachIndex: number = 0
): MasteryLevel {
  let mastery: MasteryLevel;

  // Option 3: Step-based calculation (most accurate)
  if (solutionPath && solutionPath.approaches[approachIndex]) {
    const approach = solutionPath.approaches[approachIndex];
    const stepCount = approach.steps.length;
    const expectedTurns = stepCount * 2; // Baseline: ~2 turns per step

    const efficiency = expectedTurns / turnsTaken;

    if (efficiency >= 0.8) {
      mastery = 'mastered';    // Within 20% of expected
    } else if (efficiency >= 0.5) {
      mastery = 'competent';   // Within 50% of expected
    } else {
      mastery = 'struggling';
    }

    console.log(`[Mastery - Step-Based] ${stepCount} steps, expected ~${expectedTurns} turns, actual ${turnsTaken} → efficiency ${(efficiency * 100).toFixed(0)}% → ${mastery}`);
  }
  // Option 2: Problem-type adjusted (good fallback)
  else if (problemType) {
    const multiplier = getDifficultyMultiplier(problemType);
    const adjustedMasteredThreshold = Math.round(MASTERY_THRESHOLDS.MASTERED * multiplier);
    const adjustedCompetentThreshold = Math.round(MASTERY_THRESHOLDS.COMPETENT * multiplier);

    if (turnsTaken <= adjustedMasteredThreshold) {
      mastery = 'mastered';
    } else if (turnsTaken <= adjustedCompetentThreshold) {
      mastery = 'competent';
    } else {
      mastery = 'struggling';
    }

    console.log(`[Mastery - Type-Adjusted] ${problemType} (×${multiplier}), thresholds ${adjustedMasteredThreshold}/${adjustedCompetentThreshold}, turns ${turnsTaken} → ${mastery}`);
  }
  // Option 1: Basic (legacy)
  else {
    mastery = turnsTaken <= MASTERY_THRESHOLDS.MASTERED
      ? 'mastered'
      : turnsTaken <= MASTERY_THRESHOLDS.COMPETENT
      ? 'competent'
      : 'struggling';

    console.log(`[Mastery - Basic] Turns: ${turnsTaken} → ${mastery}`);
  }

  return mastery;
}

/**
 * Calculates mastery level with struggle signals (ENHANCED)
 * Incorporates hints, incorrect attempts, and other struggle indicators
 * Provides more holistic assessment than turn count alone
 *
 * @param turnsTaken Number of conversation turns
 * @param struggleData Data about hints, mistakes, clarifications
 * @param problemType Optional problem type for difficulty adjustment
 * @param solutionPath Optional solution path for step-based calculation
 * @param approachIndex Which approach was used
 * @returns Adjusted mastery level
 */
export function calculateMasteryWithStruggle(
  turnsTaken: number,
  struggleData: StruggleData,
  problemType?: string,
  solutionPath?: SolutionPath,
  approachIndex: number = 0
): MasteryLevel {
  // Start with base mastery calculation
  let baseMastery = calculateMasteryLevel(turnsTaken, problemType, solutionPath, approachIndex);

  // Calculate struggle score (0-1, where 1 = maximum struggle)
  const { hintsRequested, incorrectAttempts, clarificationRequests } = struggleData;

  // Weight different struggle indicators
  const hintPenalty = hintsRequested * 0.15; // Each hint = 15% penalty
  const mistakePenalty = incorrectAttempts * 0.2; // Each mistake = 20% penalty
  const clarificationPenalty = clarificationRequests * 0.1; // Each clarification = 10% penalty

  const totalStruggleScore = Math.min(1.0, hintPenalty + mistakePenalty + clarificationPenalty);

  console.log(`[Mastery - Struggle-Weighted] Base: ${baseMastery}, Struggle score: ${(totalStruggleScore * 100).toFixed(0)}%`);
  console.log(`  Hints: ${hintsRequested}, Mistakes: ${incorrectAttempts}, Clarifications: ${clarificationRequests}`);

  // Apply struggle adjustment
  let adjustedMastery: MasteryLevel = baseMastery;

  if (totalStruggleScore >= 0.6) {
    // High struggle → downgrade by 2 levels
    adjustedMastery = 'struggling';
  } else if (totalStruggleScore >= 0.3) {
    // Moderate struggle → downgrade by 1 level
    if (baseMastery === 'mastered') {
      adjustedMastery = 'competent';
    } else if (baseMastery === 'competent') {
      adjustedMastery = 'struggling';
    }
  }
  // Low struggle (< 0.3) → keep base mastery

  if (adjustedMastery !== baseMastery) {
    console.log(`  → Adjusted from ${baseMastery} to ${adjustedMastery}`);
  } else {
    console.log(`  → Kept ${baseMastery} (low struggle)`);
  }

  return adjustedMastery;
}

// Import weighted topic inference
import { inferTopicWeighted } from './topic-inference-weighted';
import { inferTopicLLM } from './topic-inference-llm';

/**
 * Infers the math topic from a problem statement
 * NOW USES: Weighted scoring system (more accurate than simple keywords)
 * Fallback: Legacy keyword matching if weighted system fails
 */
export function inferTopic(problemText: string): MathTopic {
  try {
    // Use weighted inference (better accuracy, handles ambiguity)
    return inferTopicWeighted(problemText);
  } catch (error) {
    // Fallback to legacy keyword matching
    console.warn('[Topic Inference] Weighted system failed, using legacy fallback:', error);
    return inferTopicLegacy(problemText);
  }
}

/**
 * Infers the math topic using LLM (async version)
 * Provides semantic understanding via GPT-4o-mini
 * Falls back to weighted inference if LLM fails
 *
 * @param problemText The problem to classify
 * @param useLLM Whether to use LLM classification (default: true if API key available)
 * @returns Promise resolving to the classified topic
 */
export async function inferTopicAsync(
  problemText: string,
  useLLM: boolean = !!process.env.OPENAI_API_KEY
): Promise<MathTopic> {
  if (useLLM) {
    try {
      // Use LLM classification with caching and fallback
      return await inferTopicLLM(problemText, {
        useCache: true,
        fallbackToWeighted: true,
      });
    } catch (error) {
      console.warn('[Topic Inference] LLM classification failed, using weighted fallback:', error);
      return inferTopicWeighted(problemText);
    }
  } else {
    // Use weighted inference directly (no LLM)
    return inferTopicWeighted(problemText);
  }
}

/**
 * Legacy topic inference (keyword-based, kept as fallback)
 * @deprecated Use inferTopicWeighted instead
 */
function inferTopicLegacy(problemText: string): MathTopic {
  const text = problemText.toLowerCase();
  const preview = problemText.substring(0, 50).replace(/\n/g, ' ');

  // Linear equations
  if (
    (text.includes('solve') || text.includes('find')) &&
    text.match(/\d*x\s*[+\-]\s*\d+\s*=/) &&
    !text.includes('x²') &&
    !text.includes('x^2')
  ) {
    const topic = 'linear-equations';
    console.log(`[Topic Classification] "${preview}..." → ${topic}`);
    return topic;
  }

  // Quadratic equations
  if (
    text.includes('x²') ||
    text.includes('x^2') ||
    text.includes('quadratic') ||
    text.includes('parabola')
  ) {
    const topic = 'quadratic-equations';
    console.log(`[Topic Classification] "${preview}..." → ${topic}`);
    return topic;
  }

  // Systems of equations
  if (
    (text.includes('system') && text.includes('equation')) ||
    (text.includes('solve for x and y')) ||
    (text.match(/equation/g) || []).length >= 2
  ) {
    return 'systems-of-equations';
  }

  // Inequalities
  if (text.includes('<') || text.includes('>') || text.includes('inequality')) {
    return 'inequalities';
  }

  // Absolute value
  if (text.includes('|') || text.includes('absolute')) {
    return 'absolute-value';
  }

  // Functions
  if (
    text.includes('f(x)') ||
    text.includes('g(x)') ||
    text.includes('function') ||
    text.includes('domain') ||
    text.includes('range')
  ) {
    return 'functions';
  }

  // Exponents
  if (
    text.match(/\^\d/) ||
    text.includes('exponent') ||
    text.includes('power')
  ) {
    return 'exponents';
  }

  // Radicals
  if (text.includes('√') || text.includes('radical') || text.includes('square root')) {
    return 'radicals';
  }

  // Polynomials
  if (text.includes('polynomial') || text.includes('factor')) {
    return 'polynomials';
  }

  // Word problems
  if (
    text.length > 100 &&
    (text.includes('if') || text.includes('how many') || text.includes('calculate'))
  ) {
    return 'word-problems';
  }

  // Geometry
  if (
    text.includes('triangle') ||
    text.includes('circle') ||
    text.includes('area') ||
    text.includes('perimeter') ||
    text.includes('volume')
  ) {
    return 'geometry';
  }

  // Trigonometry
  if (
    text.includes('sin') ||
    text.includes('cos') ||
    text.includes('tan') ||
    text.includes('angle')
  ) {
    return 'trigonometry';
  }

  // Calculus
  if (
    text.includes('derivative') ||
    text.includes('integral') ||
    text.includes('limit') ||
    text.includes('dx')
  ) {
    return 'calculus';
  }

  // Default to linear equations for simple algebra
  const topic = 'linear-equations';

  // Log classification for debugging
  console.log(`[Topic Classification - Legacy] "${preview}..." → ${topic}`);

  return topic;
}

/**
 * Calculates topic strength (0-1) based on recent attempts
 * Uses exponential moving average weighted by recency
 */
export function calculateTopicStrength(attempts: ProblemAttempt[]): number {
  if (attempts.length === 0) {
    return STRENGTH_THRESHOLDS.DEFAULT; // Default starting strength
  }

  // Sort by most recent first
  const sorted = [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Weight recent attempts more heavily (exponential decay)
  let weightedSum = 0;
  let weightSum = 0;

  sorted.forEach((attempt, index) => {
    const weight = Math.exp(-index * STRENGTH_CALCULATION.DECAY_FACTOR);
    const score = masteryToScore(attempt.mastery_level);
    weightedSum += score * weight;
    weightSum += weight;
  });

  const strength = Math.min(1, Math.max(0, weightedSum / weightSum));

  // Log for debugging
  console.log(`[Strength Calc] ${attempts[0]?.topic}: ${attempts.length} attempts → strength ${strength.toFixed(2)}`);

  return strength;
}

/**
 * Converts mastery level to numeric score
 * Now uses constants from learning-constants
 */
function masteryToScore(mastery: MasteryLevel): number {
  return MASTERY_STRENGTH_SCORES[mastery];
}

/**
 * Analyzes learning progress for a specific topic
 */
export function analyzeTopicProgress(
  topic: MathTopic,
  attempts: ProblemAttempt[],
  topicProgress: TopicProgress | null
): TopicLearningProgress {
  const topicAttempts = attempts.filter((a) => a.topic === topic);

  const strength = calculateTopicStrength(topicAttempts);
  const averageTurns =
    topicAttempts.length > 0
      ? topicAttempts.reduce((sum, a) => sum + a.turns_taken, 0) / topicAttempts.length
      : 0;

  // Determine trend by comparing recent vs older attempts
  const trend = calculateMasteryTrend(topicAttempts);

  return {
    topic,
    strength,
    lastReviewed: topicProgress?.last_reviewed ? new Date(topicProgress.last_reviewed) : null,
    nextReview: topicProgress?.next_review ? new Date(topicProgress.next_review) : null,
    reviewCount: topicProgress?.review_count ?? 0,
    recentAttempts: topicAttempts.slice(0, 5), // Last 5 attempts
    averageTurns,
    masteryTrend: trend,
  };
}

/**
 * Calculates mastery trend (improving, stable, declining)
 */
function calculateMasteryTrend(
  attempts: ProblemAttempt[]
): 'improving' | 'stable' | 'declining' {
  if (attempts.length < 3) return 'stable';

  const sorted = [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const recentAvg = sorted
    .slice(0, 2)
    .reduce((sum, a) => sum + masteryToScore(a.mastery_level), 0) / 2;

  const olderAvg = sorted
    .slice(2, 5)
    .reduce((sum, a) => sum + masteryToScore(a.mastery_level), 0) /
    Math.min(3, sorted.length - 2);

  const diff = recentAvg - olderAvg;

  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

/**
 * Identifies weak topics that need review
 */
export function identifyWeakTopics(
  allProgress: TopicProgress[]
): Array<{ topic: MathTopic; strength: number }> {
  const weak = allProgress
    .filter((p) => p.strength < STRENGTH_THRESHOLDS.WEAK)
    .map((p) => ({
      topic: p.topic as MathTopic,
      strength: p.strength,
    }))
    .sort((a, b) => a.strength - b.strength) // Weakest first
    .slice(0, 5); // Top 5 weakest

  if (weak.length > 0) {
    console.log(`[Weak Topics] Found ${weak.length}:`, weak.map(t => `${t.topic} (${t.strength.toFixed(2)})`));
  }

  return weak;
}

/**
 * Identifies strong topics for confidence building
 */
export function identifyStrongTopics(
  allProgress: TopicProgress[]
): Array<{ topic: MathTopic; strength: number }> {
  const strong = allProgress
    .filter((p) => p.strength >= STRENGTH_THRESHOLDS.STRONG)
    .map((p) => ({
      topic: p.topic as MathTopic,
      strength: p.strength,
    }))
    .sort((a, b) => b.strength - a.strength) // Strongest first
    .slice(0, 5); // Top 5 strongest

  if (strong.length > 0) {
    console.log(`[Strong Topics] Found ${strong.length}:`, strong.map(t => `${t.topic} (${t.strength.toFixed(2)})`));
  }

  return strong;
}

/**
 * Recommends next topic to study based on learning algorithm
 * Balances between reviewing weak topics and building on strong ones
 */
export function recommendNextTopic(
  allProgress: TopicProgress[],
  recentAttempts: ProblemAttempt[]
): MathTopic | null {
  if (allProgress.length === 0) return null;

  // Get topics due for review
  const now = new Date();
  const dueForReview = allProgress.filter((p) => {
    if (!p.next_review) return false;
    return new Date(p.next_review) <= now;
  });

  // Prioritize reviews
  if (dueForReview.length > 0) {
    // Pick the weakest topic due for review
    const weakest = dueForReview.sort((a, b) => a.strength - b.strength)[0];
    return weakest.topic as MathTopic;
  }

  // Otherwise, focus on weak topics
  const weak = identifyWeakTopics(allProgress);
  if (weak.length > 0) {
    return weak[0].topic;
  }

  // If all topics are strong, pick a random one for maintenance
  const randomIndex = Math.floor(Math.random() * allProgress.length);
  return allProgress[randomIndex].topic as MathTopic;
}
