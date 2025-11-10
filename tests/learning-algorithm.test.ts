/**
 * Unit Tests for Learning Algorithms
 * Tests mastery calculation, topic inference, and strength calculations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  calculateMasteryLevel,
  inferTopic,
  calculateTopicStrength,
  identifyWeakTopics,
  identifyStrongTopics,
} from '../src/lib/learning-algorithm';
import type { SolutionPath } from '../src/types/solution-path';
import type { ProblemAttempt, TopicProgress } from '../src/types/learning';

// Mock solution paths for testing
const mockSimpleSolutionPath: SolutionPath = {
  problemStatement: 'Solve 2x + 5 = 13',
  problemType: 'Linear Equation',
  approaches: [
    {
      name: 'Standard Algebraic Method',
      steps: [
        {
          stepNumber: 1,
          action: 'Subtract 5 from both sides',
          reasoning: 'To isolate the term with x',
          hints: {
            level1: 'What operations are applied to x?',
            level2: 'We multiply by 2, then add 5. Which to undo first?',
            level3: 'Subtract 5 from both sides. What is 13 - 5?',
          },
        },
        {
          stepNumber: 2,
          action: 'Divide both sides by 2',
          reasoning: 'To get x alone',
          hints: {
            level1: 'What is still attached to x?',
            level2: 'x is multiplied by 2. What operation undoes multiplication?',
            level3: 'Divide both sides by 2. What is 8 ÷ 2?',
          },
        },
      ],
    },
  ],
  recommendedApproachIndex: 0,
  requiredConcepts: ['Inverse Operations', 'Order of Operations'],
  generatedAt: new Date(),
};

const mockComplexSolutionPath: SolutionPath = {
  problemStatement: 'Solve the system: 2x + 3y = 8 and 4x - y = 5',
  problemType: 'System of Linear Equations',
  approaches: [
    {
      name: 'Elimination Method',
      steps: [
        { stepNumber: 1, action: 'Step 1', reasoning: 'Reason 1', hints: { level1: 'H1', level2: 'H2', level3: 'H3' } },
        { stepNumber: 2, action: 'Step 2', reasoning: 'Reason 2', hints: { level1: 'H1', level2: 'H2', level3: 'H3' } },
        { stepNumber: 3, action: 'Step 3', reasoning: 'Reason 3', hints: { level1: 'H1', level2: 'H2', level3: 'H3' } },
        { stepNumber: 4, action: 'Step 4', reasoning: 'Reason 4', hints: { level1: 'H1', level2: 'H2', level3: 'H3' } },
        { stepNumber: 5, action: 'Step 5', reasoning: 'Reason 5', hints: { level1: 'H1', level2: 'H2', level3: 'H3' } },
      ],
    },
  ],
  recommendedApproachIndex: 0,
  requiredConcepts: ['Systems of Equations', 'Elimination Method'],
  generatedAt: new Date(),
};

describe('calculateMasteryLevel', () => {
  describe('Basic (legacy) calculation', () => {
    it('should classify as mastered for ≤5 turns', () => {
      expect(calculateMasteryLevel(3)).toBe('mastered');
      expect(calculateMasteryLevel(5)).toBe('mastered');
    });

    it('should classify as competent for 6-10 turns', () => {
      expect(calculateMasteryLevel(6)).toBe('competent');
      expect(calculateMasteryLevel(10)).toBe('competent');
    });

    it('should classify as struggling for >10 turns', () => {
      expect(calculateMasteryLevel(11)).toBe('struggling');
      expect(calculateMasteryLevel(20)).toBe('struggling');
    });
  });

  describe('Problem-type adjusted calculation', () => {
    it('should adjust thresholds for easy problems', () => {
      // Linear Equation: multiplier 1.0, thresholds 5/10
      expect(calculateMasteryLevel(5, 'Linear Equation')).toBe('mastered');
      expect(calculateMasteryLevel(10, 'Linear Equation')).toBe('competent');
    });

    it('should adjust thresholds for hard problems', () => {
      // Calculus: multiplier 2.0, thresholds 10/20
      expect(calculateMasteryLevel(10, 'Calculus')).toBe('mastered');
      expect(calculateMasteryLevel(15, 'Calculus')).toBe('competent');
      expect(calculateMasteryLevel(21, 'Calculus')).toBe('struggling');
    });

    it('should handle moderate difficulty', () => {
      // Quadratic Equation: multiplier 1.3, thresholds ~7/13
      expect(calculateMasteryLevel(6, 'Quadratic Equation')).toBe('mastered');
      expect(calculateMasteryLevel(12, 'Quadratic Equation')).toBe('competent');
    });
  });

  describe('Step-based calculation', () => {
    it('should calculate mastery based on step count', () => {
      // 2 steps, expected ~4 turns
      // 4 turns: efficiency 100% → mastered
      expect(calculateMasteryLevel(4, undefined, mockSimpleSolutionPath, 0)).toBe('mastered');
    });

    it('should classify as mastered when within 20% of expected', () => {
      // 2 steps, expected 4 turns
      // 5 turns: efficiency 80% → mastered
      expect(calculateMasteryLevel(5, undefined, mockSimpleSolutionPath, 0)).toBe('mastered');
    });

    it('should classify as competent when within 50% of expected', () => {
      // 2 steps, expected 4 turns
      // 7 turns: efficiency 57% → competent
      expect(calculateMasteryLevel(7, undefined, mockSimpleSolutionPath, 0)).toBe('competent');
    });

    it('should classify as struggling when below 50% efficiency', () => {
      // 2 steps, expected 4 turns
      // 10 turns: efficiency 40% → struggling
      expect(calculateMasteryLevel(10, undefined, mockSimpleSolutionPath, 0)).toBe('struggling');
    });

    it('should handle complex problems with many steps', () => {
      // 5 steps, expected ~10 turns
      // 12 turns: efficiency 83% → mastered
      expect(calculateMasteryLevel(12, undefined, mockComplexSolutionPath, 0)).toBe('mastered');
    });
  });
});

describe('inferTopic', () => {
  it('should classify linear equations', () => {
    expect(inferTopic('Solve for x: 2x + 5 = 13')).toBe('linear-equations');
    expect(inferTopic('Find x: 3x - 7 = 11')).toBe('linear-equations');
  });

  it('should classify quadratic equations', () => {
    expect(inferTopic('Solve x² - 5x + 6 = 0')).toBe('quadratic-equations');
    expect(inferTopic('Find the vertex of the parabola')).toBe('quadratic-equations');
  });

  it('should classify inequalities (high priority)', () => {
    expect(inferTopic('Solve 2x + 5 < 13')).toBe('inequalities');
    expect(inferTopic('Solve the inequality x² > 4')).toBe('inequalities');
  });

  it('should classify systems of equations', () => {
    expect(inferTopic('Solve the system: 2x + y = 5 and x - y = 1')).toBe('systems-of-equations');
    expect(inferTopic('Solve for x and y: 3x + 2y = 7 and x - y = 2')).toBe('systems-of-equations');
  });

  it('should classify calculus problems', () => {
    expect(inferTopic('Find the derivative of f(x) = x² + 3x')).toBe('calculus');
    expect(inferTopic('Evaluate the integral of 2x dx')).toBe('calculus');
    expect(inferTopic('Calculate the limit as x approaches 0')).toBe('calculus');
  });

  it('should classify trigonometry', () => {
    expect(inferTopic('Find sin(30°)')).toBe('trigonometry');
    expect(inferTopic('Solve for the angle using cos')).toBe('trigonometry');
  });

  it('should classify geometry', () => {
    expect(inferTopic('Find the area of a triangle with base 5 and height 3')).toBe('geometry');
    expect(inferTopic('Calculate the perimeter of a circle')).toBe('geometry');
  });

  it('should handle ambiguous problems with weighted scoring', () => {
    // Should prioritize inequality over quadratic
    const topic = inferTopic('Solve the quadratic inequality x² - 4 > 0');
    expect(topic).toBe('inequalities');
  });

  it('should default to linear-equations for unclear problems', () => {
    expect(inferTopic('Solve for the variable')).toBe('linear-equations');
  });
});

describe('calculateTopicStrength', () => {
  const mockAttempts: ProblemAttempt[] = [
    {
      id: '1',
      user_id: 'user1',
      problem_text: 'Problem 1',
      topic: 'linear-equations',
      mastery_level: 'mastered',
      turns_taken: 4,
      created_at: new Date(Date.now() - 86400000 * 0).toISOString(), // Today
    },
    {
      id: '2',
      user_id: 'user1',
      problem_text: 'Problem 2',
      topic: 'linear-equations',
      mastery_level: 'mastered',
      turns_taken: 3,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    },
    {
      id: '3',
      user_id: 'user1',
      problem_text: 'Problem 3',
      topic: 'linear-equations',
      mastery_level: 'competent',
      turns_taken: 8,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    },
  ];

  it('should return default strength for no attempts', () => {
    expect(calculateTopicStrength([])).toBe(0.5);
  });

  it('should calculate strength for single attempt', () => {
    const strength = calculateTopicStrength([mockAttempts[0]]);
    expect(strength).toBeGreaterThan(0.8); // Mastered = 1.0
  });

  it('should weight recent attempts more heavily', () => {
    const strength = calculateTopicStrength(mockAttempts);
    // Recent mastered attempts should dominate
    expect(strength).toBeGreaterThan(0.75);
  });

  it('should handle struggling attempts', () => {
    const strugglingAttempts: ProblemAttempt[] = [
      { ...mockAttempts[0], mastery_level: 'struggling', turns_taken: 15 },
      { ...mockAttempts[1], mastery_level: 'struggling', turns_taken: 18 },
    ];
    const strength = calculateTopicStrength(strugglingAttempts);
    expect(strength).toBeLessThan(0.4); // Struggling = 0.3
  });

  it('should be bounded between 0 and 1', () => {
    const strength = calculateTopicStrength(mockAttempts);
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(1);
  });
});

describe('identifyWeakTopics', () => {
  const mockProgress: TopicProgress[] = [
    {
      id: '1',
      user_id: 'user1',
      topic: 'calculus',
      strength: 0.3,
      review_count: 2,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'user1',
      topic: 'quadratic-equations',
      strength: 0.5,
      review_count: 3,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.85,
      review_count: 5,
      ease_factor: 2.8,
      interval_days: 15,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  it('should identify topics below 0.6 strength', () => {
    const weak = identifyWeakTopics(mockProgress);
    expect(weak.length).toBe(2);
    expect(weak[0].topic).toBe('calculus'); // Weakest first
    expect(weak[1].topic).toBe('quadratic-equations');
  });

  it('should sort weakest first', () => {
    const weak = identifyWeakTopics(mockProgress);
    expect(weak[0].strength).toBeLessThan(weak[1].strength);
  });

  it('should limit to 5 topics', () => {
    const manyWeak = Array(10).fill(null).map((_, i) => ({
      ...mockProgress[0],
      id: `${i}`,
      topic: `topic-${i}`,
      strength: 0.3 + (i * 0.02),
    }));
    const weak = identifyWeakTopics(manyWeak as TopicProgress[]);
    expect(weak.length).toBeLessThanOrEqual(5);
  });

  it('should return empty array if no weak topics', () => {
    const strongProgress = mockProgress.map(p => ({ ...p, strength: 0.9 }));
    const weak = identifyWeakTopics(strongProgress);
    expect(weak.length).toBe(0);
  });
});

describe('identifyStrongTopics', () => {
  const mockProgress: TopicProgress[] = [
    {
      id: '1',
      user_id: 'user1',
      topic: 'linear-equations',
      strength: 0.95,
      review_count: 8,
      ease_factor: 3.0,
      interval_days: 30,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'user1',
      topic: 'quadratic-equations',
      strength: 0.85,
      review_count: 6,
      ease_factor: 2.7,
      interval_days: 20,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'user1',
      topic: 'calculus',
      strength: 0.5,
      review_count: 2,
      ease_factor: 2.5,
      interval_days: 6,
      last_reviewed: new Date().toISOString(),
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  it('should identify topics above 0.8 strength', () => {
    const strong = identifyStrongTopics(mockProgress);
    expect(strong.length).toBe(2);
  });

  it('should sort strongest first', () => {
    const strong = identifyStrongTopics(mockProgress);
    expect(strong[0].strength).toBeGreaterThan(strong[1].strength);
    expect(strong[0].topic).toBe('linear-equations');
  });

  it('should return empty array if no strong topics', () => {
    const weakProgress = mockProgress.map(p => ({ ...p, strength: 0.5 }));
    const strong = identifyStrongTopics(weakProgress);
    expect(strong.length).toBe(0);
  });
});
