/**
 * Unit Tests for Spaced Repetition (SM-2 Algorithm)
 * Tests review scheduling, strength updates, and topic prioritization
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateNextReview,
  updateTopicProgressAfterAttempt,
  getTopicsDueForReview,
  prioritizeTopicsForPractice,
} from '../src/lib/spaced-repetition';
import type { TopicProgress } from '../src/types/learning';

describe('calculateNextReview', () => {
  describe('SM-2 algorithm correctness', () => {
    it('should set first review to 1 day', () => {
      const schedule = calculateNextReview(0, 2.5, 5, 0);
      expect(schedule.interval).toBe(1);
      expect(schedule.reviewCount).toBe(1);
    });

    it('should set second review to 6 days', () => {
      const schedule = calculateNextReview(1, 2.5, 5, 1);
      expect(schedule.interval).toBe(6);
      expect(schedule.reviewCount).toBe(2);
    });

    it('should use exponential growth for subsequent reviews', () => {
      // Third review: 6 * easeFactor (2.5 + quality adjustment)
      // With quality=5, easeFactor becomes 2.6, so 6 * 2.6 = 15.6 → rounds to 16
      const schedule = calculateNextReview(6, 2.5, 5, 2);
      expect(schedule.interval).toBe(16);
      expect(schedule.reviewCount).toBe(3);
    });

    it('should reset to 1 day on failed recall (quality < 3)', () => {
      const schedule = calculateNextReview(15, 2.5, 2, 5);
      expect(schedule.interval).toBe(1);
      expect(schedule.reviewCount).toBe(0); // Reset count
    });
  });

  describe('Ease factor adjustments', () => {
    it('should increase ease factor for perfect recall (quality 5)', () => {
      const schedule = calculateNextReview(6, 2.5, 5, 2);
      expect(schedule.easeFactor).toBeGreaterThan(2.5);
    });

    it('should decrease ease factor for difficult recall (quality 3)', () => {
      const schedule = calculateNextReview(6, 2.5, 3, 2);
      expect(schedule.easeFactor).toBeLessThan(2.5);
    });

    it('should enforce minimum ease factor of 1.3', () => {
      const schedule = calculateNextReview(6, 1.3, 0, 2);
      expect(schedule.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('Next review date calculation', () => {
    it('should calculate future date based on interval', () => {
      const now = new Date();
      const schedule = calculateNextReview(0, 2.5, 5, 0);
      const expectedDate = new Date(now.getTime() + 86400000); // +1 day

      const diff = Math.abs(schedule.nextReview.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });
  });
});

describe('updateTopicProgressAfterAttempt', () => {
  it('should initialize new topic with default values', () => {
    const progress = updateTopicProgressAfterAttempt(
      'linear-equations',
      'mastered',
      null
    );

    expect(progress.topic).toBe('linear-equations');
    expect(progress.strength).toBeGreaterThan(0.5); // Mastered should increase from default
    expect(progress.review_count).toBe(1);
    expect(progress.ease_factor).toBeDefined();
    expect(progress.interval_days).toBeDefined();
  });

  it('should update existing topic correctly', () => {
    const existing: TopicProgress = {
      id: '1',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.6,
      review_count: 1,
      ease_factor: 2.5,
      interval_days: 1,
      last_reviewed: new Date(Date.now() - 86400000).toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const progress = updateTopicProgressAfterAttempt(
      'linear-equations',
      'mastered',
      existing
    );

    expect(progress.strength).toBeGreaterThan(existing.strength);
    expect(progress.review_count).toBe(2);
    expect(progress.interval_days).toBe(6); // Second review at 6 days
  });

  it('should decrease strength on struggling attempt', () => {
    const existing: TopicProgress = {
      id: '1',
      user_id: 'user1',
      topic: 'calculus',
      strength: 0.7,
      review_count: 3,
      ease_factor: 2.5,
      interval_days: 15,
      last_reviewed: new Date(Date.now() - 86400000).toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const progress = updateTopicProgressAfterAttempt(
      'calculus',
      'struggling',
      existing
    );

    expect(progress.strength).toBeLessThan(existing.strength);
    expect(progress.review_count).toBe(0); // Reset on struggle
    expect(progress.interval_days).toBe(1); // Reset interval
  });

  it('should keep strength within 0-1 bounds', () => {
    const highStrength: TopicProgress = {
      id: '1',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.95,
      review_count: 5,
      ease_factor: 3.0,
      interval_days: 30,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const progress = updateTopicProgressAfterAttempt(
      'linear-equations',
      'mastered',
      highStrength
    );

    expect(progress.strength).toBeLessThanOrEqual(1.0);
    expect(progress.strength).toBeGreaterThanOrEqual(0.0);
  });
});

describe('getTopicsDueForReview', () => {
  const now = new Date();

  const mockProgress: TopicProgress[] = [
    {
      id: '1',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.7,
      review_count: 3,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date(now.getTime() - 86400000 * 7).toISOString(),
      next_review: new Date(now.getTime() - 86400000 * 1).toISOString(), // Due 1 day ago
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'user1',
      topic: 'quadratic-equations',
      strength: 0.6,
      review_count: 2,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date(now.getTime() - 86400000 * 8).toISOString(),
      next_review: new Date(now.getTime() - 86400000 * 2).toISOString(), // Due 2 days ago
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'user1',
      topic: 'calculus',
      strength: 0.8,
      review_count: 5,
      ease_factor: 2.8,
      interval_days: 15,
      last_reviewed: new Date(now.getTime() - 86400000 * 5).toISOString(),
      next_review: new Date(now.getTime() + 86400000 * 10).toISOString(), // Due in 10 days
      created_at: new Date().toISOString(),
    },
  ];

  it('should identify overdue topics', () => {
    const due = getTopicsDueForReview(mockProgress);
    expect(due.length).toBe(2);
    expect(due.map(t => t.topic)).toContain('linear-equations');
    expect(due.map(t => t.topic)).toContain('quadratic-equations');
  });

  it('should exclude future reviews', () => {
    const due = getTopicsDueForReview(mockProgress);
    expect(due.map(t => t.topic)).not.toContain('calculus');
  });

  it('should sort by most overdue first', () => {
    const due = getTopicsDueForReview(mockProgress);
    // quadratic-equations is due 2 days ago (more overdue than linear-equations at 1 day ago)
    expect(due[0].topic).toBe('quadratic-equations');
    expect(due[1].topic).toBe('linear-equations');
  });

  it('should handle empty progress', () => {
    const due = getTopicsDueForReview([]);
    expect(due.length).toBe(0);
  });
});

describe('prioritizeTopicsForPractice', () => {
  const now = new Date();

  const mockProgress: TopicProgress[] = [
    // Due for review + weak
    {
      id: '1',
      user_id: 'user1',
      topic: 'calculus',
      strength: 0.3,
      review_count: 2,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date(now.getTime() - 86400000 * 7).toISOString(),
      next_review: new Date(now.getTime() - 86400000 * 1).toISOString(),
      created_at: new Date().toISOString(),
    },
    // Due for review + okay
    {
      id: '2',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.7,
      review_count: 3,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date(now.getTime() - 86400000 * 7).toISOString(),
      next_review: new Date(now.getTime() - 86400000 * 1).toISOString(),
      created_at: new Date().toISOString(),
    },
    // Weak but not due
    {
      id: '3',
      user_id: 'user1',
      topic: 'trigonometry',
      strength: 0.4,
      review_count: 1,
      ease_factor: 2.5,
      interval_days: 1,
      last_reviewed: new Date().toISOString(),
      next_review: new Date(now.getTime() + 86400000 * 1).toISOString(),
      created_at: new Date().toISOString(),
    },
    // Strong + not due
    {
      id: '4',
      user_id: 'user1',
      topic: 'geometry',
      strength: 0.9,
      review_count: 8,
      ease_factor: 3.0,
      interval_days: 30,
      last_reviewed: new Date().toISOString(),
      next_review: new Date(now.getTime() + 86400000 * 30).toISOString(),
      created_at: new Date().toISOString(),
    },
    // Medium strength, not due
    {
      id: '5',
      user_id: 'user1',
      topic: 'polynomials',
      strength: 0.65,
      review_count: 4,
      ease_factor: 2.6,
      interval_days: 10,
      last_reviewed: new Date().toISOString(),
      next_review: new Date(now.getTime() + 86400000 * 10).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  it('should prioritize due topics first', () => {
    const topics = prioritizeTopicsForPractice(mockProgress, 3);
    expect(topics).toContain('calculus');
    expect(topics).toContain('linear-equations');
  });

  it('should include weak topics', () => {
    const topics = prioritizeTopicsForPractice(mockProgress, 5);
    expect(topics).toContain('trigonometry'); // Weak (0.4)
  });

  it('should limit to requested count', () => {
    const topics = prioritizeTopicsForPractice(mockProgress, 3);
    expect(topics.length).toBeLessThanOrEqual(3);
  });

  it('should return unique topics (no duplicates)', () => {
    const topics = prioritizeTopicsForPractice(mockProgress, 10);
    const uniqueTopics = new Set(topics);
    expect(topics.length).toBe(uniqueTopics.size);
  });

  it('should shuffle topics for variety', () => {
    const topics1 = prioritizeTopicsForPractice(mockProgress, 5);
    const topics2 = prioritizeTopicsForPractice(mockProgress, 5);
    // May be different order (shuffled)
    // But should contain same priority topics
    expect(topics1).toContain('calculus');
    expect(topics2).toContain('calculus');
  });

  it('should handle requesting more topics than available', () => {
    const topics = prioritizeTopicsForPractice(mockProgress, 20);
    expect(topics.length).toBe(mockProgress.length); // Max out at available
  });
});
