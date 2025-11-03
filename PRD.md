# AI Math Tutor - Refined PRD
**Project:** Socratic Math Learning Assistant  
**Timeline:** 5 days (Nov 3-7, 2025)  
**Focus:** Dialogue quality over feature breadth

---

## Executive Summary

Build an AI tutor that guides students through math problems using Socratic questioning. The system accepts problems via text or image upload and helps students discover solutions through guided dialogue—never giving direct answers.

**Core Success Metric:** Successfully guide students through 5 different problem types using Socratic method with zero direct answer-giving.

---

## Scope Decisions

### ✅ IN SCOPE (MVP)
- Text input + image upload for problem entry
- Socratic dialogue engine (the hard part)
- Math rendering (LaTeX/KaTeX)
- Clean chat interface
- 5 problem types that work in text-only format

### ❌ OUT OF SCOPE (Post-MVP)
- Real-time voice with interruption handling
- Interactive whiteboard/canvas
- Geometry problems requiring visual diagrams
- Animated avatar
- Problem generation

### 🎯 STRETCH (Only if ahead by Day 5)
- Simple voice mode (push-to-talk, no interruption)
- Conversation history/export
- Difficulty level selector

---

## Core Features

### 1. Problem Input
**Text Entry:**
- Simple textarea input
- Support for basic math notation (2x + 5 = 13)

**Image Upload:**
- Upload button + drag-drop
- Process with Claude Vision API (Sonnet 4.5)
- Show extracted text for user verification/correction
- **Constraint:** Optimize for printed/typed math (handwritten is stretch)

**Tech:** React dropzone + Claude Vision API

### 2. Socratic Dialogue Engine
**The Critical Component - This is 60% of project difficulty**

**Rules:**
1. NEVER give direct answers
2. Ask ONE guiding question at a time  
3. Progress through solution stages: Understand → Plan → Execute → Verify
4. Provide concrete hints after 2 stuck attempts (but still no answers)
5. Validate student reasoning before advancing

**Implementation:**
- Single well-crafted system prompt with examples
- Maintain conversation context (problem + history)
- Track solution stage in conversation state

**Quality Gates:**
- Zero direct answer-giving across all test scenarios
- Complete solution guidance in <10 turns
- Natural conversation flow (not robotic)

### 3. Math Rendering
- KaTeX or MathJax for LaTeX rendering
- Support inline ($...$) and block ($$...$$) math
- Graceful fallback if LaTeX malformed

**Tech:** `react-katex` or `react-markdown` + `remark-math` + `rehype-katex`

### 4. Chat Interface
- Clean, simple design (ChatGPT-style)
- Message history with user/tutor distinction
- Image preview for uploaded problems
- Loading states during API calls

**Tech:** Next.js with React components, TypeScript, Tailwind CSS

---

## Test Problem Suite

### Problem Set (MVP)

1. **Simple Algebra**
   - Problem: `2x + 5 = 13`
   - Expected turns: 4-6
   - Tests: Basic isolation, inverse operations

2. **Multi-step Algebra**
   - Problem: `3(x - 4) = 2x + 5`
   - Expected turns: 5-7
   - Tests: Distribution, combining like terms

3. **Word Problem**
   - Problem: "Sarah has 3 times as many apples as John. Together they have 24 apples. How many does John have?"
   - Expected turns: 6-8
   - Tests: Variable assignment, equation setup

4. **Fractions**
   - Problem: `(1/2)x + 3 = 7`
   - Expected turns: 4-6
   - Tests: Fraction operations, clearing denominators

5. **Systems of Equations**
   - Problem: `x + y = 10` and `x - y = 4`
   - Expected turns: 7-10
   - Tests: Multi-variable reasoning, substitution/elimination

**Why these problems:**
- All work in pure text (no visual diagrams needed)
- Progressive complexity demonstrates capability
- Cover different mathematical concepts
- Can be solved via Socratic dialogue effectively

---

## Technical Architecture

### Tech Stack
- **Frontend:** Next.js (React + TypeScript + Tailwind CSS)
- **Backend:** Next.js API Routes (serverless functions for API key security)
- **Math Rendering:** KaTeX
- **Vision:** Claude API (Sonnet 4.5 with vision)
- **LLM:** Claude API (Sonnet 4.5)
- **Deployment:** Vercel (integrated Next.js support)

