/**
 * Conversation state types
 */

import type { Annotation } from './whiteboard';

export type MasteryLevel = 'struggling' | 'competent' | 'mastered' | null;

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  annotations?: Annotation[];
  isComplete?: boolean; // Did this message mark the problem as complete?
  timestamp: Date;
}

export interface ConversationState {
  problemStatement: string;
  messages: Message[];
  masteryLevel: MasteryLevel;
}
