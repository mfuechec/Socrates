/**
 * API client for backend routes
 * Handles HTTP requests with retry logic and cancellation support
 */

import type { Message } from '@/types/conversation';
import type { ChatResponse, VisionResponse } from '@/types/api';
import type { Annotation, MasteryLevel } from '@/types/whiteboard';

// Retry configuration
const RETRYABLE_STATUS_CODES = [500, 429, 503];
const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

/**
 * Send chat message to tutor with retry logic
 * Returns message, annotations, completion status, and step progression
 */
export async function chatWithTutor(
  problem: string,
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
  message: string;
  annotations?: Annotation[];
  currentState?: string;
  isComplete?: boolean;
  masteryLevel?: MasteryLevel;
  stepProgression?: import('@/types/solution-path').StepProgression;
}> {
  return await exponentialBackoff(
    async () => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem,
          messages,
          pathContext,
        }),
        signal, // Pass AbortSignal for cancellation
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'Failed to get tutor response');
        error.status = response.status;
        throw error;
      }

      const data: ChatResponse = await response.json();
      return {
        message: data.response,
        annotations: data.annotations,
        currentState: data.currentState,
        isComplete: data.isComplete,
        masteryLevel: data.masteryLevel,
        stepProgression: data.stepProgression,
      };
    },
    onRetry
  );
}

/**
 * Send chat message to tutor with STREAMING support
 * Streams tokens in real-time via Server-Sent Events
 * Returns final structured response with annotations
 */
export async function chatWithTutorStreaming(
  problem: string,
  messages: Message[],
  pathContext?: {
    solutionPath: import('@/types/solution-path').SolutionPath;
    approachIndex: number;
    stepIndex: number;
    struggleLevel: number;
  },
  onToken?: (token: string) => void,
  signal?: AbortSignal
): Promise<{
  message: string;
  annotations?: Annotation[];
  currentState?: string;
  isComplete?: boolean;
  masteryLevel?: MasteryLevel;
  stepProgression?: import('@/types/solution-path').StepProgression;
}> {
  const response = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problem,
      messages,
      pathContext,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get tutor response');
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new Promise((resolve, reject) => {
    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            reject(new Error('Stream ended unexpectedly'));
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (separated by \n\n)
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6)); // Remove "data: " prefix

              if (data.type === 'token') {
                // Stream token to UI
                if (onToken) {
                  onToken(data.content);
                }
              } else if (data.type === 'done') {
                // Final structured response
                resolve({
                  message: data.response,
                  annotations: data.annotations,
                  currentState: data.currentState,
                  isComplete: data.isComplete,
                  masteryLevel: data.masteryLevel,
                  stepProgression: data.stepProgression,
                });
                return;
              } else if (data.type === 'error') {
                reject(new Error(data.error));
                return;
              }
            } catch (parseError) {
              console.error('Failed to parse SSE message:', parseError);
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    };

    processStream();
  });
}

/**
 * Extract problem text from image
 */
export async function extractProblemFromImage(
  imageFile: File,
  signal?: AbortSignal
): Promise<string> {
  // Convert image to base64
  const base64 = await fileToBase64(imageFile);

  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      mimeType: imageFile.type,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    const error: any = new Error(errorData.error || 'Failed to extract text from image');
    error.status = response.status;
    throw error;
  }

  const data: VisionResponse = await response.json();
  return data.extractedText;
}

/**
 * Generate a similar problem based on the original
 */
export async function generateSimilarProblem(
  originalProblem: string,
  signal?: AbortSignal
): Promise<string> {
  return await exponentialBackoff(
    async () => {
      const response = await fetch('/api/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalProblem,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'Failed to generate similar problem');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.problem;
    }
  );
}

/**
 * Generate a harder problem that builds on the original
 */
export async function generateHarderProblem(
  originalProblem: string,
  signal?: AbortSignal
): Promise<string> {
  return await exponentialBackoff(
    async () => {
      const response = await fetch('/api/generate-harder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalProblem,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'Failed to generate harder problem');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.problem;
    }
  );
}

/**
 * Analyze problem and generate solution path
 * Returns solution path with multiple approaches and step-by-step guidance
 */
export async function analyzeProblem(
  problem: string,
  signal?: AbortSignal
): Promise<import('@/types/solution-path').SolutionPath> {
  return await exponentialBackoff(
    async () => {
      const response = await fetch('/api/analyze-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'Failed to analyze problem');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.solutionPath;
    }
  );
}

/**
 * Exponential backoff retry logic
 */
async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number) => void,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Don't retry if aborted
    if (error.name === 'AbortError') {
      throw error;
    }

    // Don't retry if no retries left
    if (retries === 0) {
      throw error;
    }

    // Check if error is retryable
    const statusCode = error.status;
    const isRetryable =
      RETRYABLE_STATUS_CODES.includes(statusCode) ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT');

    if (!isRetryable) {
      throw error; // Don't retry client errors (400, 401, 403, 404)
    }

    // Calculate delay with exponential backoff
    const attempt = MAX_RETRIES - retries + 1;
    const delay = BASE_DELAY * Math.pow(2, attempt - 1);

    console.log(`Retrying in ${delay}ms... (attempt ${attempt}/${MAX_RETRIES})`);

    // Notify about retry
    if (onRetry) {
      onRetry(attempt);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry
    return exponentialBackoff(fn, onRetry, retries - 1);
  }
}

/**
 * Helper: Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/png;base64,...)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
