/**
 * POST /api/chat
 * Secure serverless proxy for OpenAI chat completions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/prompts/socratic-tutor';
import type { ChatRequest, ChatResponse, ErrorResponse } from '@/types/api';
import type { SolutionPath } from '@/types/solution-path';
import { parseWithFallback, sanitizeResponse, hasValidAnnotations } from '@/lib/annotation-validator';
import { getCurrentStep, getCurrentApproach, getHintForStruggleLevel } from '@/lib/solution-path-manager';

// CORS allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null,
].filter(Boolean) as string[];

// Validation limits
const MAX_PROBLEM_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>
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
    const { problem, messages, pathContext } = req.body as ChatRequest;

    // Debug logging
    console.log('=== API Request Debug ===');
    console.log('Problem:', problem);
    console.log('Messages:', JSON.stringify(messages, null, 2));
    console.log('Path Context:', pathContext ? `Step ${pathContext.stepIndex + 1}, Struggle Level ${pathContext.struggleLevel}` : 'None');
    console.log('========================');

    // Input validation
    if (!problem || typeof problem !== 'string') {
      console.error('Validation failed: problem missing or not string');
      return res.status(400).json({ error: 'Missing required field: problem' });
    }

    if (problem.length > MAX_PROBLEM_LENGTH) {
      return res
        .status(400)
        .json({ error: `Problem too long (max ${MAX_PROBLEM_LENGTH} chars)` });
    }

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: 'Missing required field: messages' });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res
          .status(400)
          .json({ error: 'Invalid message format (missing role or content)' });
      }

      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return res
          .status(400)
          .json({
            error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)`,
          });
      }
    }

    // Build path context for prompt if available
    let promptPathContext: Parameters<typeof buildSystemPrompt>[1] | undefined;
    if (pathContext && pathContext.solutionPath) {
      const approach = getCurrentApproach(pathContext.solutionPath, pathContext.approachIndex);
      const step = getCurrentStep(pathContext.solutionPath, pathContext.approachIndex, pathContext.stepIndex);

      if (approach && step) {
        const hint = getHintForStruggleLevel(step, pathContext.struggleLevel);
        const nextStep = pathContext.stepIndex + 1 < approach.steps.length
          ? approach.steps[pathContext.stepIndex + 1]
          : undefined;

        promptPathContext = {
          approachName: approach.name,
          currentStep: step.action,
          stepReasoning: step.reasoning,
          stepNumber: step.stepNumber,
          totalSteps: approach.steps.length,
          hint,
          struggleLevel: pathContext.struggleLevel,
          keyConcepts: step.keyConcepts,
          commonMistakes: step.commonMistakes,
          nextStepPreview: nextStep?.action,
        };
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(problem, promptPathContext);

    // Format messages for OpenAI API
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role === 'student' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
    ];

    // Call OpenAI API with forced JSON response format
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.4'),
      messages: openaiMessages,
      response_format: { type: "json_object" }, // Force JSON mode
    });

    // Extract response text
    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response content from OpenAI');
    }

    // Try to parse as JSON (with fallback to plain text)
    const parsed = parseWithFallback(responseText);

    // Sanitize annotations (remove invalid ones)
    const sanitized = sanitizeResponse(parsed);

    // Log response status
    if (hasValidAnnotations(sanitized)) {
      console.log(`✅ Response includes ${sanitized.annotations?.length} annotation(s)`);
    } else {
      console.log('📝 Text-only response (no annotations)');
    }

    if (sanitized.currentState) {
      console.log(`📊 CurrentState: "${sanitized.currentState}"`);
    } else {
      console.log('⚠️  No currentState in response');
    }

    if (sanitized.isComplete) {
      console.log(`🎉 Problem marked as complete (mastery: ${sanitized.masteryLevel || 'not specified'})`);
    }

    if (sanitized.stepProgression) {
      console.log(`📊 Step Progression: ${sanitized.stepProgression.currentStepCompleted ? 'Step Complete' : 'In Progress'}, Struggling: ${sanitized.stepProgression.studentStrugglingOnCurrentStep ? 'Yes' : 'No'}`);
    }

    return res.status(200).json({
      response: sanitized.message,
      annotations: sanitized.annotations || [],
      currentState: sanitized.currentState,
      isComplete: sanitized.isComplete,
      masteryLevel: sanitized.masteryLevel,
      stepProgression: sanitized.stepProgression,
    });
  } catch (error: any) {
    // Log full error server-side
    console.error('OpenAI API error:', error);

    // Return sanitized error to client
    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'OpenAI API error. Please try again.';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
