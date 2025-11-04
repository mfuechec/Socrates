/**
 * API request and response types
 */

import type { Annotation, MasteryLevel } from './whiteboard';
import type { StepProgression } from './solution-path';

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  problem: string;
  messages: Message[];
  // Solution path context (optional - only included if path analysis succeeded)
  pathContext?: {
    solutionPath: import('./solution-path').SolutionPath;
    approachIndex: number;
    stepIndex: number;
    struggleLevel: number;
  };
}

export interface ChatResponse {
  response: string;
  annotations?: Annotation[];
  currentState?: string;
  isComplete?: boolean;
  masteryLevel?: MasteryLevel;
  // Step progression metadata (tells client whether to advance step)
  stepProgression?: StepProgression;
}

export interface VisionResponse {
  extractedText: string;
}

export interface ErrorResponse {
  error: string;
}
