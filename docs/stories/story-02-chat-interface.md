# Story 2: Chat Interface & State Management

**As a** student
**I want** to input a problem, see conversation history, and start over when needed
**So that** I can have a complete tutoring session

## Acceptance Criteria

- Textarea for problem input (500 char max)
- "Start" button disabled until problem entered
- Message history displays in chronological order (student vs tutor visually distinct)
- Problem statement visible at top of chat
- Turn counter displays current count, warns at 15 turns
- "New Problem" button resets: problem, messages, turn counter, errors
- Auto-scroll to newest message
- Loading states during API calls
- ConversationState managed in ChatInterface component

## Priority
MVP Critical

## Effort
Large (6-8 hours)

## Dependencies
Story 1 (API Security & Proxy Setup)

## Technical Notes

### Component Structure
```
ChatInterface (owns ConversationState, UIState)
├─ ProblemInput
│  └─ textarea + "Start" button
├─ MessageList
│  └─ maps over messages, renders each
└─ uses conversation-manager.ts
   └─ uses api-client.ts
```

### State Shape
```typescript
// ConversationState
{
  problemStatement: string;
  messages: Message[];  // { role, content, timestamp }
}

// UIState
{
  isLoading: boolean;
  error: string | null;
  imagePreviewUrl: string | null;
}
```

### Key Functions
- `handleProblemSubmit(problem: string)` - Initialize conversation
- `handleSendMessage(content: string)` - Send student message
- `handleReset()` - Clear state, return to input view
- Auto-scroll: Use `useEffect` + `scrollIntoView` on messages change

### UI/UX Details
- Student messages: Right-aligned, blue background
- Tutor messages: Left-aligned, gray background
- Turn counter: Bottom-right corner, yellow at 15+ turns
- Loading: Spinner in message input area
- Problem statement: Sticky header with gray background

## Definition of Done
- [ ] ProblemInput component renders with validation
- [ ] ChatInterface manages ConversationState correctly
- [ ] Messages display with visual distinction (student vs tutor)
- [ ] Problem statement visible at top during chat
- [ ] Turn counter increments and shows warning at 15
- [ ] "New Problem" button resets all state correctly
- [ ] Auto-scroll works on new messages
- [ ] Loading states display during API calls
- [ ] Error states display with clear messages
- [ ] Manually tested: Enter problem → Chat → Reset → New problem
