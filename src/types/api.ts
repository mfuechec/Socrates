/**
 * API request and response types
 */

import type { Annotation, MasteryLevel } from './whiteboard';

export interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  problem: string;
  messages: Message[];
}

export interface ChatResponse {
  response: string;
  annotations?: Annotation[];
  isComplete?: boolean;
  masteryLevel?: MasteryLevel;
}

export interface VisionResponse {
  extractedText: string;
}

export interface ErrorResponse {
  error: string;
}
