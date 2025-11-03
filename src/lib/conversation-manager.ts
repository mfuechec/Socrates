/**
 * Conversation state management
 * Coordinates API calls and maintains message history
 */

import { chatWithTutor } from './api-client';
import type { Message, ConversationState } from '@/types/conversation';

/**
 * Get tutor response for current conversation
 * Note: Student message should already be added to messages before calling
 */
export async function sendMessage(
  problemStatement: string,
  messages: Message[],
  signal?: AbortSignal,
  onRetry?: (attempt: number) => void
): Promise<{ tutorMessage: Message }> {
  // Get tutor response
  const tutorResponseText = await chatWithTutor(
    problemStatement,
    messages,
    signal,
    onRetry
  );

  // Create tutor message
  const tutorMsg: Message = {
    role: 'tutor',
    content: tutorResponseText,
    timestamp: new Date(),
  };

  return { tutorMessage: tutorMsg };
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
