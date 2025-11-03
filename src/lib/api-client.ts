/**
 * API client for backend routes
 * Handles HTTP requests with retry logic and cancellation support
 */

import type { Message } from '@/types/conversation';
import type { ChatResponse, VisionResponse } from '@/types/api';

// Retry configuration
const RETRYABLE_STATUS_CODES = [500, 429, 503];
const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

/**
 * Send chat message to tutor with retry logic
 */
export async function chatWithTutor(
  problem: string,
  messages: Message[],
  signal?: AbortSignal,
  onRetry?: (attempt: number) => void
): Promise<string> {
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
      return data.response;
    },
    onRetry
  );
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
