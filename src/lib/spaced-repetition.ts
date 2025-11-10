/**
 * Spaced Repetition System (SM-2 Algorithm)
 * Implements the SuperMemo 2 algorithm for optimal review scheduling
 * Based on: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

import type {
  MasteryLevel,
  MathTopic,
  ReviewSchedule,
  SpacedRepetitionCard,
  TopicProgress,
} from '@/types/learning';
import {
  SM2_PARAMETERS,
  MASTERY_QUALITY_SCORES,
  STRENGTH_CALCULATION,
  STRENGTH_THRESHOLDS,
} from './learning-constants';

// SM-2 Algorithm constants (imported from learning-constants)
const MIN_EASE_FACTOR = SM2_PARAMETERS.MIN_EASE_FACTOR;
const INITIAL_EASE_FACTOR = SM2_PARAMETERS.INITIAL_EASE_FACTOR;
const EASE_FACTOR_MODIFIER = SM2_PARAMETERS.EASE_FACTOR_MODIFIER;

/**
 * Converts mastery level to quality rating (0-5)
 * Used for SM-2 algorithm
 */
function masteryToQuality(mastery: MasteryLevel): number {
  return MASTERY_QUALITY_SCORES[mastery];
}

/**
 * Calculates next review schedule using SM-2 algorithm
 * @param currentInterval Current interval in days
 * @param currentEaseFactor Current ease factor
 * @param quality Quality of recall (0-5)
 * @param reviewCount Number of times reviewed
 * @returns Updated review schedule
 */
