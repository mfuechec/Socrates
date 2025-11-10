/**
 * LLM-Based Topic Classification
 * Uses GPT-4o-mini for semantic understanding of math problems
 * Includes caching to minimize API calls
 */

import type { MathTopic } from '@/types/learning';
import { inferTopicWeighted } from './topic-inference-weighted';

// In-memory cache for classifications (simple implementation)
// In production, this could be moved to Redis or database
const classificationCache = new Map<string, { topic: MathTopic; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Available topics for the LLM to choose from
const AVAILABLE_TOPICS: MathTopic[] = [
  'linear-equations',
  'quadratic-equations',
  'systems-of-equations',
  'inequalities',
  'absolute-value',
  'polynomials',
  'rational-expressions',
  'radicals',
  'exponents',
  'functions',
  'graphing',
  'calculus',
  'trigonometry',
  'geometry',
  'word-problems',
];

/**
 * Generate a cache key from problem text
 */
function getCacheKey(problemText: string): string {
  // Normalize: lowercase, remove extra spaces, trim
  return problemText.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check cache for existing classification
 */
function getCachedTopic(problemText: string): MathTopic | null {
  const key = getCacheKey(problemText);
  const cached = classificationCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    classificationCache.delete(key);
    console.log('[LLM Classification] Cache expired for problem');
    return null;
  }

  console.log(`[LLM Classification] Cache hit: ${cached.topic}`);
  return cached.topic;
}

/**
 * Store classification in cache
 */
function cacheTopic(problemText: string, topic: MathTopic): void {
  const key = getCacheKey(problemText);
  classificationCache.set(key, { topic, timestamp: Date.now() });
}

/**
 * Classify topic using OpenAI GPT-4o-mini
 */
async function classifyWithLLM(problemText: string): Promise<MathTopic> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  const preview = problemText.substring(0, 100);
  console.log(`[LLM Classification] Calling OpenAI for: "${preview}..."`);

  const prompt = `You are a math education expert. Classify the following math problem into ONE of these categories:

${AVAILABLE_TOPICS.join(', ')}

Problem: "${problemText}"

Rules:
- Choose the MOST SPECIFIC category that fits
- If multiple categories apply, choose the PRIMARY focus
- Respond with ONLY the category name, no explanation

Category:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a math education expert that classifies math problems into specific categories.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent classification
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[LLM Classification] API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const classification = data.choices[0]?.message?.content?.trim().toLowerCase();

    if (!classification) {
      throw new Error('Empty response from OpenAI');
    }

    // Validate that the classification is a valid topic
    const validTopic = AVAILABLE_TOPICS.find((t) => classification.includes(t));

    if (!validTopic) {
      console.warn(`[LLM Classification] Invalid topic "${classification}", using fallback`);
      throw new Error(`Invalid topic: ${classification}`);
    }

    console.log(`[LLM Classification] ✓ Classified as: ${validTopic}`);
    return validTopic;
  } catch (error) {
    console.error('[LLM Classification] Error:', error);
    throw error;
  }
}

/**
 * Infer topic using LLM with caching and fallback
 *
 * Flow:
 * 1. Check cache
 * 2. If not cached, call LLM
 * 3. Cache result
 * 4. If LLM fails, fall back to weighted keyword matching
 *
 * @param problemText The math problem to classify
 * @param options Configuration options
 * @returns The classified topic
 */
export async function inferTopicLLM(
  problemText: string,
  options: {
    useCache?: boolean;
    fallbackToWeighted?: boolean;
  } = {}
): Promise<MathTopic> {
  const { useCache = true, fallbackToWeighted = true } = options;

  try {
    // 1. Check cache
    if (useCache) {
      const cached = getCachedTopic(problemText);
      if (cached) {
        return cached;
      }
    }

    // 2. Call LLM
    const topic = await classifyWithLLM(problemText);

    // 3. Cache result
    if (useCache) {
      cacheTopic(problemText, topic);
    }

    return topic;
  } catch (error) {
    console.error('[LLM Classification] Failed, using fallback');

    // 4. Fallback to weighted classification
    if (fallbackToWeighted) {
      console.log('[LLM Classification] Using weighted keyword fallback');
      return inferTopicWeighted(problemText);
    }

    throw error;
  }
}

/**
 * Clear the classification cache (useful for testing or manual refresh)
 */
export function clearClassificationCache(): void {
  const size = classificationCache.size;
  classificationCache.clear();
  console.log(`[LLM Classification] Cleared ${size} cached classifications`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; ttl: number } {
  return {
    size: classificationCache.size,
    ttl: CACHE_TTL_MS,
  };
}
