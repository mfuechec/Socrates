/**
 * Adaptive Initial Intervals for Spaced Repetition
 * Adjusts first review intervals based on user's historical performance
 * High performers get longer initial intervals, struggling students get standard schedule
 */

import type { TopicProgress, ProblemAttempt, MasteryLevel } from '@/types/learning';
import { SM2_PARAMETERS } from './learning-constants';

/**
 * Performance tier for adaptive intervals
 */
export type PerformanceTier = 'high-performer' | 'average' | 'struggling';

/**
 * Calculate user's overall performance tier based on historical data
 *
 * Criteria for HIGH PERFORMER:
 * - Average strength across all topics >= 0.75
 * - At least 70% of attempts are "mastered"
 * - Has attempted at least 5 problems
 *
 * Criteria for STRUGGLING:
 * - Average strength < 0.5
 * - More than 50% of attempts are "struggling"
 *
 * @param topicProgress All topic progress records for the user
 * @param problemAttempts All problem attempts for the user
 * @returns Performance tier classification
 */
export function calculatePerformanceTier(
  topicProgress: TopicProgress[],
  problemAttempts: ProblemAttempt[]
): PerformanceTier {
  // Not enough data - default to average
  if (problemAttempts.length < 5) {
    console.log('[Adaptive Intervals] Insufficient data (<5 attempts), using average tier');
    return 'average';
  }

  // Calculate average strength across all topics
  const avgStrength =
    topicProgress.length > 0
      ? topicProgress.reduce((sum, t) => sum + t.strength, 0) / topicProgress.length
      : 0.5;

  // Calculate mastery distribution
  const masteryCount = problemAttempts.filter((a) => a.mastery_level === 'mastered').length;
  const strugglingCount = problemAttempts.filter((a) => a.mastery_level === 'struggling').length;

  const masteryRate = masteryCount / problemAttempts.length;
  const strugglingRate = strugglingCount / problemAttempts.length;

  console.log(`[Adaptive Intervals] User stats:`);
  console.log(`  Attempts: ${problemAttempts.length}, Avg strength: ${avgStrength.toFixed(2)}`);
  console.log(`  Mastery rate: ${(masteryRate * 100).toFixed(0)}%, Struggling rate: ${(strugglingRate * 100).toFixed(0)}%`);

  // Determine tier
  if (avgStrength >= 0.75 && masteryRate >= 0.7) {
    console.log(`  → HIGH PERFORMER`);
    return 'high-performer';
  } else if (avgStrength < 0.5 || strugglingRate > 0.5) {
    console.log(`  → STRUGGLING`);
    return 'struggling';
  } else {
    console.log(`  → AVERAGE`);
    return 'average';
  }
}

/**
 * Get adaptive initial interval based on performance tier
 *
 * Standard SM-2: First review at 1 day
 * Adaptive approach:
 * - High performers: 3 days (skip day 1, go straight to longer interval)
 * - Average: 1 day (standard)
 * - Struggling: 1 day (standard, need more frequent review)
 *
 * @param tier User's performance tier
 * @param topicStrength Optional specific topic strength for fine-tuning
 * @returns Initial interval in days
 */
export function getAdaptiveInitialInterval(
  tier: PerformanceTier,
  topicStrength?: number
): number {
  let baseInterval: number;

  switch (tier) {
    case 'high-performer':
      baseInterval = 3; // Skip to longer interval
      break;
    case 'struggling':
      baseInterval = 1; // Standard frequent review
      break;
    case 'average':
    default:
      baseInterval = 1; // Standard
      break;
  }

  // Fine-tune based on topic-specific strength if provided
  if (topicStrength !== undefined) {
    if (topicStrength >= 0.8 && baseInterval === 1) {
      // Strong topic even for average performer → boost to 2 days
      baseInterval = 2;
      console.log(`[Adaptive Intervals] Topic strength ${topicStrength.toFixed(2)} → boosted to ${baseInterval} days`);
    } else if (topicStrength < 0.4 && baseInterval === 3) {
      // Weak topic even for high performer → reduce to 2 days
      baseInterval = 2;
      console.log(`[Adaptive Intervals] Topic strength ${topicStrength.toFixed(2)} → reduced to ${baseInterval} days`);
    }
  }

  console.log(`[Adaptive Intervals] Tier ${tier} → initial interval ${baseInterval} days`);

  return baseInterval;
}

/**
 * Get adaptive ease factor based on performance tier
 * High performers start with higher ease factor (faster progression)
 * Struggling students start with lower ease factor (slower, more review)
 *
 * @param tier User's performance tier
 * @returns Initial ease factor
 */
export function getAdaptiveEaseFactor(tier: PerformanceTier): number {
  const baseEaseFactor = SM2_PARAMETERS.INITIAL_EASE_FACTOR; // 2.5

  switch (tier) {
    case 'high-performer':
      return baseEaseFactor + 0.3; // 2.8 - faster progression
    case 'struggling':
      return baseEaseFactor - 0.2; // 2.3 - slower, more reviews
    case 'average':
    default:
      return baseEaseFactor; // 2.5 - standard
  }
}

/**
 * Calculate adaptive schedule for a new topic
 * Combines adaptive initial interval and ease factor
 *
 * @param tier User's performance tier
 * @param mastery First attempt mastery level
 * @param topicStrength Optional topic-specific strength
 * @returns Adaptive review schedule
 */
export function getAdaptiveNewTopicSchedule(
  tier: PerformanceTier,
  mastery: MasteryLevel,
  topicStrength?: number
): {
  interval: number;
  easeFactor: number;
  reviewCount: number;
} {
  const initialInterval = getAdaptiveInitialInterval(tier, topicStrength);
  const easeFactor = getAdaptiveEaseFactor(tier);

  // Adjust based on first attempt mastery
  let interval = initialInterval;

  if (mastery === 'struggling' && initialInterval > 1) {
    // Override adaptive boost if user struggled
    interval = 1;
    console.log(`[Adaptive Intervals] Struggled on first attempt → reset to 1 day`);
  } else if (mastery === 'mastered' && tier === 'high-performer') {
    // Extra boost for high performer who mastered
    interval = Math.max(initialInterval, 3);
    console.log(`[Adaptive Intervals] Mastered + high performer → boosted to ${interval} days`);
  }

  return {
    interval,
    easeFactor,
    reviewCount: 1,
  };
}

/**
 * Check if user should use adaptive intervals (requires minimum history)
 */
export function shouldUseAdaptiveIntervals(
  topicProgress: TopicProgress[],
  problemAttempts: ProblemAttempt[]
): boolean {
  // Require at least 5 attempts and 2 topics to enable adaptive intervals
  const hasEnoughData = problemAttempts.length >= 5 && topicProgress.length >= 2;

  if (!hasEnoughData) {
    console.log(`[Adaptive Intervals] Insufficient data (${problemAttempts.length} attempts, ${topicProgress.length} topics) - using standard intervals`);
  }

  return hasEnoughData;
}
