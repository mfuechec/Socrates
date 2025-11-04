/**
 * POST /api/chat-stream
 * Streaming endpoint for OpenAI chat completions
 * Uses Server-Sent Events (SSE) for real-time token streaming
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/prompts/socratic-tutor';
import type { ChatRequest } from '@/types/api';
import { parseWithFallback, sanitizeResponse } from '@/lib/annotation-validator';
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
    const { problem, messages, pathContext } = req.body as ChatRequest;

    // Input validation
    if (!problem || typeof problem !== 'string') {
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

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    // Stream OpenAI response
    const stream = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.4'),
      messages: openaiMessages,
      response_format: { type: "json_object" }, // Force JSON mode
      stream: true, // Enable streaming
    });

    let fullResponse = '';

    // Stream tokens as they arrive
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        fullResponse += content;

        // Send token to client via SSE
        res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
      }
    }

    // Parse complete JSON response
    const parsed = parseWithFallback(fullResponse);
    const sanitized = sanitizeResponse(parsed);

    // Send final structured data
    res.write(`data: ${JSON.stringify({
      type: 'done',
      response: sanitized.message,
      annotations: sanitized.annotations || [],
      currentState: sanitized.currentState,
      isComplete: sanitized.isComplete,
      masteryLevel: sanitized.masteryLevel,
      stepProgression: sanitized.stepProgression,
    })}\n\n`);

    // End the stream
    res.end();
  } catch (error: any) {
    // Log error server-side
    console.error('OpenAI streaming error:', error);

    // Send error via SSE
    const statusCode = error.status || 500;
    const errorMessage =
      statusCode === 429
        ? 'Rate limit exceeded. Wait 30 seconds and try again.'
        : 'OpenAI API error. Please try again.';

    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
    res.end();
  }
}
