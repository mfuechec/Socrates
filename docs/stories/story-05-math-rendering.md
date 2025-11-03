# Story 5: Math Rendering with LaTeX

**As a** student
**I want** to see properly formatted mathematical equations
**So that** complex notation is readable

## Acceptance Criteria

- LaTeX renders via KaTeX ($...$ inline, $$...$$ block)
- Supports fractions, exponents, roots, integrals
- Graceful fallback: Shows raw LaTeX if rendering fails
- Works in both student and tutor messages

## Priority
MVP Important

## Effort
Small (2-3 hours)

## Dependencies
Story 2 (Chat Interface & State Management)

## Technical Notes

### Library Choice
Use **KaTeX** (not MathJax):
- Faster rendering (client-side, no server)
- Smaller bundle size
- No external dependencies at runtime

### Installation
```bash
npm install katex react-katex
npm install --save-dev @types/katex
```

### Component Implementation
```typescript
// src/components/MathRenderer.tsx
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export const MathRenderer = ({ content }: { content: string }) => {
  // Parse content for LaTeX patterns
  // $...$ → inline math
  // $$...$$ → block math
  // Everything else → plain text

  const renderMath = (text: string) => {
    try {
      // Regex to match $$...$$ and $...$
      // Render with KaTeX components
      // Return formatted JSX
    } catch (error) {
      // Fallback: Return raw LaTeX with warning
      return <span title="Math rendering failed">{text}</span>;
    }
  };

  return <div>{renderMath(content)}</div>;
};
```

### LaTeX Patterns to Support
Test with these examples:
- Inline: `$x^2 + 3x - 5 = 0$`
- Block: `$$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$`
- Fractions: `$\frac{1}{2}$`
- Exponents: `$x^{2n+1}$`
- Roots: `$\sqrt{x}$`, `$\sqrt[3]{x}$`
- Integrals: `$\int_0^1 x^2 dx$`
- Greek letters: `$\alpha$`, `$\pi$`
- Operators: `$\times$`, `$\div$`, `$\pm$`

### Integration with MessageList
```typescript
// src/components/MessageList.tsx
import { MathRenderer } from './MathRenderer';

export const MessageList = ({ messages }) => {
  return (
    <div>
      {messages.map((msg, idx) => (
        <div key={idx} className={msg.role === 'student' ? 'student-msg' : 'tutor-msg'}>
          <MathRenderer content={msg.content} />
        </div>
      ))}
    </div>
  );
};
```

### Error Handling
If KaTeX fails to parse:
- Display raw LaTeX text
- Add title attribute: "Math rendering failed"
- Log error to console (dev mode only)
- Don't break entire message display

### CSS Styling
```css
/* Inline math should flow with text */
.katex { font-size: inherit; }

/* Block math should be centered */
.katex-display {
  margin: 1rem 0;
  text-align: center;
}
```

## Definition of Done
- [ ] KaTeX installed and imported
- [ ] MathRenderer component created
- [ ] Inline math ($...$) renders correctly
- [ ] Block math ($$...$$) renders correctly
- [ ] Tested all supported patterns (fractions, exponents, roots, integrals)
- [ ] Graceful fallback tested (malformed LaTeX shows raw text)
- [ ] Integrated with MessageList component
- [ ] Works in both student and tutor messages
- [ ] CSS styling applied (centered blocks, inline flow)
- [ ] Manually tested with 5 problem types that use math notation
