/**
 * POST /api/analyze-problem-stream
 * Streaming version - sends solution path data as it's generated
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

interface AnalyzeProblemRequest {
  problem: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    const { problem } = req.body as AnalyzeProblemRequest;

    // Debug logging
    console.log('=== Analyze Problem (Stream) ===');
    console.log('Problem:', problem);
    console.log('================================');

    // Input validation
    if (!problem || typeof problem !== 'string') {
      return res.status(400).json({ error: 'Missing required field: problem' });
    }

    if (problem.length > MAX_PROBLEM_LENGTH) {
      return res
        .status(400)
        .json({ error: `Problem too long (max ${MAX_PROBLEM_LENGTH} chars)` });
    }

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create system prompt for solution path analysis
    const systemPrompt = `You are an expert math educator analyzing problems to create solution roadmaps. Your task is to analyze a math problem and generate a comprehensive solution path.

**CRITICAL: You MUST respond with valid JSON matching the exact structure specified below.**

ANALYSIS REQUIREMENTS:

1. **Identify Problem Type**: Linear equation, system of equations, quadratic, word problem, etc.

2. **Generate Multiple Approaches**: Provide 1-3 valid solution approaches when applicable
   - For simple problems (e.g., "solve 2x + 5 = 13"): 1 approach
   - For complex problems (e.g., systems of equations): 2-3 approaches (elimination, substitution, graphing)

3. **Break Down Each Approach**: Provide 3-5 clear, actionable steps
   - Each step should be specific to THIS problem (use actual numbers/expressions)
   - Steps should be student-facing actions (what they should DO)
   - Include reasoning for WHY each step is necessary

4. **Create Progressive Hints**: For each step, provide 3 hint levels:
   - Level 1: General guidance referencing problem specifics
   - Level 2: Point to exact part with suggestion
   - Level 3: Very concrete with actual numbers

5. **Include Metadata**:
   - Key concepts for each step
   - Common mistakes students make
   - Difficulty level

RESPONSE FORMAT (JSON):

{
  "problemStatement": "the exact problem provided",
  "problemType": "Linear Equation | System of Equations | Quadratic Equation | Word Problem | etc.",
  "requiredConcepts": ["concept1", "concept2"],
  "approaches": [
    {
      "name": "Approach Name",
      "description": "When/why to use this approach",
      "difficulty": "easy | medium | hard",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Specific action for this problem",
          "reasoning": "Why this step is necessary",
          "hints": {
            "level1": "General guidance with problem specifics",
            "level2": "Point to exact part with suggestion",
            "level3": "Very concrete with actual numbers"
          },
          "difficulty": "easy | medium | hard",
          "keyConcepts": ["concept1", "concept2"],
          "commonMistakes": ["mistake1", "mistake2"]
        }
      ]
    }
  ],
  "recommendedApproachIndex": 0
}`;

    // Call OpenAI API with streaming enabled
    const stream = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Analyze this math problem and generate a solution path:\n\n${problem}`,
        },
      ],
      response_format: { type: 'json_object' },
      stream: true,
    });

    // Accumulate the response
    let fullResponse = '';
    let lastSentSteps = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;

      // Try to parse partial JSON to count steps
      try {
        // Simple heuristic: count "stepNumber" occurrences
        const stepCount = (fullResponse.match(/"stepNumber"/g) || []).length;

        if (stepCount > lastSentSteps) {
          // Send progress update
          res.write(`data: ${JSON.stringify({ type: 'step', count: stepCount })}\n\n`);
          lastSentSteps = stepCount;
        }
      } catch (e) {
        // Ignore parse errors during streaming
      }
    }

    // Parse final complete JSON
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(fullResponse);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', fullResponse);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Invalid JSON response' })}\n\n`);
      res.end();
      return;
    }

    // Validate and send complete solution path
    if (
      !parsedResponse.problemStatement ||
      !parsedResponse.problemType ||
      !parsedResponse.approaches ||
      !Array.isArray(parsedResponse.approaches) ||
      parsedResponse.approaches.length === 0
    ) {
      console.error('Invalid solution path structure:', parsedResponse);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Invalid solution path structure' })}\n\n`);
      res.end();
      return;
    }

    // Send complete solution path
    const solutionPath = {
      problemStatement: parsedResponse.problemStatement,
      problemType: parsedResponse.problemType,
      approaches: parsedResponse.approaches,
      recommendedApproachIndex: parsedResponse.recommendedApproachIndex || 0,
      requiredConcepts: parsedResponse.requiredConcepts || [],
      generatedAt: new Date(),
    };

    res.write(`data: ${JSON.stringify({ type: 'complete', solutionPath })}\n\n`);
    res.end();

    console.log('✅ Streamed solution path with', solutionPath.approaches.length, 'approach(es)');
  } catch (error: any) {
    console.error('OpenAI API error:', error);

    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'Failed to analyze problem. Please try again.';

    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
      res.end();
    } catch (e) {
      // Response already ended
    }
  }
}
