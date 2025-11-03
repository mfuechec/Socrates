/**
 * Error message utilities
 * Provides user-friendly error messages for different failure scenarios
 */

export function getErrorMessage(error: any): string {
  // Handle AbortError (user cancelled request)
  if (error.name === 'AbortError') {
    return ''; // Silent cancellation, no error message
  }

  // Check for network connectivity
  if (!navigator.onLine) {
    return 'No internet connection. Check your network and try again.';
  }

  // Handle specific error codes
  const statusCode = error.status || error.response?.status;

  if (statusCode === 429) {
    return 'Too many requests. Please wait 30 seconds and try again.';
  }

  if (statusCode === 401 || statusCode === 403) {
    return 'Authentication error. Check your API key configuration.';
  }

  if (statusCode >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  // Handle specific error messages
  const message = error.message || '';

  if (message.includes('ECONNRESET') || message.includes('ETIMEDOUT')) {
    return 'Connection lost. Check your internet and try again.';
  }

  if (message.includes('OCR') || message.includes('extract')) {
    return "Couldn't read the image. Try uploading a clearer photo or type your problem manually.";
  }

  if (message.includes('API key')) {
    return 'API key error. Please check your configuration.';
  }

  // Generic fallback
  return 'Something went wrong. Try resetting the conversation or refreshing the page.';
}
