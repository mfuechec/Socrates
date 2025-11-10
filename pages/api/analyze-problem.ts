/**
 * POST /api/analyze-problem
 * Analyze a math problem and generate a solution path with multiple approaches
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { SolutionPath } from '@/types/solution-path';

// CORS allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
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

interface AnalyzeProblemResponse {
  solutionPath: SolutionPath;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeProblemResponse | ErrorResponse>
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
    console.log('=== Analyze Problem ===');
    console.log('Problem:', problem);
    console.log('=======================');

    // Input validation
    if (!problem || typeof problem !== 'string') {
      return res.status(400).json({ error: 'Missing required field: problem' });
    }

    if (problem.length > MAX_PROBLEM_LENGTH) {
      return res
        .status(400)
        .json({ error: `Problem too long (max ${MAX_PROBLEM_LENGTH} chars)` });
    }

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
   - Level 1: General guidance referencing problem specifics (e.g., "Look at 2x + 5 = 13. What operations are applied to x?")
   - Level 2: Point to exact part with suggestion (e.g., "In 2x + 5, we multiply by 2 then add 5. Which should we undo first?")
   - Level 3: Very concrete with actual numbers (e.g., "Subtract 5 from both sides. What's 13 - 5?")

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
      "name": "Approach Name (e.g., Elimination Method)",
      "description": "When/why to use this approach",
      "difficulty": "easy | medium | hard",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Specific action for this problem (use actual numbers)",
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
}

EXAMPLES:

Example 1 - Simple Linear Equation:
Problem: "Solve for x: 2x + 5 = 13"

{
  "problemStatement": "Solve for x: 2x + 5 = 13",
  "problemType": "Linear Equation",
  "requiredConcepts": ["Order of Operations", "Inverse Operations", "Isolation of Variables"],
  "approaches": [
    {
      "name": "Standard Algebraic Method",
      "description": "Use inverse operations to isolate x",
      "difficulty": "easy",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Subtract 5 from both sides of 2x + 5 = 13",
          "reasoning": "To isolate the term with x, we need to undo the +5 first",
          "hints": {
            "level1": "Look at 2x + 5 = 13. What operations are being applied to x?",
            "level2": "In 2x + 5, we multiply x by 2, then add 5. By reverse order of operations, which should we undo first?",
            "level3": "Subtract 5 from both sides. What's 13 - 5?"
          },
          "difficulty": "easy",
          "keyConcepts": ["Inverse Operations", "Order of Operations"],
          "commonMistakes": ["Subtracting 5 from only one side", "Dividing first instead of subtracting"]
        },
        {
          "stepNumber": 2,
          "action": "Divide both sides by 2 to solve for x",
          "reasoning": "To get x alone, we need to undo the multiplication by 2",
          "hints": {
            "level1": "Now we have 2x = 8. What's still attached to x?",
            "level2": "x is being multiplied by 2. What operation undoes multiplication?",
            "level3": "Divide both sides by 2. What's 8 ÷ 2?"
          },
          "difficulty": "easy",
          "keyConcepts": ["Division", "Inverse Operations"],
          "commonMistakes": ["Forgetting to divide both sides", "Arithmetic error in 8 ÷ 2"]
        }
      ]
    }
  ],
  "recommendedApproachIndex": 0
}

Example 2 - System of Equations (Multiple Approaches):
Problem: "Solve the system: 2x + 3y = 8 and 4x - y = 5"

{
  "problemStatement": "Solve the system: 2x + 3y = 8 and 4x - y = 5",
  "problemType": "System of Linear Equations",
  "requiredConcepts": ["Systems of Equations", "Elimination Method", "Substitution Method"],
  "approaches": [
    {
      "name": "Elimination Method",
      "description": "Eliminate one variable by combining equations",
      "difficulty": "medium",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Multiply first equation by 2 to get matching x coefficients",
          "reasoning": "We need 4x in both equations to eliminate x",
          "hints": {
            "level1": "Look at the x coefficients: 2x and 4x. How can we make them match?",
            "level2": "Notice that 4x is double 2x. What if we multiply the first equation by 2?",
            "level3": "Multiply the first equation 2x + 3y = 8 by 2. What do you get?"
          },
          "difficulty": "medium",
          "keyConcepts": ["Multiplication Property of Equality"],
          "commonMistakes": ["Multiplying only the left side", "Choosing the harder variable to eliminate"]
        }
      ]
    },
    {
      "name": "Substitution Method",
      "description": "Solve for one variable and substitute into the other equation",
      "difficulty": "medium",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Solve the second equation 4x - y = 5 for y",
          "reasoning": "The second equation has y with coefficient -1, making it easy to isolate",
          "hints": {
            "level1": "Which equation would be easiest to solve for one variable?",
            "level2": "In 4x - y = 5, notice y has coefficient -1. Can you isolate y?",
            "level3": "Add y to both sides, then subtract 5. What does y equal in terms of x?"
          },
          "difficulty": "easy",
          "keyConcepts": ["Isolation of Variables"],
          "commonMistakes": ["Sign errors when moving y"]
        }
      ]
    }
  ],
  "recommendedApproachIndex": 0
}

IMPORTANT GUIDELINES:
- Use the ACTUAL numbers and expressions from the problem (not generic "the coefficient")
- Make hints progressively more specific
- For complex problems, provide multiple approaches when valid
- Keep step count reasonable (3-5 steps per approach)
- Be concise but complete`;

    // Log API key being used (masked for security)
    const apiKey = process.env.OPENAI_API_KEY || '';
    const maskedKey = apiKey.length > 14
      ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`
      : 'NOT_SET';
    console.log('[API Key Check - Analyze]', maskedKey);

    // Call OpenAI API with JSON mode
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: 2000, // Higher limit for complex solution paths
      temperature: 0.3, // Lower temperature for consistency
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
      response_format: { type: 'json_object' }, // Force JSON mode
    });

    // Extract response text
    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate required fields
    if (
      !parsedResponse.problemStatement ||
      !parsedResponse.problemType ||
      !parsedResponse.approaches ||
      !Array.isArray(parsedResponse.approaches) ||
      parsedResponse.approaches.length === 0
    ) {
      console.error('Invalid solution path structure:', parsedResponse);
      throw new Error('Invalid solution path structure from AI');
    }

    // Construct solution path with timestamp
    const solutionPath: SolutionPath = {
      problemStatement: parsedResponse.problemStatement,
      problemType: parsedResponse.problemType,
      approaches: parsedResponse.approaches,
      recommendedApproachIndex: parsedResponse.recommendedApproachIndex || 0,
      requiredConcepts: parsedResponse.requiredConcepts || [],
      generatedAt: new Date(),
    };

    console.log('✅ Generated solution path with', solutionPath.approaches.length, 'approach(es)');
    solutionPath.approaches.forEach((approach, idx) => {
      console.log(`   Approach ${idx + 1}: ${approach.name} (${approach.steps.length} steps)`);
    });

    return res.status(200).json({
      solutionPath,
    });
  } catch (error: any) {
    // Log full error server-side
    console.error('OpenAI API error:', error);

    // Return sanitized error to client
    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'Failed to analyze problem. Please try again.';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
