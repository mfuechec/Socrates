# Story 3: Socratic Dialogue with Adaptive Hints

**As a** student
**I want** the tutor to guide me with questions and escalating hints
**So that** I learn problem-solving without being given direct answers

## Acceptance Criteria

- Tutor never states direct answers (e.g., "x = 5")
- Tutor asks guiding questions based on student responses
- After 2+ "I don't know" responses, provides more specific hints
- Hints remain Socratic (questions, not direct answers)
- Validates correct reasoning without solving
- Works for all 5 problem types (algebra, geometry, word problems, calculus, systems)
- Temperature 0.4, max_tokens 500
- System prompt built with Socratic method rules

## Priority
MVP Critical

## Effort
Very Large (10-14 hours - heavy prompt engineering)

## Dependencies
- Story 1 (API Security & Proxy Setup)
- Story 2 (Chat Interface & State Management)

## Technical Notes

### Prompt Engineering Strategy
1. **Test in Claude.ai first** (Day 1-2) before building UI
2. Iterate on system prompt with 5 problem types
3. Test scenarios: perfect student, struggling, confused, skip-ahead, partial understanding
4. Document prompt versions in `docs/prompt-engineering-notes.md`

### System Prompt Structure
```typescript
// src/prompts/socratic-tutor.ts
export const buildSystemPrompt = (problem: string) => `
You are a Socratic math tutor. Your goal is to guide students to discover solutions through questioning.

CORE RULES (NEVER VIOLATE):
1. Never give direct answers or final solutions
2. Never solve steps for the student
3. Ask questions that prompt thinking
4. Validate reasoning, not just answers

PROBLEM: ${problem}

ADAPTIVE HINT ESCALATION:
- If student struggles 1-2 times: Ask broader guiding questions
- If student struggles 3+ times: Provide more specific hints (still as questions)
- If student is very stuck: Suggest breaking problem into smaller steps

RESPONSE FORMAT:
- Keep responses brief (1-3 sentences)
- One question per response preferred
- Use LaTeX for math: $x^2$ or $$\\frac{1}{2}$$
`;
```

### Testing Checklist
Test each problem type with 5 scenarios:
- **Algebra:** 2x + 5 = 13
- **Geometry:** Area of triangle with base 10, height 6
- **Word Problem:** Train leaves at 60mph, another at 80mph, when do they meet?
- **Calculus:** Derivative of f(x) = x² + 3x
- **Systems:** Solve x + y = 5, x - y = 1

For each, test:
1. Perfect student (correct answers)
2. Struggling student (wrong answers, needs hints)
3. Confused student (multiple "I don't know")
4. Skip-ahead student (tries to jump to answer)
5. Partial understanding (gets some steps, not others)

### API Integration
```typescript
// lib/api-client.ts
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    problem: conversationState.problemStatement,
    messages: conversationState.messages
  })
});
```

### Quality Metrics
Per conversation:
- [ ] Never gave direct answer
- [ ] Logical question progression
- [ ] Provided hint after 2+ struggles
- [ ] Validated correct reasoning
- [ ] Solved in < 10 turns (typical)

## Definition of Done
- [ ] System prompt implemented in src/prompts/socratic-tutor.ts
- [ ] Prompt Builder module created (lib/prompt-builder.ts)
- [ ] API proxy calls Claude with system prompt + conversation history
- [ ] Temperature set to 0.4, max_tokens set to 500
- [ ] Tested all 5 problem types × 5 scenarios (25 tests total)
- [ ] Quality checklist passes for 90%+ of test conversations
- [ ] Documented prompt iterations in docs/prompt-engineering-notes.md
- [ ] No direct answers given in any test case
- [ ] Hint escalation works correctly (tested with "I don't know" × 3)
