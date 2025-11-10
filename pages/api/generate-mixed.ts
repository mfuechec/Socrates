/**
 * API Endpoint: Generate Mixed Practice Session
 * Creates an interleaved practice session with 5-10 problems across different topics
 * Balances due reviews, weak topics, and variety
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';
import { prioritizeTopicsForPractice } from '@/lib/spaced-repetition';
import type { MathTopic, TopicProgress } from '@/types/learning';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a practice problem for a specific math topic
 */
async function generateProblemForTopic(topic: MathTopic): Promise<string> {
  const topicDescriptions: Record<MathTopic, string> = {
    'linear-equations': 'solving linear equations with one variable (e.g., 2x + 5 = 13)',
    'quadratic-equations': 'solving quadratic equations using factoring, completing the square, or quadratic formula',
    'systems-of-equations': 'solving systems of linear equations with two or more variables',
    'polynomials': 'polynomial operations, factoring, and simplification',
    'exponents': 'exponent rules, scientific notation, and exponential expressions',
    'radicals': 'simplifying radicals, radical equations, and radical expressions',
    'rational-expressions': 'rational expressions, algebraic fractions, and rational equations',
    'inequalities': 'solving and graphing linear and compound inequalities',
    'absolute-value': 'absolute value equations and inequalities',
    'functions': 'function notation, composition, and transformations',
    'graphing': 'graphing linear and nonlinear functions on coordinate planes',
    'word-problems': 'translating word problems into mathematical equations',
    'geometry': 'geometric shapes, area, perimeter, volume, and angle relationships',
    'trigonometry': 'trigonometric ratios, identities, and equations',
    'calculus': 'limits, derivatives, integrals, and related rates',
  };

  const description = topicDescriptions[topic];

  // Log API key being used (masked for security)
  const apiKey = process.env.OPENAI_API_KEY || '';
  const maskedKey = apiKey.length > 14
    ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`
    : 'NOT_SET';
  console.log('[API Key Check - Generate]', maskedKey);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a math problem generator. Generate one practice problem about ${description}.

REQUIREMENTS:
- Problem should be challenging but appropriate for high school/college level
- Include all necessary information to solve it
- Make it specific and concrete (use actual numbers, not placeholders)
- DO NOT include the solution or hints
- DO NOT include multiple parts (a, b, c, etc.) - just ONE problem
- Keep it concise (1-3 sentences max)

CRITICAL - Use "nice numbers" that lead to clean solutions:
- Solutions should be integers or simple fractions (like 1/2, 2/3, 3/4)
- Avoid problems that result in complex fractions (like 41/87 or 127/243)
- Use small coefficients (1-10 range) that work out cleanly
- Students should focus on the METHOD, not arithmetic struggle
- Example GOOD: "2x + 3 = 11" (solution: x = 4)
- Example BAD: "7x + 13 = 58" (solution: x = 45/7)

OUTPUT FORMAT:
Return ONLY the problem statement, nothing else. No explanations, no solutions, no metadata.`,
      },
    ],
    temperature: 0.9, // Higher temperature for variety
    max_tokens: 200,
  });

  const problemText = response.choices[0].message.content?.trim();

  if (!problemText) {
    throw new Error(`Failed to generate problem for topic: ${topic}`);
  }

  return problemText;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if specific topics were requested (for problem type buttons)
    const { topics: requestedTopics } = req.body;

    // If topics were explicitly provided, use them directly
    if (requestedTopics && Array.isArray(requestedTopics) && requestedTopics.length > 0) {
      console.log('=== Generate Specific Problem ===');
      console.log('Requested topics:', requestedTopics);

      // Generate problems for requested topics
      const problemPromises = requestedTopics.map(async (topic: MathTopic) => {
        try {
          const problemText = await generateProblemForTopic(topic);
          return {
            topic,
            problemText,
          };
        } catch (error) {
          console.error(`Failed to generate problem for ${topic}:`, error);
          return null;
        }
      });

      const problems = (await Promise.all(problemPromises)).filter(
        (p) => p !== null
      );

      if (problems.length === 0) {
        return res.status(500).json({ error: 'Failed to generate any problems' });
      }

      console.log(`✅ Generated ${problems.length} problem(s)`);

      // Return problems directly without creating a session
      return res.status(200).json({
        problems,
        sessionId: null, // No session for single problem generation
      });
    }

    // Otherwise, use the normal Mixed Practice flow
    // Create authenticated Supabase client
    const supabase = createPagesServerClient<Database>({ req, res });

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;

    // Get user's topic progress
    const { data: allProgress, error: progressError } = await supabase
      .from('topic_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error fetching topic progress:', progressError);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }

    console.log('=== Generate Mixed Practice ===');
    console.log('User:', userId);
    console.log('Total topics tracked:', allProgress?.length ?? 0);

    // If user has no progress yet, use a default set of foundational topics
    let selectedTopics: MathTopic[];

    if (!allProgress || allProgress.length === 0) {
      // New user - start with foundational topics
      selectedTopics = [
        'linear-equations',
        'polynomials',
        'exponents',
        'inequalities',
        'functions',
      ];
      console.log('New user - using foundational topics');
    } else {
      // Use the prioritization algorithm
      const topicCount = Math.min(8, Math.max(5, Math.ceil(allProgress.length / 2)));
      selectedTopics = prioritizeTopicsForPractice(
        allProgress as TopicProgress[],
        topicCount
      );
      console.log('Selected topics using prioritization:', selectedTopics);
    }

    // Generate problems for each topic
    console.log('Generating problems...');
    const problemPromises = selectedTopics.map(async (topic) => {
      try {
        const problemText = await generateProblemForTopic(topic);
        return {
          topic,
          problemText,
        };
      } catch (error) {
        console.error(`Failed to generate problem for ${topic}:`, error);
        return null;
      }
    });

    const problems = (await Promise.all(problemPromises)).filter(
      (p) => p !== null
    );

    if (problems.length === 0) {
      return res.status(500).json({ error: 'Failed to generate any problems' });
    }

    console.log(`✅ Generated ${problems.length} problems`);

    // Create practice session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        session_type: 'mixed',
        problems_count: problems.length,
        completed_count: 0,
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      // Don't fail - session tracking is optional
    } else {
      console.log('✅ Session created:', sessionData.id);
    }

    return res.status(200).json({
      success: true,
      sessionId: sessionData?.id,
      problems,
      totalCount: problems.length,
    });
  } catch (error: any) {
    console.error('Error in generate-mixed API:', error);
    return res.status(500).json({ error: error.message });
  }
}
