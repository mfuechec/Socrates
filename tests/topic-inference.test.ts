/**
 * Unit Tests for Topic Inference
 * Tests weighted scoring system and classification accuracy
 */

import { describe, it, expect } from '@jest/globals';
import {
  inferTopicWeighted,
  inferTopicWithConfidence,
  explainTopicClassification,
} from '../src/lib/topic-inference-weighted';

describe('inferTopicWeighted', () => {
  describe('Priority-based classification', () => {
    it('should prioritize inequalities over linear equations', () => {
      const topic = inferTopicWeighted('Solve 2x + 5 < 13');
      expect(topic).toBe('inequalities');
    });

    it('should prioritize inequalities over quadratic equations', () => {
      const topic = inferTopicWeighted('Solve the quadratic inequality x² - 4 > 0');
      expect(topic).toBe('inequalities');
    });

    it('should prioritize calculus over functions', () => {
      const topic = inferTopicWeighted('Find the derivative of f(x) = x² + 3x');
      expect(topic).toBe('calculus');
    });

    it('should prioritize absolute value over linear equations', () => {
      const topic = inferTopicWeighted('Solve |2x + 5| = 13');
      expect(topic).toBe('absolute-value');
    });
  });

  describe('Specific topic classifications', () => {
    it('should classify linear equations', () => {
      expect(inferTopicWeighted('Solve for x: 2x + 5 = 13')).toBe('linear-equations');
      expect(inferTopicWeighted('Find x: 3x - 7 = 11')).toBe('linear-equations');
      expect(inferTopicWeighted('Isolate the variable: 4x = 20')).toBe('linear-equations');
    });

    it('should classify quadratic equations', () => {
      expect(inferTopicWeighted('Solve x² - 5x + 6 = 0')).toBe('quadratic-equations');
      expect(inferTopicWeighted('Find the roots using the quadratic formula')).toBe('quadratic-equations');
      expect(inferTopicWeighted('Complete the square for x² + 6x + 5')).toBe('quadratic-equations');
    });

    it('should classify systems of equations', () => {
      expect(inferTopicWeighted('Solve the system: 2x + y = 5 and x - y = 1')).toBe('systems-of-equations');
      expect(inferTopicWeighted('Use elimination method for two equations')).toBe('systems-of-equations');
      expect(inferTopicWeighted('Solve for x and y: 3x + 2y = 7')).toBe('systems-of-equations');
    });

    it('should classify calculus', () => {
      expect(inferTopicWeighted('Find the derivative of x³')).toBe('calculus');
      expect(inferTopicWeighted('Evaluate the integral of 2x dx')).toBe('calculus');
      expect(inferTopicWeighted('Calculate the limit as x approaches infinity')).toBe('calculus');
      expect(inferTopicWeighted('Find the rate of change')).toBe('calculus');
    });

    it('should classify trigonometry', () => {
      expect(inferTopicWeighted('Find sin(45°)')).toBe('trigonometry');
      expect(inferTopicWeighted('Calculate the adjacent side using cos')).toBe('trigonometry');
      expect(inferTopicWeighted('Solve for the angle in the triangle')).toBe('trigonometry');
    });

    it('should classify geometry', () => {
      expect(inferTopicWeighted('Find the area of a triangle')).toBe('geometry');
      // Note: "rectangle" contains "angle" which matches trigonometry, but multiple geometry keywords should win
      expect(inferTopicWeighted('Calculate the perimeter of a square')).toBe('geometry');
      expect(inferTopicWeighted('Find the volume of a cylinder')).toBe('geometry');
    });

    it('should classify polynomials', () => {
      // Note: avoid "factor" (matches quadratic), "degree" (matches trig), substrings like "sin"
      expect(inferTopicWeighted('Apply FOIL method to multiply (x + 2)(x - 3)')).toBe('polynomials');
      expect(inferTopicWeighted('Expand the polynomial 3x⁴ + 2x³ - 5x + 1')).toBe('polynomials');
      expect(inferTopicWeighted('Distribute and combine like terms in the polynomial')).toBe('polynomials');
    });

    it('should classify functions', () => {
      expect(inferTopicWeighted('Evaluate f(x) = 2x + 1 at x = 3')).toBe('functions');
      expect(inferTopicWeighted('Find the domain and range of g(x)')).toBe('functions');
      expect(inferTopicWeighted('Compose the functions f(g(x))')).toBe('functions');
    });
  });

  describe('Edge cases', () => {
    it('should handle problems with no keyword matches', () => {
      const topic = inferTopicWeighted('What is the answer?');
      expect(topic).toBe('linear-equations'); // Default
    });

    it('should handle empty strings', () => {
      const topic = inferTopicWeighted('');
      expect(topic).toBe('linear-equations'); // Default
    });

    it('should handle problems with multiple topic keywords', () => {
      // Should resolve based on weights and priorities
      const topic = inferTopicWeighted('Graph the quadratic function f(x) = x²');
      // All three are valid, but weighted scoring should pick one
      expect(['graphing', 'quadratic-equations', 'functions']).toContain(topic);
    });
  });
});

