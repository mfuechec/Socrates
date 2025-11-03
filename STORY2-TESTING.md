# Story 2: Chat Interface Testing Guide

## Prerequisites

1. **Add your Claude API key** to `.env.local`:
   ```bash
   CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**: http://localhost:3000

## Manual Testing Checklist

### 1. Problem Input Screen

✅ **Test: Initial Load**
- [ ] Page displays "Socrates Math Tutor" title
- [ ] Textarea is empty and focused
- [ ] "Start Tutoring Session" button is disabled
- [ ] Character counter shows "500 characters remaining"

✅ **Test: Input Validation**
- [ ] Type "2x + 5 = 13" → Button becomes enabled
- [ ] Character counter updates correctly
- [ ] Approaching limit (450+ chars) → Orange warning appears
- [ ] At limit (500 chars) → Cannot type more

✅ **Test: Submit Problem**
- [ ] Click "Start Tutoring Session" → Transitions to chat view
- [ ] Problem statement appears in sticky header
- [ ] Chat interface loads with empty message list
- [ ] Message input field is ready

### 2. Chat Interface

✅ **Test: Header Display**
- [ ] "Socrates Math Tutor" title visible
- [ ] "Turn 0" displayed initially
- [ ] "New Problem" button visible
- [ ] Problem statement visible in gray sticky header

✅ **Test: Send First Message**
- [ ] Type "I don't know where to start" in input
- [ ] Character counter shows "27/1000 characters"
- [ ] Click "Send" button
- [ ] Button changes to "Sending..." and is disabled
- [ ] Student message appears (blue, right-aligned)
- [ ] Shows "You" label and timestamp
- [ ] After ~2-5 seconds, tutor response appears (gray, left-aligned)
- [ ] Shows "Socrates" label and timestamp
- [ ] Turn counter updates to "Turn 1"

✅ **Test: Conversation Flow**
- [ ] Send another message → Turn counter increments
- [ ] Messages appear in chronological order
- [ ] Auto-scroll to newest message
- [ ] Student messages: Blue background, right side
- [ ] Tutor messages: Gray background, left side
- [ ] Timestamps formatted correctly (HH:MM AM/PM)

✅ **Test: Turn Counter Warning**
- [ ] Send 15 messages total
- [ ] At turn 15, warning appears: "⚠ Consider starting a new problem"
- [ ] Warning is yellow/orange color
- [ ] Chat still functional after warning

✅ **Test: Message Input Validation**
- [ ] Empty message → Send button disabled
- [ ] Just whitespace → Send button disabled
- [ ] Valid message → Send button enabled
- [ ] Type 1000+ characters → Cannot exceed limit
- [ ] Character counter updates in real-time

✅ **Test: Loading States**
- [ ] While waiting for tutor response:
  - Message input field disabled
  - "Sending..." text on button
  - Cannot send new messages
- [ ] After response received:
  - Input re-enabled
  - Button back to "Send"
  - Can continue conversation

✅ **Test: Error Handling**
- [ ] If API fails:
  - Error message appears in red box above input
  - Input remains enabled (can retry)
  - Previous messages still visible
- [ ] If no API key set:
  - Error: "Claude API error. Please try again."
  - (Add valid key and restart server to fix)

### 3. Reset Functionality

✅ **Test: New Problem Button**
- [ ] Click "New Problem" during chat
- [ ] No confirmation dialog (instant reset)
- [ ] Returns to problem input screen
- [ ] All messages cleared
- [ ] Turn counter reset
- [ ] Error state cleared
- [ ] Can start new conversation

✅ **Test: Reset at Different States**
- [ ] Reset before sending any messages
- [ ] Reset during loading (while waiting for response)
- [ ] Reset after error state
- [ ] Reset with 15+ turns (with warning active)
- All should return to clean problem input screen

### 4. Responsive Design

✅ **Test: Different Screen Sizes**
- [ ] Desktop (1920px): Full width, comfortable spacing
- [ ] Tablet (768px): Responsive layout
- [ ] Mobile (375px): Stacks properly, scrollable
- [ ] Problem statement header remains sticky
- [ ] Messages don't overflow horizontally

### 5. Edge Cases

✅ **Test: Rapid Message Sending**
- [ ] Send message
- [ ] Immediately try to send another while loading
- [ ] Second message blocked (button disabled)
- [ ] First response completes
- [ ] Can then send second message

✅ **Test: Long Messages**
- [ ] Send 1000-character message
- [ ] Message displays with proper wrapping
- [ ] Doesn't break layout
- [ ] Scrollable if needed

✅ **Test: Special Characters**
- [ ] Problem: "x² + 3x - 5 = 0"
- [ ] Message: "What about fractions like 1/2?"
- [ ] Characters display correctly
- [ ] No encoding issues

## Example Test Conversation

**Problem:** Solve for x: 2x + 5 = 13

**Student:** I don't know where to start
**Tutor:** What operation is being applied to x in this equation?

**Student:** It's being multiplied by 2 and then 5 is added
**Tutor:** Exactly! To isolate x, what's the opposite of adding 5?

**Student:** Subtracting 5?
**Tutor:** That's right! What do you get when you subtract 5 from both sides?

**Student:** 2x = 8
**Tutor:** Perfect! Now, how can you isolate x from 2x?

**Student:** Divide by 2?
**Tutor:** Yes! What's 8 divided by 2?

**Student:** x = 4
**Tutor:** Excellent work! You solved it yourself! 🎉

**Expected Behavior:**
- ✅ Tutor never directly says "x = 4"
- ✅ Tutor asks guiding questions
- ✅ Tutor validates correct reasoning
- ✅ Conversation feels natural
- ✅ Turn counter shows 6 turns

## Known Limitations (MVP)

These are intentional for Story 2:
- ⚠ No LaTeX rendering yet (Story 5)
- ⚠ No image upload yet (Story 4)
- ⚠ No retry logic on API failure (Story 6)
- ⚠ Conversation lost on page refresh (no persistence - post-MVP)

## Definition of Done

Story 2 is complete when:
- [x] All components created and integrated
- [x] Build succeeds with no TypeScript errors
- [ ] All manual tests pass
- [ ] Conversation flow works end-to-end with real API key
- [ ] Turn counter increments correctly
- [ ] Reset button works properly
- [ ] Loading states display correctly
- [ ] Error messages appear on API failures
- [ ] UI is responsive on mobile/tablet/desktop
