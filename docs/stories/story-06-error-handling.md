# Story 6: Error Handling & Resilience

**As a** student
**I want** the system to handle failures gracefully
**So that** temporary issues don't ruin my learning session

## Acceptance Criteria

- Exponential backoff retry: 3 attempts, delays 500ms/1000ms/2000ms
- Retry on: 500, 429, 503, network timeout
- Don't retry on: 400, 401, 403, 404
- User-friendly error messages:
  - Network: "Connection lost. Check internet and try again."
  - Rate limit: "Too many requests. Wait 30s."
  - OCR failure: "Couldn't read image. Try clearer photo or type manually."
  - Generic: "Something went wrong. Try resetting conversation."
- "Retrying..." message after first failure
- AbortController cancels pending requests on reset

## Priority
MVP Important

## Effort
Medium (4-5 hours)

## Dependencies
- Story 1 (API Security & Proxy Setup)
- Story 2 (Chat Interface & State Management)
- Story 4 (Image Upload & OCR)

## Technical Notes

### Retry Logic Implementation
```typescript
// lib/api-client.ts
const RETRYABLE_STATUS_CODES = [500, 429, 503];
const MAX_RETRIES = 3;
const BASE_DELAY = 500; // ms

const exponentialBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    const statusCode = error.response?.status;
    if (!RETRYABLE_STATUS_CODES.includes(statusCode)) {
      throw error; // Don't retry client errors
    }

    const delay = BASE_DELAY * (2 ** (MAX_RETRIES - retries));
    console.log(`Retrying in ${delay}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return exponentialBackoff(fn, retries - 1);
  }
};
```

### AbortController Integration
```typescript
// lib/conversation-manager.ts
let abortController: AbortController | null = null;

export const sendMessage = async (content: string): Promise<string> => {
  abortController = new AbortController();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      signal: abortController.signal,
      body: JSON.stringify({ ... })
    });
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request cancelled by user');
      return null;
    }
    throw error;
  }
};

export const resetConversation = () => {
  if (abortController) {
    abortController.abort();
  }
  // Clear state...
};
```

### Error Message Mapping
```typescript
// lib/error-messages.ts
export const getErrorMessage = (error: any): string => {
  const statusCode = error.response?.status;

  if (error.name === 'AbortError') {
    return null; // Silent cancellation
  }

  if (!navigator.onLine || error.message.includes('ECONNRESET')) {
    return 'Connection lost. Check your internet and try again.';
  }

  if (statusCode === 429) {
    return 'Too many requests. Wait 30 seconds and try again.';
  }

  if (statusCode >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  // OCR-specific errors (from /api/vision)
  if (error.message.includes('OCR') || error.message.includes('extract')) {
    return 'Couldn\'t read the image. Try uploading a clearer photo or type your problem manually.';
  }

  // Generic fallback
  return 'Something went wrong. Try resetting the conversation.';
};
```

### UI Integration
```typescript
// src/components/ChatInterface.tsx
const [uiState, setUIState] = useState({
  isLoading: false,
  error: null,
  retryCount: 0
});

const handleSendMessage = async (content: string) => {
  setUIState({ isLoading: true, error: null, retryCount: 0 });

  try {
    const response = await conversationManager.sendMessage(content);
    // Update messages...
  } catch (error) {
    const message = getErrorMessage(error);
    setUIState({ isLoading: false, error: message, retryCount: 0 });
  }
};

// Show retry indicator
{uiState.retryCount > 0 && (
  <div className="text-yellow-600">Retrying... ({uiState.retryCount}/3)</div>
)}

// Show error message
{uiState.error && (
  <div className="text-red-600 bg-red-50 p-3 rounded">
    {uiState.error}
  </div>
)}
```

### Testing Scenarios
Test each error condition manually:

1. **Network Timeout**
   - Disable internet → Send message
   - Expected: "Connection lost. Check internet and try again."

2. **Rate Limiting (429)**
   - Send 10+ messages rapidly (if API rate limits)
   - Expected: "Too many requests. Wait 30s."

3. **Server Error (500)**
   - Mock 500 response in API route
   - Expected: Retry 3 times → "Server error. Please try again."

4. **OCR Failure**
   - Upload corrupted image or invalid file
   - Expected: "Couldn't read image. Try clearer photo or type manually."

5. **Abort on Reset**
   - Send message → Click "New Problem" before response
   - Expected: Silent cancellation, no error shown

6. **Client Error (400)**
   - Send invalid request (empty problem)
   - Expected: No retry, immediate error message

## Definition of Done
- [ ] Exponential backoff implemented in lib/api-client.ts
- [ ] Retry logic tested (500, 429, 503 status codes)
- [ ] Non-retryable errors tested (400, 401, 403, 404)
- [ ] Error message mapping created (lib/error-messages.ts)
- [ ] User-friendly messages display in UI
- [ ] "Retrying..." indicator shows during retries
- [ ] AbortController cancels requests on reset
- [ ] All 6 testing scenarios pass
- [ ] Error states clear when user tries again
- [ ] No console errors logged in production (only dev mode)
