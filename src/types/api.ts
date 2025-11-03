/**
 * API request and response types
 */

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
}

export interface VisionResponse {
  extractedText: string;
}

export interface ErrorResponse {
  error: string;
}
