/**
 * Conversation state types
 */

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  problemStatement: string;
  messages: Message[];
}
