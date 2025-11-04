/**
 * POST /api/chat
 * Secure serverless proxy for OpenAI chat completions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/prompts/socratic-tutor';
import type { ChatRequest, ChatResponse, ErrorResponse } from '@/types/api';
import { parseWithFallback, sanitizeResponse, hasValidAnnotations } from '@/lib/annotation-validator';

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
    const { problem, messages } = req.body as ChatRequest;

    // Debug logging
    console.log('=== API Request Debug ===');
    console.log('Problem:', problem);
    console.log('Messages:', JSON.stringify(messages, null, 2));
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

    // Build system prompt
    const systemPrompt = buildSystemPrompt(problem);

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

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '500'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.4'),
      messages: openaiMessages,
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

    if (sanitized.isComplete) {
      console.log(`🎉 Problem marked as complete (mastery: ${sanitized.masteryLevel || 'not specified'})`);
    }

    return res.status(200).json({
      response: sanitized.message,
      annotations: sanitized.annotations || [],
      isComplete: sanitized.isComplete,
      masteryLevel: sanitized.masteryLevel,
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