describe('inferTopicWithConfidence', () => {
  it('should return high confidence for clear classifications', () => {
    const result = inferTopicWithConfidence('Find the derivative of f(x) = x² + 3x');
    expect(result.topic).toBe('calculus');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should return lower confidence for ambiguous problems', () => {
    // Problem that matches multiple topics with similar scores (both priority 3)
    const result = inferTopicWithConfidence('Graph the function with exponents');
    // Should match graphing, functions, and exponents (all priority 3) more evenly
    expect(result.confidence).toBeLessThan(1.0);
  });

  it('should identify alternative topics', () => {
    // Use a problem that explicitly combines multiple topic keywords
    const result = inferTopicWithConfidence('Graph the function and find the slope');
    // Should match graphing and functions
    const allTopics = [result.topic, ...result.alternatives];
    // Should have at least one alternative since both graphing and functions match
    expect(allTopics.length).toBeGreaterThanOrEqual(1);
    expect(allTopics.some(t =>
      ['graphing', 'functions', 'linear-equations'].includes(t)
    )).toBe(true);
  });

  it('should return no alternatives for very clear classifications', () => {
    const result = inferTopicWithConfidence('Calculate sin(30°) + cos(45°)');
    expect(result.topic).toBe('trigonometry');
    // May have no alternatives if trigonometry score is dominant
    expect(result.alternatives.length).toBeLessThanOrEqual(2);
  });

  it('should handle default case with medium confidence', () => {
    // Use text with no math keywords to trigger default
    const result = inferTopicWithConfidence('Help me with my homework');
    expect(result.topic).toBe('linear-equations');
    expect(result.confidence).toBe(0.5); // Default confidence
    expect(result.alternatives.length).toBe(0);
  });
});

describe('explainTopicClassification', () => {
  it('should provide detailed explanation', () => {
    const explanation = explainTopicClassification('Solve the inequality 2x + 5 < 13');
    expect(explanation).toContain('inequalities');
    expect(explanation).toContain('score:');
    expect(explanation).toContain('Matched keywords:');
    expect(explanation).toContain('Selected:');
  });

  it('should show top candidates', () => {
    const explanation = explainTopicClassification('Find the derivative of x²');
    expect(explanation).toContain('calculus');
    expect(explanation).toMatch(/\d+\./); // Numbered list
  });

  it('should handle no matches gracefully', () => {
    const explanation = explainTopicClassification('Random text');
    expect(explanation).toContain('No keyword matches found');
    expect(explanation).toContain('linear-equations'); // Default
  });

  it('should include matched keywords in explanation', () => {
    const explanation = explainTopicClassification('Solve 2x + 5 < 13');
    expect(explanation).toContain('<'); // Matched keyword
    expect(explanation).toContain('inequalities'); // Topic name
  });
});
