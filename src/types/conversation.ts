/**
 * Conversation state types
 */

export type MasteryLevel = 'struggling' | 'competent' | 'mastered' | null;

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  problemStatement: string;
  messages: Message[];
  masteryLevel: MasteryLevel;
}