### LLM Configuration
- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4.5-20241022`)
- **Temperature:** 0.4 (lower for consistency, can tune per problem type if needed)
- **Max Tokens:** 500 (Socratic responses should be brief - one question at a time)
- **Why Sonnet 4.5:** Best instruction-following, excellent at maintaining rules (never give answers)

### Cost Management

**Estimated API Costs:**
- Claude Sonnet 4.5: ~$3/1M input tokens, ~$15/1M output tokens
- Vision API: ~$4.80/1M input tokens for images
- **Total project estimate:** $20-50 for 5 days of testing

**Safety Measures:**
- ⚠️ **CRITICAL: Set $50 spending limit in Anthropic Console before starting** (Settings → Billing → Usage Limits)
- Monitor usage daily at console.anthropic.com
- Each test conversation ~500-1000 tokens (input) + 200-400 tokens (output)
- ~100 test conversations ≈ $2-5
- Image processing: 10 images ≈ $0.50

**Warning:** Without spending limits, bugs in retry logic or infinite loops could cost hundreds of dollars overnight.

### API Key Security

**Problem:** Pure frontend React apps expose API keys in the browser, allowing anyone to steal credentials and rack up charges.

**Solution:** Use Next.js API Routes as a backend proxy.

**Architecture:**
```
Browser → Next.js API Route (/api/chat) → Claude API
        (no API key)              (API key in env vars)
```

**Implementation:**
```typescript
// /pages/api/chat.ts (or /app/api/chat/route.ts for App Router)
export default async function handler(req, res) {
  const apiKey = process.env.CLAUDE_API_KEY; // Server-side only

  // Forward request to Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: { 'x-api-key': apiKey },
    body: JSON.stringify(req.body)
  });

  return res.json(await response.json());
}
```

**Security Benefits:**
- API key never exposed to browser
- Rate limiting can be added server-side
- Request validation/sanitization possible
- Cost monitoring easier

**Setup Time:** ~30 minutes (Next.js setup via `npx create-next-app@latest` with TypeScript and Tailwind options)

### System Architecture
```
┌─────────────────────────────────────────┐
│         React Chat Interface            │
│  (Text input + Image upload + Display)  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│      Vision API (if image upload)       │
│     Extract problem text from image     │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│         Conversation Manager            │
│   - Maintains chat history              │
│   - Formats context for LLM             │
│   - Coordinates API calls               │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│         Socratic Tutor (LLM)            │
│   System prompt + conversation context  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       Math Renderer (KaTeX)             │
│   Display formatted equations           │
└─────────────────────────────────────────┘
```

### Component Responsibilities

**Conversation Manager:**
- Maintain message history
- Format context for LLM (problem + history)
- Coordinate API calls

**API Client:**
- Handle Claude API calls (via Next.js API routes)
- Retry logic with exponential backoff
- Error handling and graceful degradation

**Prompt Builder:**
- Inject system prompt with Socratic rules
- Format conversation context
- Hint escalation logic lives in prompt text

**Separation of Concerns:** Frontend shuttles messages, LLM handles pedagogy.

### Error Handling Strategy

**API Failures:**
- Exponential backoff retry (3 attempts)
- User-facing message: "Tutor temporarily unavailable, retrying..."
- Fallback: Suggest refreshing or trying text input

**Vision API Failures:**
- Graceful degradation: Show error, prompt user to type problem manually
- Partial success: Show extracted text with "Please verify/correct this"
- Don't block workflow on OCR failures

**Rate Limiting:**
- Detect 429 status codes
- Show clear message: "Too many requests, please wait 30s"
- Disable input during cooldown

**Network Issues:**
- Detect timeout/offline state
- Preserve conversation state in localStorage
- Allow recovery when connection restored

### State Management

**Design Principle:** Keep state minimal. Let the LLM handle pedagogy logic (stages, hint escalation) via conversation context. Frontend only manages data and UI.

**Conversation State (Domain):**
```typescript
interface ConversationState {
  problemStatement: string;
  messages: Message[];
}

interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}
```

**UI State (Presentation):**
```typescript
interface UIState {
  isLoading: boolean;
  error: string | null;
  imagePreviewUrl: string | null;
}
```

**Why This is Simple:**
- `currentStage`: Implicit in conversation flow, tracked by LLM
- `studentStuckCount`: LLM infers from message history
- `problemSource`: Show in first message if needed, don't carry state
- UI concerns (loading, errors) kept separate from domain logic

---

## Socratic Prompt Framework

### System Prompt Structure

**Key Design:** Let the LLM track stages and hint escalation implicitly via conversation history. No explicit state needed.

```
You are a patient math tutor using the Socratic method.

CRITICAL RULES:
1. NEVER give direct answers or show complete solution steps
2. Ask ONE guiding question at a time
3. Wait for student response before continuing
4. Validate student reasoning before advancing

