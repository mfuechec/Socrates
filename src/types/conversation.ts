/**
 * Conversation state types
 */

import type { Annotation } from './whiteboard';
import type { SolutionPath, StruggleState } from './solution-path';

export type MasteryLevel = 'struggling' | 'competent' | 'mastered' | null;

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  annotations?: Annotation[];
  currentState?: string; // Current equation state (for progressive work display)
  isComplete?: boolean; // Did this message mark the problem as complete?
  timestamp: Date;
}

export interface ConversationState {
  problemStatement: string;
  messages: Message[];
  masteryLevel: MasteryLevel;
  // Solution path tracking (optional - only set if path analysis succeeds)
  solutionPath?: SolutionPath;
  currentApproachIndex: number; // Index of current approach being used
  currentStepIndex: number; // Index of current step in approach
  // Struggle tracking
  struggleState: StruggleState;
}
