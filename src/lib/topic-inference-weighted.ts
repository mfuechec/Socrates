/**
 * Weighted Topic Inference System
 * Improves upon keyword-based classification with scoring and priorities
 * Resolves ambiguous classifications more accurately
 */

import type { MathTopic } from '@/types/learning';

interface TopicScore {
  topic: MathTopic;
  score: number;
  matchedKeywords: string[];
}

interface TopicPattern {
  keywords: string[];
  weight: number;
  priority: number;
}

/**
 * Topic patterns with keywords, weights, and priorities
 * Priority: 1 = highest (most specific), 5 = lowest (most general)
 * Weight: Multiplier for keyword matches
 */
const TOPIC_PATTERNS: Record<MathTopic, TopicPattern> = {
  // Priority 1: Most specific topics (check first)
  'inequalities': {
    keywords: ['<', '>', '≤', '≥', 'inequality', 'greater than', 'less than', 'at least', 'at most', 'no more than', 'no less than'],
    weight: 2.5,
    priority: 1,
  },
  'absolute-value': {
    keywords: ['|', 'absolute value', 'absolute', '|x|', 'abs('],
    weight: 2.5,
    priority: 1,
  },
  'calculus': {
    keywords: ['derivative', 'integral', 'limit', 'dx', 'dy', 'differentiate', 'integrate', 'tangent line', 'rate of change', 'area under curve'],
    weight: 3.0,
    priority: 1,
  },
  'trigonometry': {
    keywords: ['sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'angle', 'radian', 'degree', 'triangle sides', 'hypotenuse', 'opposite', 'adjacent'],
    weight: 2.5,
    priority: 1,
  },

  // Priority 2: Moderately specific
  'systems-of-equations': {
    keywords: ['system', 'two equations', 'solve for x and y', 'elimination', 'substitution', 'multiple equations'],
    weight: 2.0,
    priority: 2,
  },
  'quadratic-equations': {
    keywords: ['x²', 'x^2', 'quadratic', 'parabola', 'vertex', 'factor', 'completing the square', 'quadratic formula', 'discriminant'],
    weight: 2.0,
    priority: 2,
  },
  'rational-expressions': {
    keywords: ['fraction', 'rational', 'numerator', 'denominator', 'lcd', 'common denominator', 'rational equation'],
    weight: 2.0,
    priority: 2,
  },
  'radicals': {
    keywords: ['√', 'radical', 'square root', 'cube root', 'nth root', 'radicand', 'simplify radical'],
    weight: 2.0,
    priority: 2,
  },
  'geometry': {
    keywords: ['triangle', 'circle', 'rectangle', 'square', 'polygon', 'area', 'perimeter', 'volume', 'surface area', 'angle measure', 'parallel', 'perpendicular'],
    weight: 2.0,
    priority: 2,
  },

  // Priority 3: General algebra topics
  'polynomials': {
    keywords: ['polynomial', 'factor', 'expand', 'binomial', 'trinomial', 'foil', 'distribute', 'monomial', 'degree of polynomial'],
    weight: 1.5,
    priority: 3,
  },
  'exponents': {
    keywords: ['^', 'exponent', 'power', 'exponential', 'base', 'scientific notation', 'x^3', 'x^4', 'x^5'],
    weight: 1.5,
    priority: 3,
  },
  'functions': {
    keywords: ['f(x)', 'g(x)', 'function', 'domain', 'range', 'composition', 'inverse function', 'evaluate', 'f(2)'],
    weight: 1.5,
    priority: 3,
  },
  'graphing': {
    keywords: ['graph', 'plot', 'coordinate', 'x-axis', 'y-axis', 'intercept', 'slope', 'line', 'curve', 'point'],
    weight: 1.5,
    priority: 3,
  },

  // Priority 4: Very general
  'linear-equations': {
    keywords: ['solve for x', 'solve for y', 'isolate', '2x +', '3x -', '= ', 'equation', 'solve'],
    weight: 1.0,
    priority: 4,
  },
  'word-problems': {
    keywords: ['if', 'has', 'costs', 'years old', 'how many', 'how much', 'total', 'altogether', 'combined', 'less than', 'more than'],
    weight: 1.2,
    priority: 4,
  },
};

/**
 * Calculate weighted scores for all matching topics
 */
function calculateTopicScores(problemText: string): TopicScore[] {
  const text = problemText.toLowerCase();
  const scores: TopicScore[] = [];

  for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
    const matchedKeywords = config.keywords.filter((kw) =>
      text.includes(kw.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      // Score = (number of matches) × weight × priority boost
      // Priority boost: priority 1 gets 3x, priority 2 gets 2x, priority 3-5 gets 1x
      const priorityBoost = config.priority === 1 ? 3.0 :
                           config.priority === 2 ? 2.0 :
                           1.0;

      const score = matchedKeywords.length * config.weight * priorityBoost;

      scores.push({
        topic: topic as MathTopic,
        score,
        matchedKeywords,
      });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores;
}

/**
 * Infer topic using weighted scoring system
 * Returns the highest-scoring topic
 */
export function inferTopicWeighted(problemText: string): MathTopic {
  const scores = calculateTopicScores(problemText);

  if (scores.length === 0) {
    // No matches - default to linear equations
    console.log('[Topic - Weighted] No keyword matches, defaulting to linear-equations');
    return 'linear-equations';
  }

  const best = scores[0];
  const preview = problemText.substring(0, 50).replace(/\n/g, ' ');

  // Log top 3 candidates for debugging
  const topCandidates = scores.slice(0, 3).map(s =>
    `${s.topic} (${s.score.toFixed(1)}, keywords: ${s.matchedKeywords.slice(0, 2).join(', ')}${s.matchedKeywords.length > 2 ? '...' : ''})`
  );

  console.log(`[Topic - Weighted] "${preview}..."`);
  console.log(`  Top candidates: ${topCandidates.join(' | ')}`);
  console.log(`  → Selected: ${best.topic}`);

  return best.topic;
}

/**
 * Infer topic with confidence score
 * Useful for identifying ambiguous classifications
 */
export function inferTopicWithConfidence(problemText: string): {
  topic: MathTopic;
  confidence: number;
  alternatives: MathTopic[];
} {
  const scores = calculateTopicScores(problemText);

  if (scores.length === 0) {
    return {
      topic: 'linear-equations',
      confidence: 0.5, // Low confidence for default
      alternatives: [],
    };
  }

  const best = scores[0];

  // Calculate confidence based on gap to second-best
  let confidence: number;
  if (scores.length === 1) {
    confidence = 1.0; // Only one match, high confidence
  } else {
    const gap = (best.score - scores[1].score) / best.score;
    confidence = Math.min(1.0, 0.5 + gap); // 0.5-1.0 range
  }

  // Alternatives: topics within 70% of best score
  const threshold = best.score * 0.7;
  const alternatives = scores
    .slice(1)
    .filter((s) => s.score >= threshold)
    .map((s) => s.topic);

  return {
    topic: best.topic,
    confidence,
    alternatives,
  };
}

/**
 * Get detailed scoring breakdown for debugging
 */
export function explainTopicClassification(problemText: string): string {
  const scores = calculateTopicScores(problemText);
  const preview = problemText.substring(0, 100).replace(/\n/g, ' ');

  if (scores.length === 0) {
    return `Problem: "${preview}..."\nNo keyword matches found. Defaulting to linear-equations.`;
  }

  let explanation = `Problem: "${preview}..."\n\n`;
  explanation += `Classification Results (top 5):\n`;

  scores.slice(0, 5).forEach((score, index) => {
    const pattern = TOPIC_PATTERNS[score.topic];
    explanation += `${index + 1}. ${score.topic} (score: ${score.score.toFixed(2)})\n`;
    explanation += `   - Matched keywords: ${score.matchedKeywords.join(', ')}\n`;
    explanation += `   - Weight: ${pattern.weight}, Priority: ${pattern.priority}\n`;
  });

  explanation += `\nSelected: ${scores[0].topic}`;

  return explanation;
}
