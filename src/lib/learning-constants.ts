/**
 * Learning Algorithm Constants
 * Centralized configuration for all learning algorithm parameters
 * Makes tuning and A/B testing easier
 */

/**
 * Mastery Level Thresholds
 * Based on number of conversation turns taken to solve a problem
 */
export const MASTERY_THRESHOLDS = {
  /** Turns threshold for "mastered" classification (≤ this value) */
  MASTERED: parseInt(process.env.MASTERY_TURN_THRESHOLD || '5'),

  /** Turns threshold for "competent" classification (≤ this value) */
  COMPETENT: parseInt(process.env.COMPETENT_TURN_THRESHOLD || '10'),

  /** Above this threshold = "struggling" */
  // (Implicit: > COMPETENT)
} as const;

/**
 * Topic Strength Thresholds
 * Strength scores range from 0.0 (forgotten) to 1.0 (perfect retention)
 */
export const STRENGTH_THRESHOLDS = {
  /** Topics below this strength are considered "weak" and prioritized for review */
  WEAK: parseFloat(process.env.WEAK_TOPIC_THRESHOLD || '0.6'),

  /** Topics above this strength are considered "strong" (mastered) */
  STRONG: parseFloat(process.env.STRONG_TOPIC_THRESHOLD || '0.8'),

  /** Default starting strength for new topics */
  DEFAULT: parseFloat(process.env.DEFAULT_STRENGTH || '0.5'),
} as const;

/**
 * Strength Calculation Parameters
 * Used in exponential moving average calculation
 */
export const STRENGTH_CALCULATION = {
  /** Decay factor for exponential weighting (higher = faster decay of old attempts) */
  DECAY_FACTOR: parseFloat(process.env.STRENGTH_DECAY_FACTOR || '0.2'),

  /** Weight for current strength vs new mastery score in strength updates */
  CURRENT_WEIGHT: 0.7,
  NEW_WEIGHT: 0.3,
} as const;

/**
 * Spaced Repetition (SM-2 Algorithm) Parameters
 */
export const SM2_PARAMETERS = {
  /** Minimum ease factor (prevents intervals from becoming too short) */
  MIN_EASE_FACTOR: 1.3,

  /** Initial ease factor for new topics */
  INITIAL_EASE_FACTOR: 2.5,

  /** Ease factor adjustment per quality rating */
  EASE_FACTOR_MODIFIER: 0.1,

  /** Quality threshold for successful recall (≥ this = success) */
  SUCCESS_QUALITY_THRESHOLD: 3,

  /** First review interval (days) */
  FIRST_INTERVAL: 1,

  /** Second review interval (days) */
  SECOND_INTERVAL: 6,
} as const;

/**
 * Mastery to Quality Score Mapping
 * Used in SM-2 algorithm for calculating intervals
 */
export const MASTERY_QUALITY_SCORES = {
  mastered: 5,   // Perfect response
  competent: 3,  // Correct with hesitation
  struggling: 1, // Incorrect but remembered
} as const;

/**
 * Mastery to Numeric Strength Score Mapping
 * Used in strength calculations
 */
export const MASTERY_STRENGTH_SCORES = {
  mastered: 1.0,   // 100% retention
  competent: 0.6,  // 60% retention
  struggling: 0.3, // 30% retention
} as const;

/**
 * Mixed Practice Session Parameters
 */
export const MIXED_PRACTICE = {
  /** Minimum number of problems in a session */
  MIN_PROBLEMS: 5,

  /** Maximum number of problems in a session */
  MAX_PROBLEMS: 10,

  /** Percentage of session that should be due reviews (0-1) */
  DUE_REVIEW_PERCENTAGE: 0.5,

  /** Maximum weak topics to include in a session */
  MAX_WEAK_TOPICS: 5,
} as const;

/**
 * Topic Prioritization Weights
 * Used when selecting topics for mixed practice
 */
export const TOPIC_PRIORITY_WEIGHTS = {
  /** Weight for topics due for review */
  DUE_REVIEW: 3.0,

  /** Weight for weak topics (low strength) */
  WEAK_TOPIC: 2.0,

  /** Weight for lapsed topics (overdue by >2x interval) */
  LAPSED_TOPIC: 4.0,

  /** Weight for random topics (variety) */
  RANDOM_TOPIC: 1.0,
} as const;

/**
 * Lapse Detection Parameters
 */
export const LAPSE_DETECTION = {
  /** Multiplier for determining if a topic is lapsed (overdue by this many intervals) */
  LAPSE_MULTIPLIER: 2.0,

  /** Minor overdue threshold (percentage of interval, e.g., 0.5 = 50%) */
  MINOR_OVERDUE_THRESHOLD: 0.5,

  /** Interval reset for minor overdue (percentage of original, e.g., 0.8 = 80%) */
  MINOR_RESET_FACTOR: 0.8,

  /** Interval reset for moderate lapse (percentage of original) */
  MODERATE_RESET_FACTOR: 0.5,

  /** Interval reset for major lapse (back to day 1) */
  MAJOR_RESET_INTERVAL: 1,
} as const;

/**
 * Problem Difficulty Multipliers
 * Used for adjusting mastery thresholds based on problem type
 */
export const DIFFICULTY_MULTIPLIERS = {
  'Linear Equation': 1.0,
  'Quadratic Equation': 1.3,
  'System of Equations': 1.5,
  'System of Linear Equations': 1.5,
  'Polynomial': 1.4,
  'Rational Expression': 1.6,
  'Inequality': 1.2,
  'Absolute Value': 1.3,
  'Function': 1.4,
  'Graphing': 1.5,
  'Word Problem': 1.7,
  'Geometry': 1.6,
  'Trigonometry': 1.8,
  'Calculus': 2.0,
} as const;

/**
 * Validation Helpers
 */

export function isValidStrength(strength: number): boolean {
  return strength >= 0 && strength <= 1;
}

export function isValidQuality(quality: number): boolean {
  return quality >= 0 && quality <= 5;
}

export function isValidEaseFactor(easeFactor: number): boolean {
  return easeFactor >= SM2_PARAMETERS.MIN_EASE_FACTOR;
}

/**
 * Helper: Get difficulty multiplier for a problem type
 */
export function getDifficultyMultiplier(problemType: string): number {
  return DIFFICULTY_MULTIPLIERS[problemType as keyof typeof DIFFICULTY_MULTIPLIERS] ?? 1.0;
}
