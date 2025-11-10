/**
 * Learning System Type Definitions
 * Defines types for progress tracking, spaced repetition, and learning algorithms
 */

import type { Database } from '@/lib/supabase';

// Database table types
export type ProblemAttempt = Database['public']['Tables']['problem_attempts']['Row'];
export type TopicProgress = Database['public']['Tables']['topic_progress']['Row'];
export type PracticeSession = Database['public']['Tables']['practice_sessions']['Row'];

// Insert types (for creating new records)
export type ProblemAttemptInsert = Database['public']['Tables']['problem_attempts']['Insert'];
export type TopicProgressInsert = Database['public']['Tables']['topic_progress']['Insert'];
export type PracticeSessionInsert = Database['public']['Tables']['practice_sessions']['Insert'];

// Mastery levels
export type MasteryLevel = 'mastered' | 'competent' | 'struggling';

// Topic categories for math problems
export type MathTopic =
  | 'linear-equations'
  | 'quadratic-equations'
  | 'systems-of-equations'
  | 'polynomials'
  | 'exponents'
  | 'radicals'
  | 'rational-expressions'
  | 'inequalities'
  | 'absolute-value'
  | 'functions'
  | 'graphing'
  | 'word-problems'
  | 'geometry'
  | 'trigonometry'
  | 'calculus';

// Spaced repetition intervals (in days)
export interface ReviewSchedule {
  nextReview: Date;
  interval: number; // Days until next review
  easeFactor: number; // SM-2 algorithm ease factor
  reviewCount: number;
}

// Learning progress for a single topic
export interface TopicLearningProgress {
  topic: MathTopic;
  strength: number; // 0-1, where 1 is fully mastered
  lastReviewed: Date | null;
  nextReview: Date | null;
  reviewCount: number;
  recentAttempts: ProblemAttempt[];
  averageTurns: number;
  masteryTrend: 'improving' | 'stable' | 'declining';
}

// Problem generation request
export interface ProblemGenerationRequest {
  type: 'review' | 'mixed' | 'targeted' | 'adaptive';
  topic?: MathTopic;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  userId: string;
}

// Generated problem with metadata
export interface GeneratedProblem {
  problem: string;
  topic: MathTopic;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTurns: number;
  hints: string[];
  solution?: string;
}

// Learning session statistics
export interface SessionStats {
  problemsCompleted: number;
  averageTurns: number;
  topicsCovered: MathTopic[];
  masteryBreakdown: {
    mastered: number;
    competent: number;
    struggling: number;
  };
  timeSpent: number; // minutes
}

// Spaced repetition card
export interface SpacedRepetitionCard {
  topic: MathTopic;
  strength: number;
  interval: number;
  easeFactor: number;
  lastReview: Date | null;
  nextReview: Date;
  reviewCount: number;
}

// Practice session type
export type PracticeSessionType = 'review' | 'mixed' | 'targeted' | 'daily';

// Learning analytics
export interface LearningAnalytics {
  totalProblems: number;
  totalTopics: number;
  averageMasteryLevel: number;
  weakTopics: Array<{ topic: MathTopic; strength: number }>;
  strongTopics: Array<{ topic: MathTopic; strength: number }>;
  reviewsDue: number;
  streakDays: number;
  lastActiveDate: Date;
}
