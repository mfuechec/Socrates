# Socrates AI Math Tutor - Demo Script

## 🎯 Demo Objective
Show product-minded developers that Socrates is **not a GPT wrapper**, but a sophisticated learning platform with pedagogical intelligence.

**Total Time:** 7-8 minutes

---

## 🎬 Demo Flow

### **Setup (30 seconds)**

**Before starting:**
1. Open browser to `http://localhost:3000`
2. Open DevTools Console (⌘+Option+J) - Position side-by-side with app
3. Open `src/lib/learning-algorithm.ts` in editor (optional)
4. Clear any existing conversation

**Opening line:**
> "I'm going to show you Socrates—an AI math tutor that uses Socratic dialogue, solution path scaffolding, and research-backed learning algorithms. Watch what happens when I solve a few problems."

---

## Act 1: The Socratic Experience (2 minutes)

### **Problem 1: Simple Linear Equation (Baseline)**

**Input:**
```
Solve for x: 2x + 5 = 13
```

**What to do:**
- Type the problem naturally
- **Pause after submission** → Point to console

**What to say:**
> "Notice two things: First, it's not solving it for me—it's asking a question. Second, check the console..."

**Point to console output:**
```
[Solution Path Generated] 4 steps: Isolate variable term → Subtract 5 → ...
[Mastery - Step-Based] 4 steps, expected ~8 turns, actual X → efficiency Y% → competent
```

**What to say:**
> "Behind the scenes, it pre-analyzed the problem and generated a solution roadmap with 4 steps. Now it's guiding me through using Socratic questions."

**Continue conversation:**
- **You:** "Subtract 5 from both sides"
- **Tutor:** (Asks what you get)
- **You:** "2x = 8"
- **Tutor:** (Asks what to do next)
- **You:** "Divide by 2, so x = 4"
- **Tutor:** (Confirms and marks complete)

**Point to console mastery assessment:**
```
[Mastery - Step-Based] 4 steps, expected ~8 turns, actual 4 → efficiency 100% → mastered
```

**What to say:**
> "Because I solved it efficiently in 4 turns (2 per step), it classified this as 'mastered'. Now watch what happens when I struggle..."

---

### **Problem 2: Quadratic with Intentional Struggle (Show Adaptive Hints)**

**Input:**
```
Solve: x² - 5x + 6 = 0
```

**What to do:**
1. First response: **"I'm not sure how to start"** (trigger hint level 1)
2. Second response: **"I still don't get it"** (trigger hint level 2)
3. Third response: **"(x - 2)(x - 3) = 0"**
4. Continue to completion

**Point to console after each hint:**
```
[Struggle Detection] Struggle level increased: 1 → 2
[Adaptive Hint] Providing level 2 hint: "Try finding two numbers that multiply to 6..."
```

**What to say:**
> "See how it detects struggle and provides progressively stronger hints? This isn't random—it's using the solution path to know exactly what conceptual support to give."

**After completion, point to mastery:**
```
[Mastery - Struggle-Weighted] Base: competent, Struggle score: 45%
  Hints: 2, Mistakes: 0, Clarifications: 1
  → Adjusted from competent to struggling
```

**What to say:**
> "Even though I got it right, the struggle-weighted algorithm detected my 2 hint requests and downgraded my mastery from 'competent' to 'struggling'. This prevents gaming the system by just guessing right."

---

## Act 2: The Intelligence Layer (3 minutes)

### **Point to Console - Learning Algorithm in Action**

**What to show (scroll through console):**
```
[Topic Classification] "x² - 5x + 6 = 0..." → quadratic-equations
[SM-2 Update] Topic: quadratic-equations
  Mastery: struggling (quality: 2)
  Ease Factor: 2.50 → 2.18
  Interval: 1 days → 1 days (reset due to struggle)
  Next Review: 2025-11-05
  Strength: 0.50 → 0.42
```

**What to say:**
> "Here's the magic. Every problem updates a learning profile using the SM-2 algorithm—the same spaced repetition system Anki uses. Because I struggled, it:
> - Lowered my ease factor (makes future reviews more frequent)
> - Reset my review interval to 1 day
> - Decreased my topic strength from 0.50 to 0.42
> - Scheduled a review for tomorrow
>
> This isn't just saving history. It's building a personalized learning graph."

---

### **Open Code - Show Implementation**

**Navigate to:** `src/lib/learning-algorithm.ts:118-164`

