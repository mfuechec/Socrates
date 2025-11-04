/**
 * POST /api/generate-harder
 * Generate a harder practice problem that builds on the original
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// CORS allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null,
].filter(Boolean) as string[];

// Validation limits
const MAX_PROBLEM_LENGTH = 500;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateHarderRequest {
  originalProblem: string;
}

interface GenerateHarderResponse {
  problem: string;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateHarderResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS protection
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.error(`Rejected request from unauthorized origin: ${origin}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { originalProblem } = req.body as GenerateHarderRequest;

    // Debug logging
    console.log('=== Generate Harder Problem ===');
    console.log('Original:', originalProblem);
    console.log('================================');

    // Input validation
    if (!originalProblem || typeof originalProblem !== 'string') {
      return res.status(400).json({ error: 'Missing required field: originalProblem' });
    }

    if (originalProblem.length > MAX_PROBLEM_LENGTH) {
      return res
        .status(400)
        .json({ error: `Problem too long (max ${MAX_PROBLEM_LENGTH} chars)` });
    }

    // Create prompt for generating harder problem
    const systemPrompt = `You are a math problem generator. Given an original math problem, generate a NEW HARDER problem that builds on the same concepts. Follow these requirements:

1. Increase difficulty by EITHER:

   OPTION A - Increase complexity within same concept:
   - Use larger or more complex numbers
   - Add extra steps or operations
   - Use fractions, decimals, or negative numbers (if original didn't)

   OPTION B - Introduce new related concept (preferred when appropriate):
   - Add a second variable (e.g., x → x and y)
   - Move from linear to quadratic concepts
   - Combine multiple related concepts
   - Introduce systems of equations
   - Add inequality constraints
   - Move from arithmetic to algebraic thinking

2. Make it ONE LEVEL harder (gradual progression, not dramatic jump)
3. The new concept should logically build on what the student just learned
4. Return ONLY the new problem statement, nothing else
5. Use proper mathematical notation when needed

Examples of progression:

WITHIN-CONCEPT:
Easy: "Solve for x: 2x + 5 = 13"
Harder: "Solve for x: 3x + 7 = 2x + 15"

NEW-CONCEPT:
Easy: "Solve for x: 7x - 10 = 3x + 18 - 4x + 2"
Harder: "Solve for x and y: 2x + y = 10 and x - y = 2"

WITHIN-CONCEPT:
Easy: "Sarah has 3 times as many apples as John. Together they have 24 apples. How many does John have?"
Harder: "Sarah has 3 times as many apples as John. After giving John 4 apples, she has twice as many as him. How many did each person start with?"

NEW-CONCEPT:
Easy: "Simplify: 2(x + 3)"
Harder: "Solve for x: 2(x + 3) = 14"

Prioritize introducing new concepts (Option B) when the original problem suggests mastery of a foundational skill.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Generate a harder problem that builds on this one:\n\n${originalProblem}`,
        },
      ],
    });

    // Extract response text
    const newProblem = response.choices[0]?.message?.content?.trim();
    if (!newProblem) {
      throw new Error('No response content from OpenAI');
    }

    console.log('Generated:', newProblem);

    return res.status(200).json({
      problem: newProblem,
    });
  } catch (error: any) {
    // Log full error server-side
    console.error('OpenAI API error:', error);

    // Return sanitized error to client
    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'Failed to generate problem. Please try again.';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