SOLUTION STAGES (Track implicitly):
Progress naturally through these stages based on conversation flow:
1. Understand: Help student identify knowns/unknowns
2. Plan: Guide them to choose a solution method
3. Execute: Walk through steps with questions
4. Verify: Help them check their answer

HINT ESCALATION (Infer from history):
- Review the last 3 student responses to gauge understanding
- Confusion signals: "I don't know", wrong answers, requests for help
- If 2+ confusion signals detected, escalate from open questions to concrete hints
- Concrete hints provide specific direction without giving the answer
- Example: Instead of "What should we do?" → "What operation undoes adding 5?"

EXAMPLES:
[3-5 complete example dialogues showing good vs bad tutoring]

CURRENT PROBLEM: {problem}
FULL CONVERSATION HISTORY: {messages}
```

**Why This Works:**
- LLM naturally progresses through stages by reading conversation context
- Stuck count is implicit: LLM sees "I don't know" twice in last 3 messages
- No frontend state management needed
- Easier to adjust pedagogy by editing prompt, not code

---

## Development Timeline

### Day 1: Foundation + Prompt Testing
**Morning:**
- [ ] **Set Claude API spending limit to $50** (Anthropic Console → Settings → Billing)
- [ ] Add API usage monitoring reminder (check daily at anthropic.com/account)
- [ ] Create initial Socratic prompt with examples
- [ ] **Test prompt in Claude.ai chat first** (don't build UI yet!)
- [ ] Manual test with Problem #1 (simple algebra) - 5 conversations
- [ ] Refine prompt until it works reliably in chat
- [ ] Set up Next.js project with TypeScript + Tailwind
- [ ] Build basic chat UI (hardcoded messages)

**Afternoon:**
- [ ] Create Next.js API route (/api/chat) to proxy Claude API calls
- [ ] Set up .env.local with CLAUDE_API_KEY
- [ ] Integrate API route into frontend
- [ ] Test Problem #1 with live API
- [ ] Review conversations with quality checklist
- [ ] Refine prompt based on failures
- [ ] Test Problems #2 and #3

**End of Day Goal:** Prompt successfully guides through 3/5 problems

**Critical Success Factor:** Don't build UI until prompt works in Claude.ai!

---

### Day 2: Complete Problem Coverage + Image Upload
**Morning:**
- [ ] Build conversation logging system
- [ ] Test Problems #4 and #5
- [ ] Implement hint escalation logic
- [ ] Final prompt refinement

**Afternoon:**
- [ ] Add image upload UI component
- [ ] Integrate Claude Vision API
- [ ] Create 10 test problem images (printed/typed text, clear font, PNG/JPG format)
- [ ] Test each sample image with Vision API
- [ ] Save working images to /public/test-images with numbered names (problem-01.png, etc.)
- [ ] Add text correction interface for bad OCR

**End of Day Goal:** All 5 problems work reliably, image parsing functional

**Note on Test Images:** Focus on printed/typed math problems for MVP. Handwritten is stretch goal. Use clear fonts, high contrast, well-lit photos or screenshots.

---

### Day 3: Math Rendering + Polish
**Morning:**
- [ ] Integrate KaTeX for math rendering
- [ ] Test LaTeX rendering with all problem types
- [ ] Add error handling for malformed LaTeX
- [ ] Implement loading states

**Afternoon:**
- [ ] UI polish (styling, animations)
- [ ] Error handling (API failures, network issues)
- [ ] Add conversation reset button
- [ ] Mobile responsiveness check

**End of Day Goal:** Polished, working application

---

### Day 4: Testing + Documentation
**Morning:**
- [ ] Comprehensive testing of all 5 problem types
- [ ] Test edge cases (very long conversations, unclear student input)
- [ ] Fix any bugs discovered

**Afternoon:**
- [ ] Write README with setup instructions
- [ ] Document 5 example walkthroughs
- [ ] Write prompt engineering notes
- [ ] Prepare for deployment

**End of Day Goal:** Production-ready code, complete documentation

---

### Day 5: Demo + Deployment
**Morning:**
- [ ] Deploy to Vercel (connect GitHub repo, configure CLAUDE_API_KEY env var)
- [ ] Verify API routes work in production (check server logs)
- [ ] Final smoke testing on deployed version
- [ ] Script demo video (what to show, order)
- [ ] Practice demo run-through

**Afternoon:**
- [ ] Record 5-minute demo video
- [ ] Edit/upload demo
- [ ] Final GitHub cleanup
- [ ] Submit deliverables

**End of Day Goal:** All deliverables submitted

---

## Quality Assurance Framework

### Conversation Quality Checklist
After each test conversation, verify:

- [ ] Never stated the final answer
- [ ] Never showed a complete solution step  
- [ ] Asked logical progression of questions
- [ ] Provided hint after 2+ struggles
- [ ] Hint was concrete but not answer-giving
- [ ] Adapted to student's understanding level
- [ ] Validated student's correct reasoning
- [ ] Gently corrected misconceptions

### Testing Protocol
For each of 5 problems, run these scenarios:

1. **Perfect Student:** Answers correctly at each step
2. **Struggling Student:** Wrong answers, needs hints
3. **Confused Student:** "I don't know" multiple times
4. **Skip-Ahead Student:** Tries to jump to answer
5. **Partial Understanding:** Gets some steps, not others

**Success Criteria:**
- Problem solved in <10 turns
- Natural conversation flow
- Zero answer-giving
- Appropriate hint timing

---

## Deliverables

### 1. Deployed Application
- Public URL (Vercel recommended for Next.js - one-click deploy from GitHub)
- OR: Local setup with clear README instructions
- Works on desktop + mobile
- Environment variables configured (CLAUDE_API_KEY)

### 2. GitHub Repository
```
/src
  /components
    Chat.tsx              # Main chat interface
    MessageList.tsx       # Display message history
    ProblemInput.tsx      # Text input for problems
    ImageUpload.tsx       # Image upload + preview
  /lib
    conversationManager.ts  # Maintain message history, coordinate calls
    apiClient.ts           # Claude API integration, retry logic, errors
    promptBuilder.ts       # Build system prompt, format context
  /prompts
    socraticTutor.ts      # System prompt with Socratic rules
  /types
    conversation.ts       # ConversationState, Message interfaces
    ui.ts                # UIState interface
