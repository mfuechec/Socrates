# Demo Problems - Ready to Copy/Paste

## 🎯 Primary Demo Sequence (Use These)

### Problem 1: Linear Equation (Show Baseline)
```
Solve for x: 2x + 5 = 13
```
**Expected:** 4 steps, should get "mastered" if solved efficiently
**Demo Goal:** Show Socratic dialogue + solution path generation

---

### Problem 2: Quadratic (Show Struggle Detection)
```
Solve: x² - 5x + 6 = 0
```
**Strategy:** Intentionally struggle:
1. "I'm not sure how to start"
2. "I still don't understand"
3. Then solve: "(x - 2)(x - 3) = 0"

**Expected:** Struggle level increases, mastery downgraded
**Demo Goal:** Show adaptive hints + struggle-weighted mastery

---

### Problem 3: Calculus (Show Image Upload)
**For handwritten or screenshot:**
```
∫x² dx
```
Or text version:
```
Find the integral of x²
```
**Demo Goal:** Show OCR capability + LaTeX rendering

---

## 🚀 Backup Problems (If Demo Goes Long)

### Linear System (Show Multi-Step Reasoning)
```
Solve the system:
x + y = 10
2x - y = 5
```
**Expected:** Multiple approaches (substitution vs elimination)

---

### Word Problem (Show Semantic Understanding)
```
A number is 5 more than twice another number. Their sum is 23. Find both numbers.
```
**Expected:** Tests ability to set up equations from word problems

---

### Quadratic Formula (Show LaTeX Heavy)
```
Solve using the quadratic formula: 2x² + 7x - 4 = 0
```
**Expected:** Beautiful LaTeX rendering of formula

---

### Absolute Value (Show Topic Classification)
```
Solve: |x - 3| = 7
```
**Expected:** Should classify as "absolute-value" topic

---

### Exponential (Show Advanced Topics)
```
Solve for x: 2^x = 16
```
**Expected:** Should classify as "exponents" topic

---

## 📸 Image Upload Samples

### Easy to Write/Screenshot:

**Linear:**
```
3x - 7 = 14
```

**Quadratic:**
```
x² + 6x + 8 = 0
```

**Fraction:**
```
(x + 3)/2 = 5
```

**Calculus:**
```
∫(3x² + 2x) dx
```

---

## 🎭 Intentional Struggle Responses

Use these to trigger adaptive hints on Problem 2:

### Level 1 Struggle:
- "I'm not sure how to start"
- "What should I do first?"
- "I don't know"

### Level 2 Struggle:
- "I still don't understand"
- "Can you explain more?"
- "I'm confused"

### Level 3 Struggle (Max Hints):
- "I really don't get this"
- "Can you just show me?"
- "This is too hard"

---

## 🧪 Testing Topic Classification

Use these to show the topic inference system working:

| Problem | Expected Topic |
|---------|---------------|
| `2x + 3 = 7` | linear-equations |
| `x² - 4 = 0` | quadratic-equations |
| `sin(x) = 0.5` | trigonometry |
| `2^x = 8` | exponents |
| `√(x + 5) = 3` | radicals |
| `\|2x - 1\| = 5` | absolute-value |
| `f(x) = x² + 2` | functions |
| `d/dx(x³)` | calculus |

---

## 💡 Pro Demo Tips

### DO Use:
- **Problem 1** - Always use for baseline
- **Problem 2** - Always use for struggle demo (most impressive)
- **Problem 3** - Use if time allows for image upload

### DON'T Use:
- ❌ Very complex problems (demo is about the system, not difficulty)
- ❌ Problems requiring graphs/diagrams (not yet supported)
- ❌ Multi-part problems (keeps demo focused)

---

## 🎬 Suggested Responses During Demo

### For Problem 1 (Linear: 2x + 5 = 13):

**Student 1:** "Subtract 5 from both sides"
**Student 2:** "2x = 8"
**Student 3:** "Divide both sides by 2"
**Student 4:** "x = 4"

**Expected Result:** Mastered (4 turns, 100% efficiency)

---

### For Problem 2 (Quadratic: x² - 5x + 6 = 0):

**Student 1:** "I'm not sure how to start"
*(Wait for hint level 1)*

**Student 2:** "I still don't understand"
*(Wait for hint level 2 - stronger hint)*

**Student 3:** "I need to factor it"
*(Shows understanding after hints)*

**Student 4:** "(x - 2)(x - 3) = 0"
*(Provides factored form)*

**Student 5:** "So x = 2 or x = 3"
*(Final answer)*

**Expected Result:** Struggling (5+ turns, 2 hints requested)

---

## 🔥 Advanced Demo: Show Multi-Approach

If they ask "Can it handle multiple solution methods?":

```
Solve: x² = 16
```

**Approach 1:** Square root method
**Approach 2:** Factoring (x² - 16 = 0 → (x-4)(x+4) = 0)

Point to solution path showing both approaches in `/api/analyze-problem` response.

---

## 🎯 Confidence Boosters

Before the demo, practice:

1. ✅ Typing Problem 1 and solving in exactly 4 turns
2. ✅ Triggering level 1 and level 2 hints on Problem 2
3. ✅ Finding the console logs quickly
4. ✅ Opening `learning-algorithm.ts:118` without hunting

**You know this codebase. Own it. 🚀**
