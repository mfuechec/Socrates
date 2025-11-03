# Story 5: Math Rendering with LaTeX Testing Guide

## Prerequisites

1. **Dev server running**: `npm run dev`
2. **Browser open**: http://localhost:3000
3. **OpenAI API key** set in `.env.local`

## Features Implemented

✅ **KaTeX Integration**
- Renders inline math: `$x^2$` → x²
- Renders block math: `$$\frac{1}{2}$$` → centered fraction
- Imports KaTeX CSS automatically

✅ **MathRenderer Component**
- Parses LaTeX delimiters ($...$ and $$...$$)
- Handles mixed text and math
- Graceful error handling for malformed LaTeX

✅ **Styling**
- Inline math flows with text
- Block math centered with spacing
- Works in both blue (student) and gray (tutor) message bubbles
- Error states show raw LaTeX with red background

## Testing Steps

### 1. Test Inline Math

**Problem to Enter:** "Solve for x: $2x + 5 = 13$"

**Steps:**
1. Enter the problem above (with $ signs)
2. Click "Start Tutoring Session"
3. Send message: "What should I do first?"

**Expected:**
- Problem in header renders: "Solve for x: 2x + 5 = 13" with formatted math
- GPT-4o responds with questions (may include LaTeX)
- Inline math flows naturally with text

**LaTeX Examples to Try:**
- `$x^2$` → x squared
- `$x_1$` → x subscript 1
- `$\frac{1}{2}$` → one half fraction
- `$\sqrt{x}$` → square root of x
- `$x^{2n+1}$` → x to the power of 2n+1

---

### 2. Test Block Math