**Point to:**
```typescript
export function calculateMasteryWithStruggle(
  turnsTaken: number,
  struggleData: StruggleData, // ← Tracks hints, mistakes, clarifications
  problemType?: string,
  solutionPath?: SolutionPath,
  approachIndex: number = 0
): MasteryLevel {
  // Weight different struggle indicators
  const hintPenalty = hintsRequested * 0.15;      // Each hint = 15% penalty
  const mistakePenalty = incorrectAttempts * 0.2; // Each mistake = 20% penalty
  const clarificationPenalty = clarificationRequests * 0.1;

  const totalStruggleScore = Math.min(1.0, hintPenalty + mistakePenalty + clarificationPenalty);

  // Downgrade mastery based on struggle
  if (totalStruggleScore >= 0.6) {
    adjustedMastery = 'struggling'; // High struggle → force struggling
  } else if (totalStruggleScore >= 0.3) {
    // Moderate struggle → downgrade by 1 level
```

**What to say:**
> "This is the struggle-weighted mastery algorithm. It's not just counting turns—it's analyzing cognitive load. Each hint costs 15%, each mistake 20%, each clarification 10%. Above 60% struggle score, you can't earn 'mastered' status even if you're fast."

---

### **Show Strategic Product Thinking**

**Open:** `LEARNING_STRATEGIES.md`

**Scroll to summary (lines 349-398)**

