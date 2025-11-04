/**
 * Conversation state management
 * Coordinates API calls and maintains message history
 */

import { chatWithTutor, chatWithTutorStreaming } from './api-client';
import type { Message, ConversationState } from '@/types/conversation';
import type { StepProgression } from '@/types/solution-path';

/**
 * Get tutor response for current conversation
 * Note: Student message should already be added to messages before calling
 */
export async function sendMessage(
  problemStatement: string,
  messages: Message[],
  pathContext?: {
    solutionPath: import('@/types/solution-path').SolutionPath;
    approachIndex: number;
    stepIndex: number;
    struggleLevel: number;
  },
  signal?: AbortSignal,
  onRetry?: (attempt: number) => void
): Promise<{
  tutorMessage: Message;
  masteryLevel?: import('@/types/whiteboard').MasteryLevel;
  stepProgression?: StepProgression;
}> {
  // Get tutor response (includes message, annotations, completion status, and step progression)
  const tutorResponse = await chatWithTutor(
    problemStatement,
    messages,
    pathContext,
    signal,
    onRetry
  );

  // Create tutor message with all metadata
  const tutorMsg: Message = {
    role: 'tutor',
    content: tutorResponse.message,
    annotations: tutorResponse.annotations,
    currentState: tutorResponse.currentState,
    isComplete: tutorResponse.isComplete,
    timestamp: new Date(),
  };

  return {
    tutorMessage: tutorMsg,
    masteryLevel: tutorResponse.masteryLevel,
    stepProgression: tutorResponse.stepProgression,
  };
}

/**
 * Get tutor response with STREAMING support
 * Streams tokens in real-time via onToken callback
 */
export async function sendMessageStreaming(
  problemStatement: string,
  messages: Message[],
  pathContext?: {
    solutionPath: import('@/types/solution-path').SolutionPath;
    approachIndex: number;
    stepIndex: number;
    struggleLevel: number;
  },
  onToken?: (token: string) => void,
  signal?: AbortSignal
): Promise<{
  tutorMessage: Message;
  masteryLevel?: import('@/types/whiteboard').MasteryLevel;
  stepProgression?: StepProgression;
}> {
  // Get streaming tutor response
  const tutorResponse = await chatWithTutorStreaming(
    problemStatement,
    messages,
    pathContext,
    onToken,
    signal
  );

  // Create tutor message with all metadata
  const tutorMsg: Message = {
    role: 'tutor',
    content: tutorResponse.message,
    annotations: tutorResponse.annotations,
    currentState: tutorResponse.currentState,
    isComplete: tutorResponse.isComplete,
    timestamp: new Date(),
  };

  return {
    tutorMessage: tutorMsg,
    masteryLevel: tutorResponse.masteryLevel,
    stepProgression: tutorResponse.stepProgression,
  };
}

/**
 * Calculate turn count (student-tutor exchanges)
 */
export function getTurnCount(messages: Message[]): number {
  // Count student messages (each student message = 1 turn)
  return messages.filter((msg) => msg.role === 'student').length;
}

/**
 * Check if conversation is getting long
 */
export function shouldWarnAboutLength(messages: Message[]): boolean {
  return getTurnCount(messages) >= 15;
}
