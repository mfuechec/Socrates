/**
 * Conversation state management
 * Coordinates API calls and maintains message history
 */

import { chatWithTutor } from './api-client';
import type { Message, ConversationState } from '@/types/conversation';

/**
 * Send a student message and get tutor response
 */
export async function sendMessage(
  conversationState: ConversationState,
  studentMessage: string,
  signal?: AbortSignal,
  onRetry?: (attempt: number) => void
): Promise<{ updatedMessages: Message[] }> {
  // Add student message to history
  const studentMsg: Message = {
    role: 'student',
    content: studentMessage,
    timestamp: new Date(),
  };

  const messagesWithStudent = [...conversationState.messages, studentMsg];

  // Get tutor response
  const tutorResponseText = await chatWithTutor(
    conversationState.problemStatement,
    messagesWithStudent,
    signal,
    onRetry
  );

  // Add tutor message to history
  const tutorMsg: Message = {
    role: 'tutor',
    content: tutorResponseText,
    timestamp: new Date(),
  };

  const updatedMessages = [...messagesWithStudent, tutorMsg];

  return { updatedMessages };
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
