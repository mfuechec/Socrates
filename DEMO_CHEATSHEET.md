# Socrates Demo - Quick Reference Cheat Sheet

## 🎯 One-Liner Pitch
> "Socrates is a Socratic AI math tutor that uses solution path scaffolding and research-backed learning algorithms to create adaptive, spaced-repetition practice—not just another GPT chatbot."

---

## 📝 Problem Sequence

### Problem 1: `2x + 5 = 13`
**Goal:** Show Socratic dialogue + solution path
**Strategy:** Solve efficiently (4 turns) → Get "mastered"
**Key Console Output:** `[Solution Path Generated] 4 steps...`

### Problem 2: `x² - 5x + 6 = 0`
**Goal:** Show adaptive hints + struggle detection
**Strategy:** Say "I'm not sure" twice → Trigger level 2 hints
**Key Console Output:** `[Struggle Detection] Struggle level increased: 1 → 2`

### Problem 3: Image Upload
**Goal:** Show OCR + LaTeX rendering
**Strategy:** Upload handwritten or screenshot: `∫x² dx`
**Key Console Output:** LaTeX renders as ∫x² dx

---

## 💬 Key Talking Points

### Act 1: Experience (2 min)
- "It's asking questions, not giving answers"
- "Pre-analyzed the problem to generate a 4-step roadmap"
- "Adaptive hints based on struggle level"

### Act 2: Intelligence (3 min)
- "SM-2 algorithm—same as Anki"
- "Struggle-weighted mastery (hints, mistakes, clarifications)"
- "Building a personalized learning graph"

### Act 3: Differentiation (2 min)
- "Solution path API pre-analysis"
- "Database tracks 15 topics with full SM-2 state"
- "This is a learning platform, not a chatbot"

---

## 🎯 What to Point To

### In Console:
```
✅ [Solution Path Generated] 4 steps
✅ [Mastery - Step-Based] efficiency 100% → mastered
✅ [Struggle Detection] Struggle level increased: 1 → 2
✅ [Mastery - Struggle-Weighted] Base: competent, Struggle score: 45%
✅ [SM-2 Update] Ease Factor: 2.50 → 2.18, Interval: 1 days → 1 days
```

### In Code:
- `src/lib/learning-algorithm.ts:118-164` - Struggle-weighted mastery
- `src/lib/spaced-repetition.ts:42-81` - SM-2 implementation
- `LEARNING_STRATEGIES.md:349-398` - Product roadmap

### In Network Tab:
- `POST /api/analyze-problem` → Show solution path JSON

---

## ❓ Expected Questions

**"Just a GPT wrapper?"**
→ "No—pre-analysis generates solution paths, struggle-weighted mastery, SM-2 scheduling"

**"How prevent gaming hints?"**
→ "Each hint = 15% struggle penalty. >60% = can't get 'mastered'"

**"How scale to other subjects?"**
→ "Already handles 15 topics. Problem-agnostic architecture"

**"Retention strategy?"**
→ "Roadmap for streaks/achievements in LEARNING_STRATEGIES.md"

---

## ✅ Pre-Flight Checklist

- [ ] Server running at localhost:3000
- [ ] DevTools console open + visible
- [ ] `learning-algorithm.ts` open in editor
- [ ] Sample image ready for upload
- [ ] Read EXPECTED QUESTIONS section

---

## 🏆 Success = They Say:

- "More sophisticated than expected"
- "Solution path pre-analysis is clever"
- "Like that you track struggle, not just answers"
- "Could replace human tutor for practice"