**Problem to Enter:**
```
Solve: $$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

**Steps:**
1. Enter problem with $$ delimiters
2. Start session
3. Observe quadratic formula rendered

**Expected:**
- Formula renders centered and large
- Proper spacing above and below
- Fraction bar, square root, ± symbol all display correctly

**More Block Math Examples:**
```
$$\int_0^1 x^2 dx$$       (integral)
$$\sum_{i=1}^n i^2$$      (summation)
$$\lim_{x \to 0} \frac{\sin x}{x}$$  (limit)
```

---

### 3. Test Mixed Content

**Message to Send:**
```
If $x^2 = 16$, then $$x = \pm 4$$
What does this mean?
```

**Expected:**
- "x² = 16" renders inline
- "x = ±4" renders as centered block equation
- Plain text before/after renders normally

---

### 4. Test Common Math Notation

Ask GPT-4o to explain these concepts and observe rendering:

**Fractions:**
- Simple: `$\frac{1}{2}$`
- Nested: `$\frac{1}{\frac{2}{3}}$`
- Complex: `$\frac{x^2 + 2x + 1}{x - 1}$`

**Exponents & Subscripts:**
- Power: `$x^2, x^{10}, x^{2n}$`
- Subscript: `$x_1, x_{12}, x_{i,j}$`
- Both: `$x_1^2$`

**Roots:**
- Square: `$\sqrt{x}$`
- Cube: `$\sqrt[3]{x}$`
- General: `$\sqrt[n]{x}$`

**Greek Letters:**
- `$\alpha, \beta, \gamma, \delta$`
- `$\theta, \pi, \sigma, \omega$`

**Operators:**
- `$\times, \div, \pm, \mp$`
- `$\leq, \geq, \neq, \approx$`
- `$\infty, \partial, \nabla$`

**Calculus:**
- Integral: `$\int f(x) dx$`
- Derivative: `$\frac{dy}{dx}$`
- Limit: `$\lim_{x \to 0}$`

**Matrices:**
```
$$\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$$
```

---

### 5. Test Error Handling

**Malformed LaTeX:**
- `$x^{2$` (missing closing brace)
- `$\frac{1}$` (missing second argument)
- `$\unknowncommand{x}$` (invalid command)

**Expected:**
- Raw LaTeX displays with red background
- Hover shows "Math rendering failed" tooltip
- Doesn't break the message or app
- Rest of message still renders correctly

---

### 6. Test in Student Messages

**Steps:**
1. Start a problem: "x² + 5x + 6 = 0"
2. Send student message with LaTeX: "I think $x = -2$ or $x = -3$"

**Expected:**
- Student message (blue bubble) renders LaTeX
- Math text is white (matches bubble color)
- Still readable and properly formatted

---

### 7. Test in Tutor Messages

**Steps:**
1. Ask a question that prompts math in response
2. Example: "What's the quadratic formula?"

**Expected:**
- Tutor response (gray bubble) includes formatted LaTeX
- Math text is dark gray (matches bubble color)
- Properly centered if block math

---

### 8. Test Problem Statement Rendering

**Problem with LaTeX:**
"Find the derivative: $f(x) = x^3 + 2x^2 - 5x + 1$"

**Expected:**
- Problem in sticky header at top renders LaTeX correctly
- Stays readable as you scroll through messages

---

### 9. Test Long Equations

**Problem:**
```
Simplify: $$\frac{x^3 - 3x^2 + 3x - 1}{x^2 - 2x + 1}$$
```

**Expected:**
- Long equation doesn't overflow message bubble
- Horizontal scroll appears if needed (katex-display has overflow-x: auto)
- Doesn't break layout

---

### 10. Test Performance

**Steps:**
1. Have a long conversation (10+ messages)
2. Include LaTeX in multiple messages
3. Check page responsiveness

**Expected:**
- No lag or slowdown
- Smooth scrolling
- Math renders quickly (< 100ms per message)

---

## Real Conversation Test

**Full Test Scenario:**

1. **Problem:** "Solve for x: $x^2 - 5x + 6 = 0$"

2. **Student:** "I don't know how to factor this"

3. **Tutor:** (Should respond with Socratic questions, possibly using LaTeX)
   - Example: "What two numbers multiply to $6$ and add to $-5$?"

4. **Student:** "$-2$ and $-3$"

5. **Tutor:** "Exactly! So we can write: $$x^2 - 5x + 6 = (x - 2)(x - 3)$$"

6. **Student:** "So $x = 2$ or $x = 3$?"

**Expected:**
- All LaTeX renders correctly throughout
- Inline and block math mixed naturally
- Readable in both colored bubbles
- No rendering errors

---

## Visual Checks

✅ **Inline Math**
- Same font size as surrounding text
- Flows naturally in sentence
- Proper spacing around operators

✅ **Block Math**
- Centered on the page
- Larger and more prominent
- Spacing above and below (1rem)
- Scrollable if too wide

✅ **Colors**
- Student bubble (blue): White math text
- Tutor bubble (gray): Dark gray math text
- Both easily readable

✅ **Error States**
- Red background for failed renders
- Monospace font for raw LaTeX
- Doesn't disrupt rest of message

---

## Browser Compatibility

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

All should render identically (KaTeX is cross-browser compatible)

---

## Known Limitations (MVP)

These are intentional:
- ⚠️ **No equation editor** - Users must type LaTeX manually
- ⚠️ **No LaTeX preview** in problem input - Renders only in chat
- ⚠️ **No copy-as-LaTeX** - Can only copy rendered output

---

## Definition of Done

Story 5 is complete when:

- [x] KaTeX and react-katex installed
- [x] MathRenderer component created
- [x] Integrated into MessageList
- [x] CSS styling added
- [x] Build succeeds
- [ ] **Manual testing** passes all test cases above
- [ ] Inline math renders correctly
- [ ] Block math renders correctly
- [ ] Mixed content (text + math) works
- [ ] Works in both student and tutor messages
- [ ] Error handling gracefully shows malformed LaTeX
- [ ] No performance issues with multiple equations

---

## Troubleshooting

**Issue:** Math not rendering, seeing "$...$" as plain text
**Solution:** Check that KaTeX CSS is imported in globals.css

**Issue:** "Module not found: react-katex"
**Solution:** Run `npm install` to ensure packages are installed

**Issue:** Math renders but colors are wrong
**Solution:** Check custom CSS in globals.css for .bg-blue-600 and .bg-gray-200 rules

**Issue:** Block math not centered
**Solution:** Verify .katex-display has `text-align: center` in CSS

---

## Pro Tips for Testing

1. **Ask GPT-4o to use LaTeX:** Prompt with "Please use LaTeX notation when showing equations"
2. **Test edge cases:** Very long equations, nested fractions, complex subscripts
3. **Check mobile:** Math should be readable and scrollable on small screens
4. **Test copy-paste:** LaTeX should copy correctly from rendered output

---

**Ready to test!** Start a conversation with a problem containing LaTeX notation! 📐