export function calculateNextReview(
  currentInterval: number,
  currentEaseFactor: number,
  quality: number,
  reviewCount: number
): ReviewSchedule {
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;

  // Update ease factor based on quality
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next interval
  if (quality < 3) {
    // Failed recall - reset to 1 day
    interval = 1;
  } else {
    // Successful recall - increase interval
    if (reviewCount === 0) {
      interval = 1;
    } else if (reviewCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    nextReview,
    interval,
    easeFactor,
    reviewCount: quality >= 3 ? reviewCount + 1 : 0, // Reset count on failure
  };
}

/**
 * Updates topic progress based on problem attempt
 * NOW PERSISTS: ease_factor and interval_days for complete SM-2 state
 */
export function updateTopicProgressAfterAttempt(
  topic: MathTopic,
  mastery: MasteryLevel,
  currentProgress: TopicProgress | null
): Partial<TopicProgress> {
  const quality = masteryToQuality(mastery);

  // Use persisted values from database, or defaults for new topics
  const currentInterval = currentProgress?.interval_days ?? SM2_PARAMETERS.FIRST_INTERVAL;
  const currentEaseFactor = currentProgress?.ease_factor ?? INITIAL_EASE_FACTOR;
  const reviewCount = currentProgress?.review_count ?? 0;

  const schedule = calculateNextReview(
    currentInterval,
    currentEaseFactor,
    quality,
    reviewCount
  );

  // Update strength based on mastery
  const currentStrength = currentProgress?.strength ?? STRENGTH_THRESHOLDS.DEFAULT;
  const masteryScore = quality / 5; // Normalize to 0-1
  const newStrength =
    currentStrength * STRENGTH_CALCULATION.CURRENT_WEIGHT +
    masteryScore * STRENGTH_CALCULATION.NEW_WEIGHT;

  // Log SM-2 state change for debugging
  console.log(`[SM-2 Update] Topic: ${topic}`);
  console.log(`  Mastery: ${mastery} (quality: ${quality})`);
  console.log(`  Ease Factor: ${currentEaseFactor.toFixed(2)} → ${schedule.easeFactor.toFixed(2)}`);
  console.log(`  Interval: ${currentInterval} days → ${schedule.interval} days`);
  console.log(`  Next Review: ${schedule.nextReview.toISOString().split('T')[0]}`);
  console.log(`  Strength: ${currentStrength.toFixed(2)} → ${newStrength.toFixed(2)}`);

  return {
    topic,
    strength: Math.max(0, Math.min(1, newStrength)),
    review_count: schedule.reviewCount,
    ease_factor: schedule.easeFactor, // ⭐ NOW PERSISTED
    interval_days: schedule.interval,  // ⭐ NOW PERSISTED
    last_reviewed: new Date().toISOString(),
    next_review: schedule.nextReview.toISOString(),
  };
}

/**
 * Gets all topics due for review
 */
export function getTopicsDueForReview(
  allProgress: TopicProgress[]
): TopicProgress[] {
  const now = new Date();

  return allProgress.filter((progress) => {
    if (!progress.next_review) return false;
    const nextReview = new Date(progress.next_review);
    return nextReview <= now;
  }).sort((a, b) => {
    // Sort by urgency (most overdue first)
    const aDate = new Date(a.next_review!);
    const bDate = new Date(b.next_review!);
    return aDate.getTime() - bDate.getTime();
  });
}

/**
 * Gets topics that will be due soon (in next N days)
 */
export function getUpcomingReviews(
  allProgress: TopicProgress[],
  daysAhead: number = 7
): TopicProgress[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return allProgress.filter((progress) => {
    if (!progress.next_review) return false;
    const nextReview = new Date(progress.next_review);
    return nextReview > now && nextReview <= futureDate;
  }).sort((a, b) => {
    const aDate = new Date(a.next_review!);
    const bDate = new Date(b.next_review!);
    return aDate.getTime() - bDate.getTime();
  });
}

/**
 * Calculates optimal study session length
 * Returns number of problems to solve based on current progress
 */
export function calculateOptimalSessionLength(
  dueTopics: TopicProgress[],
  userHistory: { totalProblems: number; averageSessionLength: number }
): number {
  // Base on number of due reviews
  let sessionLength = Math.min(dueTopics.length, 10); // Cap at 10

  // If no reviews due, recommend maintenance practice
  if (sessionLength === 0) {
    sessionLength = 3; // Small maintenance session
  }

  // Adjust based on user's average session length
  if (userHistory.averageSessionLength > 0) {
    sessionLength = Math.round(
      (sessionLength + userHistory.averageSessionLength) / 2
    );
  }

  return Math.max(1, Math.min(15, sessionLength)); // Between 1 and 15
}

/**
 * Determines if topic needs immediate review (lapsed)
 * A topic is lapsed if it's overdue by more than 2x the interval
 */
export function isTopicLapsed(progress: TopicProgress): boolean {
  if (!progress.next_review) return false;

  const now = new Date();
  const nextReview = new Date(progress.next_review);
  const overdueDays = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);

  // Get the last interval (approximate from review count)
  const approximateInterval = progress.review_count === 0 ? 1 :
                              progress.review_count === 1 ? 6 :
                              6 * Math.pow(INITIAL_EASE_FACTOR, progress.review_count - 1);

  return overdueDays > approximateInterval * 2;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Enforce topic spacing (no duplicate topics in session)
 * Prevents blocked practice, encourages interleaving
 */
function enforceTopicSpacing(topics: MathTopic[]): MathTopic[] {
  const spaced: MathTopic[] = [];
  const used = new Set<MathTopic>();

  // First pass: add unique topics
  for (const topic of topics) {
    if (!used.has(topic)) {
      spaced.push(topic);
      used.add(topic);
    }
  }

  // Shuffle to avoid predictable order
  const shuffled = shuffleArray(spaced);

  console.log(`[Topic Spacing] Removed ${topics.length - spaced.length} duplicates, shuffled ${spaced.length} unique topics`);

  return shuffled;
}

/**
 * Prioritizes topics for a mixed practice session
 * Balances between due reviews, weak topics, and variety
 * NOW INCLUDES: Topic spacing to prevent duplicates
 */
export function prioritizeTopicsForPractice(
  allProgress: TopicProgress[],
  count: number
): MathTopic[] {
  const dueTopics = getTopicsDueForReview(allProgress);
  const weakTopics = allProgress
    .filter((p) => p.strength < 0.6)
    .sort((a, b) => a.strength - b.strength);

  const selected: MathTopic[] = [];

  // 1. Add all due topics (up to half the count)
  const dueCount = Math.min(dueTopics.length, Math.ceil(count / 2));
  selected.push(...dueTopics.slice(0, dueCount).map((p) => p.topic as MathTopic));

  console.log(`[Practice Prioritization] Added ${dueCount} due topics`);

  // 2. Fill remaining with weak topics
  let weakAdded = 0;
  for (const weak of weakTopics) {
    if (selected.length >= count) break;
    if (!selected.includes(weak.topic as MathTopic)) {
      selected.push(weak.topic as MathTopic);
      weakAdded++;
    }
  }

  console.log(`[Practice Prioritization] Added ${weakAdded} weak topics`);

  // 3. If still need more, add random topics for variety
  const remaining = allProgress.filter(
    (p) => !selected.includes(p.topic as MathTopic)
  );

  let randomAdded = 0;
  while (selected.length < count && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex].topic as MathTopic);
    remaining.splice(randomIndex, 1);
    randomAdded++;
  }

  console.log(`[Practice Prioritization] Added ${randomAdded} random topics for variety`);
  console.log(`[Practice Prioritization] Total selected: ${selected.length} topics`);

  // Enforce spacing (remove duplicates, shuffle)
  return enforceTopicSpacing(selected);
}

/**
 * Creates a spaced repetition card from topic progress
 */
export function createSRCard(progress: TopicProgress): SpacedRepetitionCard {
  // Approximate interval from review count
  const interval = progress.review_count === 0 ? 1 :
                   progress.review_count === 1 ? 6 :
                   6 * Math.pow(INITIAL_EASE_FACTOR, progress.review_count - 1);

  return {
    topic: progress.topic as MathTopic,
    strength: progress.strength,
    interval: Math.round(interval),
    easeFactor: INITIAL_EASE_FACTOR, // Simplified - would need to store this
    lastReview: progress.last_reviewed ? new Date(progress.last_reviewed) : null,
    nextReview: new Date(progress.next_review!),
    reviewCount: progress.review_count,
  };
}
