/**
 * Conversation state management
 * Coordinates API calls and maintains message history
 */

import { chatWithTutor } from './api-client';
import type { Message, ConversationState } from '@/types/conversation';
import type { StepProgression } from '@/types/solution-path';

/**
 * Sanitize message content to prevent excessive whitespace
 * - Collapse 3+ consecutive newlines to maximum of 2
 * - Trim leading/trailing whitespace
 * - Preserve intentional paragraph breaks (2 newlines)
 */
function sanitizeContent(content: string): string {
  return content
    .trim() // Remove leading/trailing whitespace
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to 2 (allow paragraph breaks)
    .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces before newlines
    .replace(/\n[ \t]+/g, '\n'); // Remove leading spaces after newlines
}

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

  // Sanitize content to prevent excessive whitespace
  const sanitizedContent = sanitizeContent(tutorResponse.message);

  // Create tutor message with all metadata
  const tutorMsg: Message = {
    role: 'tutor',
    content: sanitizedContent,
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

/**
 * Save completed problem attempt to database
 * Called when a problem is marked as complete (masteryLevel is set)
 */
export async function saveProblemAttempt(
  problemText: string,
  messages: Message[]
): Promise<void> {
  try {
    const turnsTaken = getTurnCount(messages);

    const response = await fetch('/api/save-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemText,
        turnsTaken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to save attempt:', error);
      // Don't throw - we don't want to interrupt the user experience
      return;
    }

    const data = await response.json();
    console.log('✅ Attempt saved successfully:', data);
  } catch (error) {
    console.error('Error saving attempt:', error);
    // Silently fail - don't interrupt user experience
  }
}