/pages (or /app for App Router)
  /api
    /chat.ts             # Next.js API route - proxy to Claude API
    /vision.ts           # Next.js API route - image processing
  index.tsx              # Main page with chat interface
/public
  /test-images (10 sample problems)
/docs
  example-walkthroughs.md
  prompt-engineering-notes.md
  state-management.md   # Explains simplified state design
README.md
.env.local               # CLAUDE_API_KEY (gitignored)
next.config.js           # Next.js configuration
```

### 3. Documentation

**README.md:**
- Project overview
- Tech stack (Next.js, TypeScript, Tailwind, Claude API)
- Setup instructions (`npm install`, `npx create-next-app@latest`)
- Environment variables needed (`.env.local` with `CLAUDE_API_KEY`)
- How to run locally (`npm run dev`)
- Deployment instructions (Vercel deployment, environment variable configuration)

**example-walkthroughs.md:**
- 5 complete example conversations (one per problem type)
- Show full dialogue from problem input to solution
- Annotate key moments (good questions, hint timing, etc.)

**prompt-engineering-notes.md:**
- Initial prompt design decisions
- What worked/didn't work
- Iterations made during testing
- Tips for future improvements

### 4. Demo Video (5 minutes)
**Structure:**
1. Introduction (30s): What is it, why Socratic method matters
2. Text Input Demo (1m): Show Problem #1 walkthrough
3. Image Upload Demo (1m): Upload problem, extract, solve
4. Complex Problem (1.5m): Show multi-step or word problem
5. Stretch Feature (1m): If implemented (voice, history, etc.)
6. Conclusion (30s): Recap, lessons learned

**Technical Notes:**
- Use Loom or OBS for recording
- Show problem types diversity
- Highlight "never gives answers" behavior
- Use demo problems you've tested thoroughly

---

## Risk Mitigation

### High-Risk Areas

**1. Socratic Dialogue Quality (60% of difficulty)**
- **Risk:** LLM gives answers despite prompting
- **Mitigation:** Extensive testing Day 1-2, prompt with detailed examples, test in Claude.ai before building UI
- **Fallback:** If one problem type breaks, swap for different problem
- **Key Strategy:** Don't build UI until prompt works reliably

**2. LLM Non-Determinism**
- **Risk:** Same prompt produces inconsistent results across test runs
- **Mitigation:**
  - Test each problem type 10+ times to identify patterns
  - Lower temperature parameter (0.3-0.5 for more consistency)
  - Document failure cases and edge cases
  - Have fallback prompt strategies ready (more structured, more examples)
- **Fallback Options:**
  - Fallback A: More structured prompt with strict stage gates
  - Fallback B: Two-shot prompting with full example dialogues
  - Fallback C: Explicit stage tracking if LLM can't handle implicit

**3. Image Parsing Reliability**
- **Risk:** OCR misreads symbols (x vs ×, 2 vs z)
- **Mitigation:** Start with printed text, add correction UI, test early
- **Fallback:** Make text input primary, image as "nice to have"

**4. Time Management**
- **Risk:** Over-engineering features, running out of time
- **Mitigation:** Strict scope adherence, test before building UI
- **Fallback:** Cut stretch features, focus on core 5 problems working well

**5. Conversation Length & Token Limits**
- **Risk:** Very long conversations (20+ turns) hit Claude's context window limits
- **Context Window:** Claude Sonnet 4.5 has 200K tokens (generous, but finite)
- **Mitigation:**
  - All test problems designed to solve in <10 turns (already planned)
  - Add UI turn counter with warning at 15 turns: "This is taking longer than expected. Consider starting fresh."
  - Graceful error handling if API returns context length error
  - Track conversation length in state for monitoring
- **Fallback (Post-MVP):** Implement conversation summarization to compress early history
- **MVP Risk Level:** LOW - 10-turn target keeps conversations well under limits

### Decision Points

**Day 2 End:** If <3 problems working reliably
→ Cut image upload to stretch, focus on prompt quality

**Day 3 End:** If major bugs remain
→ Cut stretch features, polish core experience

**Day 4 End:** If not deployment-ready
→ Submit local version with clear setup docs

---

## Evaluation Criteria

### Pedagogical Quality (35%)
- Uses genuine Socratic questioning
- Never gives direct answers
- Guides discovery vs. instruction
- Adapts to student understanding
- Provides appropriate hints when stuck

### Technical Implementation (30%)
- Image parsing works consistently
- Conversation context maintained
- Math rendered properly
- Clean code structure
- Error handling

### User Experience (20%)
- Intuitive interface
- Responsive design
- Clear feedback (loading, errors)
- Natural conversation flow
- Easy to test/demo

### Innovation (15%)
- Quality of prompt engineering
- Thoughtful feature choices
- Polished execution
- Stretch features (if implemented)

---

## Success Metrics

**Minimum Viable Success:**
- ✅ 5 problem types solve correctly
- ✅ Zero instances of direct answer-giving
- ✅ Image upload extracts problems (even if imperfect)
- ✅ Deployed or easily runnable locally
- ✅ Complete documentation

**Excellent Success:**
- ✅ All above +
- ✅ Natural, non-robotic dialogue
- ✅ Robust image parsing (90%+ accuracy)
- ✅ One stretch feature implemented well
- ✅ Comprehensive testing demonstrated

---

## Post-MVP Roadmap

**Version 2.0 Features:**
1. Interactive whiteboard for geometry + visual problems
2. Simple voice mode (push-to-talk)
3. Problem generator (create similar practice problems)
4. Progress tracking across sessions
5. Multi-student support (teacher dashboard)

**Technical Debt to Address:**
- Add conversation persistence (database or localStorage)
- Response validation/filtering layer
- Automated testing suite for dialogue quality
- Temperature/parameter tuning per problem type
- Analytics: Track average turns-to-solution, common failure patterns

**Architecture Evolution Notes:**
- Current design keeps state minimal and pushes logic to LLM
- If LLM can't handle implicit tracking, fallback to explicit state (see Risk #2)
- Avoid premature optimization - only add state if LLM proves unreliable

---

## Appendix: Prompt Engineering Examples

### Good Socratic Exchange
```
Student: "2x + 5 = 13, what's x?"

Tutor: "To find x, we need to isolate it on one side. What operations 
are currently being applied to x?"

Student: "It's being multiplied by 2 and then 5 is added"

Tutor: "Exactly! To undo these operations, which should we undo first - 
the multiplication or the addition?"

Student: "The addition?"

Tutor: "Perfect! You're applying the reverse order of operations. 
What operation undoes adding 5?"

Student: "Subtracting 5"

Tutor: "Right! Try subtracting 5 from both sides and tell me what you get."

Student: "2x = 8"

Tutor: "Excellent! Now what operation will isolate x?"
```

### Bad Example (Too Vague)
```
Student: "2x + 5 = 13, what's x?"

Tutor: "What do you think you should do?"

Student: "I don't know"

Tutor: "Look at the equation and think about it."

Student: "I'm confused"

Tutor: "What have you tried?"
```

### Bad Example (Gives Answers)
```
Student: "2x + 5 = 13, what's x?"

Tutor: "First subtract 5 from both sides to get 2x = 8, 
then divide both sides by 2 to get x = 4"
```

---

## Contact
Mark (Developer)  
Bootcamp: Gauntlet C3 Project  
Timeline: Nov 3-7, 2025
