/**
 * Interference Groups for Topic Spacing
 * Defines which topics are similar enough to interfere with each other
 * Based on cognitive science research on interleaved practice
 */

import type { MathTopic } from '@/types/learning';

/**
 * Interference groups - topics within same group should be spaced apart
 * Based on research: https://www.learningscientists.org/interleaving
 */
export const INTERFERENCE_GROUPS: Record<string, MathTopic[]> = {
  // Equation solving (similar procedural steps)
  'equation-solving': [
    'linear-equations',
    'quadratic-equations',
    'systems-of-equations',
    'rational-expressions',
  ],

  // Inequalities and absolute value (similar comparison concepts)
  'inequalities-group': ['inequalities', 'absolute-value'],

  // Polynomial operations (similar algebraic manipulation)
  'polynomial-operations': ['polynomials', 'exponents', 'radicals'],

  // Function analysis (similar graphing/evaluation concepts)
  'function-analysis': ['functions', 'graphing'],

  // Advanced topics (each is distinct enough to not interfere)
  'calculus-group': ['calculus'],
  'trigonometry-group': ['trigonometry'],
  'geometry-group': ['geometry'],
  'word-problems-group': ['word-problems'],
};

/**
 * Get the interference group for a given topic
 * @returns Group name or null if topic isn't in any group
 */
export function getInterferenceGroup(topic: MathTopic): string | null {
  for (const [groupName, topics] of Object.entries(INTERFERENCE_GROUPS)) {
    if (topics.includes(topic)) {
      return groupName;
    }
  }
  return null;
}

/**
 * Check if two topics are in the same interference group
 */
export function areTopicsInSameGroup(topic1: MathTopic, topic2: MathTopic): boolean {
  const group1 = getInterferenceGroup(topic1);
  const group2 = getInterferenceGroup(topic2);

  return group1 !== null && group1 === group2;
}

/**
 * Filter out topics that are in the same interference group as recent topics
 * Used to prevent consecutive similar topics in mixed practice
 *
 * @param candidateTopics Topics to filter
 * @param recentTopics Recently practiced topics (from history)
 * @param minSpacing Minimum number of problems between topics in same group (default: 2)
 * @returns Filtered topics with interference groups spaced appropriately
 */
export function filterInterferingTopics(
  candidateTopics: MathTopic[],
  recentTopics: MathTopic[],
  minSpacing: number = 2
): MathTopic[] {
  if (recentTopics.length === 0) {
    return candidateTopics; // No history, no filtering needed
  }

  // Get last N topics based on spacing requirement
  const recentN = recentTopics.slice(-minSpacing);

  // Filter out topics in same group as any recent topic
  const filtered = candidateTopics.filter((candidate) => {
    const candidateGroup = getInterferenceGroup(candidate);

    // If not in any group, it's always OK
    if (!candidateGroup) {
      return true;
    }

    // Check if any recent topic is in the same group
    const hasRecentGroupMember = recentN.some((recentTopic) => {
      const recentGroup = getInterferenceGroup(recentTopic);
      return recentGroup === candidateGroup;
    });

    return !hasRecentGroupMember;
  });

  console.log(
    `[Interference Filter] Filtered ${candidateTopics.length} → ${filtered.length} topics (${candidateTopics.length - filtered.length} removed due to recent interference)`
  );

  return filtered.length > 0 ? filtered : candidateTopics; // Fallback to all if filtering removes everything
}

/**
 * Arrange topics to maximize spacing between interference groups
 * Uses greedy algorithm to place topics as far apart as possible from their group members
 *
 * @param topics Topics to arrange
 * @returns Optimally spaced topic sequence
 */
export function optimizeTopicSpacing(topics: MathTopic[]): MathTopic[] {
  if (topics.length <= 2) {
    return topics; // Too few to optimize
  }

  const result: MathTopic[] = [];
  const remaining = [...topics];

  // Start with first topic
  result.push(remaining.shift()!);

  // Greedily select topics that maximize distance from their group members
  while (remaining.length > 0) {
    let bestTopic: MathTopic | null = null;
    let bestScore = -1;

    for (const candidate of remaining) {
      // Calculate "distance score" - how far back is the last group member?
      const candidateGroup = getInterferenceGroup(candidate);
      let score = result.length; // Default: max distance if no group

      if (candidateGroup) {
        // Find last occurrence of any topic in same group
        for (let i = result.length - 1; i >= 0; i--) {
          if (areTopicsInSameGroup(candidate, result[i])) {
            score = result.length - i; // Distance from last group member
            break;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTopic = candidate;
      }
    }

    if (bestTopic) {
      result.push(bestTopic);
      remaining.splice(remaining.indexOf(bestTopic), 1);
    } else {
      // Fallback: just add remaining topics
      result.push(...remaining);
      break;
    }
  }

  console.log(`[Interference Spacing] Optimized ${topics.length} topics for maximum group spacing`);

  return result;
}

/**
 * Get statistics about interference group distribution in a topic sequence
 */
export function analyzeTopicSequence(topics: MathTopic[]): {
  groupCounts: Record<string, number>;
  minSpacing: number;
  violations: number;
} {
  const groupCounts: Record<string, number> = {};
  let minSpacing = Infinity;
  let violations = 0;

  const groupLastSeen: Record<string, number> = {};

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const group = getInterferenceGroup(topic);

    if (group) {
      groupCounts[group] = (groupCounts[group] || 0) + 1;

      if (groupLastSeen[group] !== undefined) {
        const spacing = i - groupLastSeen[group];
        minSpacing = Math.min(minSpacing, spacing);

        if (spacing < 2) {
          violations++;
        }
      }

      groupLastSeen[group] = i;
    }
  }

  return {
    groupCounts,
    minSpacing: minSpacing === Infinity ? -1 : minSpacing,
    violations,
  };
}