**What to say:**
> "This document shows our product strategy mapped to cognitive science research. We've fully implemented 5 learning strategies:
> - ✅ Spaced Repetition (SM-2)
> - ✅ Mastery Learning (can't skip ahead)
> - ✅ Testing Effect (100% retrieval practice)
> - ✅ Active Learning (Socratic method)
> - ✅ Cognitive Load Reduction (solution path scaffolding)
>
> And we have a roadmap for 6 more, prioritized by learning impact. This isn't a side project—it's a real product vision."

---

## Act 3: The Differentiation (2 minutes)

### **Problem 3: Image Upload + LaTeX Rendering**

**What to do:**
1. Click image upload
2. Upload a handwritten math problem (or screenshot of: `∫x² dx`)
3. Let OCR process it

**What to say:**
> "Dual input modes—text or image upload with OCR. This works with handwritten problems, textbook screenshots, anything."

**Wait for response with LaTeX:**

**Point to rendered LaTeX:**
```
∫x² dx = x³/3 + C
```

**What to say:**
> "Clean LaTeX rendering with KaTeX. No janky markdown—proper mathematical notation."

---

### **Show Network Tab - Solution Path API**

**Open DevTools → Network Tab**

**Find:** `POST /api/analyze-problem`

**Show Response:**
```json
{
  "solutionPath": {
    "problemType": "integral",
    "approaches": [
      {
        "name": "Power Rule",
        "description": "Apply integration power rule",
        "difficulty": "beginner",
        "steps": [
          {
            "description": "Identify the power of x",
            "hints": [
              "What is the exponent on x?",
              "The power rule adds 1 to the exponent",
              "For x^n, the integral is x^(n+1)/(n+1)"
            ]
          },
          ...
        ]
      }
    ]
  }
}
```

**What to say:**
> "Before the first response, we call `/api/analyze-problem` to generate this solution path. Multiple approaches, progressive hints per step, difficulty-adjusted. This is why the Socratic dialogue stays coherent—it has a roadmap, not just turn-by-turn generation."

---

### **Show Database Structure (If Supabase deployed)**

**Open Supabase Dashboard → Database → `topic_progress` table**

**Point to columns:**
- `topic` (linear-equations, quadratic-equations, etc.)
- `strength` (0.42, 0.87, etc.)
- `ease_factor` (2.18, 2.50, etc.)
- `interval_days` (1, 6, 15, etc.)
- `next_review` (timestamps)
- `review_count` (0, 1, 2, ...)

**What to say:**
> "This is the learning state. We're tracking 15 different math topics independently, each with full SM-2 state (ease factor, interval, next review). When a user logs in, we can say: 'You have 3 reviews due today, and your weakest topic is systems of equations—let's practice that.'"

---

## 🎤 Closing (1 minute)

### **The Differentiators Summary**

**What to say:**
> "So to recap what makes Socrates different:
>
> 1. **Pedagogical Intelligence** - Not just ChatGPT in a box. Struggle-weighted mastery, SM-2 spaced repetition, adaptive hint systems.
>
> 2. **Solution Path Architecture** - Pre-analysis generates roadmaps with multi-approach scaffolding.
>
> 3. **Production-Grade Engineering** - TypeScript strict mode, fallback systems, type-safe APIs, proper error handling.
>
> 4. **Data-Driven Personalization** - Every interaction builds a learning profile enabling targeted practice.
>
> 5. **Research-Backed Strategy** - Built on cognitive science: Bloom's mastery learning, Ebbinghaus spaced repetition, Roediger's testing effect.
>
> This is a learning platform, not a chatbot."

---

## 🎯 Expected Questions & Perfect Answers

### Q: "What happens if GPT just gives the answer instead of asking questions?"

**A:** "We have validation layers:
1. System prompt explicitly forbids direct answers
2. Response must include annotations marking pedagogical actions
3. `annotation-validator.ts` checks for valid Socratic structure
4. If validation fails, we retry with stronger constraints

Check `src/lib/annotation-validator.ts:11` for implementation."

---

### Q: "How do you prevent students from just asking for hints until they get the answer?"

**A:** "Two mechanisms:
1. **Struggle scoring** - Each hint request increases struggle score (15% penalty). Above 60%, you can't earn 'mastered' status.
2. **SM-2 scheduling** - Low mastery → shorter review intervals → you'll see this problem again tomorrow.

The system incentivizes genuine understanding because gaming it just means more practice."

---

### Q: "Can this scale beyond algebra to calculus, geometry, etc?"

**A:** "Absolutely. The topic inference system already handles 15 topics including calculus, trigonometry, and geometry (see `src/lib/learning-algorithm.ts:220-343`). The solution path generator adapts to any problem type—it's problem-agnostic. We've tested it on everything from arithmetic to differential equations."

---

### Q: "What's your retention strategy?"

**A:** "We have a roadmap in `LEARNING_STRATEGIES.md` for gamification:
- **Priority 2 (8-12 hours):** Streak counters, progress visualization, achievement badges
- **Already built:** The hard part—spaced repetition scheduling, weak topic identification, mastery tracking

The engagement layer is straightforward to add on top of the pedagogical engine."

---

### Q: "Why TypeScript instead of Python for ML/learning algorithms?"

**A:** "Two reasons:
1. **Full-stack coherence** - Next.js serverless functions mean one codebase, one deployment, no backend/frontend split
2. **Type safety** - Learning algorithms have complex state. TypeScript prevents entire classes of bugs.

The algorithms (SM-2, exponential weighted averages, mastery classification) are pure math—language doesn't matter. What matters is correctness and maintainability."

---

## 📊 Success Metrics for This Demo

**You nailed it if they say:**
- ✅ "This is way more sophisticated than I expected"
- ✅ "The solution path pre-analysis is clever"
- ✅ "I like that you're tracking struggle, not just answers"
- ✅ "The learning science backing is impressive"
- ✅ "This could actually replace a human tutor for practice"

**Red flags (means you rushed):**
- ❌ "So it's just ChatGPT with a system prompt?"
- ❌ "How is this different from [other AI tutor]?"
- ❌ "Seems like a thin wrapper..."

---

## 🚀 Optional: Advanced Demo Extensions

### **If they're really engaged (10-15 min demo):**

1. **Show Multi-Approach System**
   - Problem: "A rectangle has perimeter 20 and area 24. Find dimensions."
   - Point out: "This generates 2 approaches: algebraic (system of equations) and geometric (factor pairs)"

2. **Show Topic Inference Cascade**
   - Open `learning-algorithm.ts:195-214`
   - Explain: "LLM-based semantic understanding → weighted scoring → keyword fallback"
   - Show console logs for each tier

3. **Live Code Review**
   - Open `spaced-repetition.ts:42-81`
   - Walk through SM-2 calculation line by line
   - Point out: "This is the exact algorithm from Wozniak's 1990 paper"

4. **Show Test Coverage** (if you have tests)
   - `npm test`
   - Point out test files for critical paths

---

## 🎁 Leave-Behind Materials

**After demo, send them:**
1. Link to `LEARNING_STRATEGIES.md` - Shows strategic thinking
2. Link to GitHub repo (if public) - Shows code quality
3. This demo script - Shows presentation skills
4. Architecture diagram (if you create one with `*create-architecture`)

---

## 💡 Pro Tips

**DO:**
- ✅ Let console logs run in background—they tell the story
- ✅ Intentionally struggle on Problem 2—it's more impressive
- ✅ Use precise terminology ("SM-2 algorithm", "struggle-weighted mastery")
- ✅ Point to specific line numbers in code
- ✅ Show confidence—this is sophisticated work

**DON'T:**
- ❌ Rush through Act 2 (the intelligence layer is your moat)
- ❌ Apologize for "just a prototype"—this is production-quality
- ❌ Skip the console logs—they're visual proof of complexity
- ❌ Get defensive if they ask hard questions—you built this thoughtfully

---

## 🎬 Ready to Demo?

**Pre-flight checklist:**
- [ ] Server running (`npm run dev`)
- [ ] DevTools console open and visible
- [ ] `learning-algorithm.ts` open in editor
- [ ] `LEARNING_STRATEGIES.md` bookmarked
- [ ] Sample handwritten math problem ready for image upload
- [ ] Practiced the "intentional struggle" on Problem 2
- [ ] Read the "Expected Questions" section

**You got this! 🚀**
