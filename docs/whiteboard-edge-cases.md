# Whiteboard Feature: Edge Cases & Error Handling

**Version:** 1.0
**Date:** 2025-11-03
**Author:** Winston (System Architect)

---

## Critical Clarification: AI Does NOT Interact with Fabric.js

**Important:** The AI never touches Fabric.js directly. Here's the actual flow:

```
┌─────────┐         ┌──────────┐         ┌────────────┐         ┌──────────┐
│ Student │ ──────> │ OpenAI   │ ──────> │ Validation │ ──────> │ Fabric.js│
│  Input  │         │ GPT-4o   │         │  Layer     │         │ Renderer │
└─────────┘         └──────────┘         └────────────┘         └──────────┘
                         │                      │                      │
                    Returns JSON          Checks schema          Draws on
                    with annotations      + sanitizes            canvas
```

**Key Points:**
1. AI generates **JSON data** (not code, not canvas commands)
2. Your validation layer checks the JSON
3. Your React component uses Fabric.js to render

**This means:**
- ✅ AI reliability depends on JSON schema adherence (which GPT-4o is good at)
- ✅ Rendering reliability depends on your code (which you control)
- ❌ AI cannot "break" Fabric.js (it never touches it)
- ❌ AI cannot execute arbitrary code

**Analogy:** It's like asking GPT-4 for recipe ingredients (JSON), then you cook (Fabric.js). The AI can give you bad ingredients, but it can't burn your kitchen down.

---

## Edge Cases: Comprehensive List

### Category 1: Text Matching Issues (HIGH PRIORITY)

#### EC-1.1: Multiple Occurrences of Same Text

**Problem:**
```typescript
Problem: "x + x + x = 15"
AI: "Let's look at the first x"
Annotation: { target: { mode: "text", text: "x" } }
```

Which `x` should be highlighted? There are 3.

**Solutions:**

**Option A: Use `occurrence` parameter**
```typescript
interface TextTarget {
  text: string;
  occurrence?: number;  // 1 = first, 2 = second, etc.
}

// AI response:
{
  target: { mode: "text", text: "x", occurrence: 1 }
}
```

**Option B: Use context matching**
```typescript
interface TextTarget {
  text: string;
  context?: string;  // Surrounding text for disambiguation
}

// AI response:
{
  target: { mode: "text", text: "x", context: "x + x" }  // First x
}
```

**Option C: Highlight ALL occurrences (simplest for MVP)**
```typescript
// Just highlight every "x" - no disambiguation needed
// Trade-off: Less precise, but AI can't make mistakes
```

**Recommendation:** Start with Option C (highlight all), add Option A in Phase 2.

---

#### EC-1.2: Partial Text Matches

**Problem:**
```typescript
Problem: "2x + 20 = 40"
AI tries to highlight: "2"
```

Should it highlight:
- Just the "2" in "2x"?
- Just the "2" in "20"?
- Both?

**Solution: Exact Match Only**
```typescript
function findTextPosition(problem: string, searchText: string): Position[] {
  const positions: Position[] = [];

  // Use regex with word boundaries for numbers/variables
  const regex = new RegExp(`\\b${escapeRegex(searchText)}\\b`, 'g');

  let match;
  while ((match = regex.exec(problem)) !== null) {
    positions.push({
      index: match.index,
      length: searchText.length
    });
  }

  return positions;
}
```

**Edge Case:**
What about "2x"? Is "x" a separate match or not?

**Decision:** For math, treat "2x" as a single token. Use smart tokenization:
```typescript
const MATH_TOKENS = ['2x', '20', '40', '+', '='];
// Don't allow highlighting "x" within "2x" unless exact match
```

---

#### EC-1.3: LaTeX vs Plain Text Mismatch

**Problem:**
Your UI renders `x²` using KaTeX, but in data it's `x^2`.

```typescript
Problem (stored): "x^2 + 5x + 6 = 0"
Problem (rendered): "x² + 5x + 6 = 0"  // KaTeX converted ^2 to ²

AI tries to highlight: "x²"  // AI sees the rendered version
```

**Solutions:**

**Option A: Store both formats**
```typescript
interface ConversationState {
  problemStatement: string;      // Raw: "x^2 + 5x + 6"
  problemRendered: string;       // Rendered: "x² + 5x + 6"
}
```

**Option B: Normalize before matching**
```typescript
function normalizeText(text: string): string {
  return text
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    // ... more conversions
}

// Then match against normalized version
```

**Option C: Position annotations on DOM elements (advanced)**
Use KaTeX's output HTML and match against actual rendered elements.

**Recommendation:** Option B for MVP (normalize both AI output and problem text).

---

#### EC-1.4: Whitespace Sensitivity

**Problem:**
```typescript
Problem: "2x + 5 = 13"
AI: { text: "2x+5" }  // No spaces
```

Should this match?

**Solution: Normalize whitespace**
```typescript
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, '');  // Remove all whitespace for matching
}

// Match against normalized versions, but render at original positions
```

---

#### EC-1.5: Special Characters / Unicode

**Problem:**
```typescript
Problem: "∫x² dx"  // Contains integral symbol
AI: { text: "∫x²" }
```

Can the AI reliably type Unicode math symbols?

**Answer:** GPT-4o can handle Unicode, but it's risky.

**Solution: Use LaTeX commands in AI output**
```typescript
// AI outputs:
{ text: "\\int x^2" }

// Your code normalizes both:
const normalizedProblem = convertLatexToUnicode(problem);
const normalizedTarget = convertLatexToUnicode(annotation.target.text);
```

---

### Category 2: State Synchronization Issues

#### EC-2.1: Annotation Timing (When to Render)

**Problem:** Annotations appear before the AI message is fully typed out (if you have a typewriter effect).

**Solution:**
```typescript
interface Annotation {
  // ... existing fields
  renderDelay?: number;  // ms after message appears
}

// In component:
useEffect(() => {
  const timer = setTimeout(() => {
    renderAnnotations(message.annotations);
  }, message.annotations[0]?.renderDelay || 0);

  return () => clearTimeout(timer);
}, [message]);
```

---

#### EC-2.2: Scroll Position

**Problem:** User scrolls up to view old messages. Should annotations re-render?

**Scenarios:**

**Scenario A: Annotations persist in message history**
```
[Old Message 1]
[Annotation still visible]

[Old Message 2]
[Annotation still visible]

[New Message]
[New annotation]
```

**Scenario B: Only show annotations for visible message**
```
[Old Message 1]  <- User scrolled here
[Annotation visible]

[Old Message 2]  <- Off screen
[Annotation hidden]
```

**Recommendation:** Scenario A (persist all). Each message has its own canvas.

**Implementation:**
```typescript
// MessageList.tsx
{messages.map((msg) => (
  <div key={msg.timestamp}>
    <MessageBubble message={msg.content} />
    {msg.annotations && (
      <WhiteboardCanvas
        problemText={problemStatement}
        annotations={msg.annotations}
      />
    )}
  </div>
))}
```

---

#### EC-2.3: Window Resize

**Problem:** User resizes browser window. Canvas coordinates become invalid.

**Solution: Use percentage-based or responsive coordinates**
```typescript
interface ResponsivePosition {
  x: number;  // Percentage of container width (0-100)
  y: number;  // Percentage of container height (0-100)
}

// On resize:
useEffect(() => {
  const handleResize = () => {
    recalculateAnnotationPositions();
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

#### EC-2.4: Dark Mode Toggle

**Problem:** User toggles dark mode. Annotation colors become invisible.

**Example:**
```typescript
Yellow highlight on white background = visible
Yellow highlight on dark background = barely visible
```

**Solution: Color mapping based on theme**
```typescript
const ANNOTATION_COLORS = {
  light: {
    highlight: 'rgba(255, 255, 0, 0.3)',    // Yellow
    circle: 'rgb(220, 38, 38)',              // Red
  },
  dark: {
    highlight: 'rgba(255, 255, 0, 0.5)',    // Brighter yellow
    circle: 'rgb(239, 68, 68)',              // Lighter red
  }
};

function getAnnotationColor(color: string, theme: 'light' | 'dark'): string {
  return ANNOTATION_COLORS[theme][color] || color;
}
```

---

### Category 3: AI Reliability Issues

#### EC-3.1: Invalid JSON Structure

**Problem:** GPT-4o returns text instead of JSON.

**Example:**
```
Let me highlight 2x for you.
```

**Frequency:** Rare with `response_format: { type: "json_object" }` (~1-2%)

**Handling:**
```typescript
async function parseAIResponse(raw: string): TutorResponse {
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.warn('JSON parse failed, attempting extraction');

    // Try to extract message from malformed JSON
    const messageMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
    if (messageMatch) {
      return { message: messageMatch[1], annotations: [] };
    }

    // Last resort: treat as plain text
    return { message: raw, annotations: [] };
  }
}
```

---

#### EC-3.2: Hallucinated Text

**Problem:** AI invents text that doesn't exist in the problem.

**Example:**
```typescript
Problem: "2x + 5 = 13"
AI: { text: "3y" }  // Doesn't exist!
```

**Frequency:** Low (~5%) with good prompting

**Handling:**
```typescript
function validateTextExists(problem: string, targetText: string): boolean {
  const normalized = normalizeText(problem);
  const target = normalizeText(targetText);

  if (!normalized.includes(target)) {
    console.warn(`Text "${targetText}" not found in problem`);
    return false;
  }
  return true;
}

// In render:
annotations.forEach(ann => {
  if (!validateTextExists(problem, ann.target.text)) {
    // Skip this annotation silently
    return;
  }
  renderAnnotation(ann);
});
```

---

#### EC-3.3: Annotation Overload

**Problem:** AI creates 10+ annotations, cluttering the display.

**Example:**
```json
{
  "message": "This equation has many parts",
  "annotations": [
    { "type": "highlight", "target": { "text": "2" } },
    { "type": "highlight", "target": { "text": "x" } },
    { "type": "highlight", "target": { "text": "+" } },
    { "type": "highlight", "target": { "text": "5" } },
    // ... 6 more
  ]
}
```

**Frequency:** Medium (~10-15%) without explicit limits in prompt

**Handling:**
```typescript
const MAX_ANNOTATIONS = 3;

function limitAnnotations(annotations: Annotation[]): Annotation[] {
  if (annotations.length <= MAX_ANNOTATIONS) {
    return annotations;
  }

  console.warn(`Too many annotations (${annotations.length}), limiting to ${MAX_ANNOTATIONS}`);

  // Priority: highlight > circle > label > arrow > underline
  const priorityOrder = ['highlight', 'circle', 'label', 'arrow', 'underline'];

  return annotations
    .sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.type);
      const bIndex = priorityOrder.indexOf(b.type);
      return aIndex - bIndex;
    })
    .slice(0, MAX_ANNOTATIONS);
}
```

**Better:** Add to system prompt:
```
IMPORTANT: Use at most 2 annotations per message. Less is more.
```

---

#### EC-3.4: Wrong Annotation Type for Context

**Problem:** AI uses "arrow" when "highlight" would be better.

**Example:**
```typescript
Problem: "2x + 5 = 13"
AI: {
  type: "arrow",
  from: { text: "2x" },
  to: { text: "x" }
}
```

This is semantically weird (arrow from 2x to x?).

**Handling:** Can't prevent this programmatically. Requires prompt engineering.

**Prompt Addition:**
```
ANNOTATION GUIDELINES:
- highlight: Draw attention to a single term (e.g., "2x")
- circle: Emphasize or group terms (e.g., "(x + 3)")
- arrow: Show movement or transformation (e.g., moving a term to other side)
- label: Explain what something is (e.g., "coefficient")
- underline: Gentle emphasis

DO NOT use arrows between unrelated terms.
```

---

### Category 4: Performance Issues

#### EC-4.1: Canvas Re-render Thrashing

**Problem:** Canvas re-renders on every React state change.

**Symptoms:**
- Slow UI
- Flickering annotations
- High CPU usage

**Solution: Memoization**
```typescript
const WhiteboardCanvas = memo(({ problemText, annotations }: Props) => {
  // Only re-render if annotations actually changed
  return <canvas ref={canvasRef} />;
}, (prev, next) => {
  return (
    prev.problemText === next.problemText &&
    JSON.stringify(prev.annotations) === JSON.stringify(next.annotations)
  );
});
```

**Better: Use React.useMemo for expensive calculations**
```typescript
const annotationObjects = useMemo(() => {
  return annotations.map(ann => createFabricObject(ann));
}, [annotations]);
```

---

#### EC-4.2: Memory Leaks with Long Conversations

**Problem:** After 50+ messages, each with a canvas, memory usage balloons.

**Solution: Virtual scrolling**
```typescript
import { FixedSizeList } from 'react-window';

function MessageList({ messages }: Props) {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={100}
    >
      {({ index, style }) => (
        <div style={style}>
          <Message message={messages[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

Only render canvases for visible messages.

---

#### EC-4.3: Text Search Performance

**Problem:** Finding "x" in a 1000-character problem 50 times per message.

**Solution: Cache positions**
```typescript
const textPositionCache = useMemo(() => {
  const cache = new Map<string, Position[]>();

  // Pre-compute positions for common math symbols
  ['x', 'y', '+', '-', '=', '(', ')'].forEach(symbol => {
    cache.set(symbol, findAllPositions(problemText, symbol));
  });

  return cache;
}, [problemText]);

// In render:
const positions = textPositionCache.get(annotation.target.text) ||
                 findAllPositions(problemText, annotation.target.text);
```

---

### Category 5: Mobile / Responsive Issues

#### EC-5.1: Touch Events vs Mouse Events

**Problem:** Fabric.js uses mouse events by default. Touch doesn't work on mobile.

**Solution:** Fabric.js handles this automatically, but you need to enable it:
```typescript
const canvas = new fabric.Canvas('canvas', {
  enablePointerEvents: true,  // Enable touch support
});
```

---

#### EC-5.2: Small Screen Rendering

**Problem:** Annotation text is too small on mobile.

**Solution: Responsive font sizes**
```typescript
function getResponsiveFontSize(baseFontSize: number): number {
  const screenWidth = window.innerWidth;

  if (screenWidth < 640) {  // Mobile
    return baseFontSize * 1.2;
  } else if (screenWidth < 1024) {  // Tablet
    return baseFontSize * 1.1;
  }
  return baseFontSize;
}
```

---

#### EC-5.3: Canvas Size on Mobile

**Problem:** Fixed canvas size breaks on narrow screens.

**Solution: Fluid canvas**
```typescript
useEffect(() => {
  const updateCanvasSize = () => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.offsetWidth;
    const height = calculateHeight(width);  // Maintain aspect ratio

    canvas.setDimensions({ width, height });
    canvas.renderAll();
  };

  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);

  return () => window.removeEventListener('resize', updateCanvasSize);
}, []);
```

---

### Category 6: Accessibility Issues

#### EC-6.1: Screen Reader Support

**Problem:** Annotations are visual only. Blind users can't perceive them.

**Solution: Add ARIA descriptions**
```typescript
<div
  role="img"
  aria-label={`Mathematical expression: ${problemText}. The AI has highlighted: ${getAnnotationDescriptions(annotations)}`}
>
  <canvas ref={canvasRef} />
</div>

function getAnnotationDescriptions(annotations: Annotation[]): string {
  return annotations
    .map(ann => `${ann.type} on ${ann.target.text}`)
    .join(', ');
}
```

---

#### EC-6.2: Color Blindness

**Problem:** Red/green colorblind users can't distinguish annotation colors.

**Solution: Use patterns + colors**
```typescript
const ANNOTATION_STYLES = {
  highlight: { color: 'yellow', pattern: 'solid' },
  circle: { color: 'red', pattern: 'dashed' },
  important: { color: 'blue', pattern: 'dotted' },
};

// Render with both color AND pattern
```

---

## Error Handling: Multi-Layer Strategy

### Layer 1: Server-Side Validation (API Route)

**Location:** `/pages/api/chat.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [...],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('OpenAI returned invalid JSON:', content);

      // Fallback: return text-only response
      return res.status(200).json({
        message: content,
        annotations: [],
        error: 'INVALID_JSON'
      });
    }

    // Validate structure
    if (!parsed.message || typeof parsed.message !== 'string') {
      console.error('Missing message field:', parsed);
      return res.status(200).json({
        message: 'I need to think about that more carefully.',
        annotations: [],
        error: 'INVALID_STRUCTURE'
      });
    }

    // Validate annotations (if present)
    if (parsed.annotations) {
      const validAnnotations = parsed.annotations.filter(validateAnnotation);

      if (validAnnotations.length < parsed.annotations.length) {
        console.warn(`Filtered ${parsed.annotations.length - validAnnotations.length} invalid annotations`);
      }

      parsed.annotations = validAnnotations;
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to get tutor response'
    });
  }
}
```

---

### Layer 2: Client-Side Validation (API Client)

**Location:** `/src/lib/api-client.ts`

```typescript
export async function sendMessage(
  problem: string,
  messages: Message[],
  signal: AbortSignal
): Promise<TutorResponse> {

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, messages }),
    signal
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Final validation before returning to UI
  return {
    message: data.message || 'Sorry, I had trouble responding.',
    annotations: Array.isArray(data.annotations) ? data.annotations : []
  };
}
```

---

### Layer 3: Render-Time Validation (Component)

**Location:** `/src/components/whiteboard/WhiteboardCanvas.tsx`

```typescript
function WhiteboardCanvas({ problemText, annotations }: Props) {
  const [renderErrors, setRenderErrors] = useState<string[]>([]);

  useEffect(() => {
    const errors: string[] = [];

    annotations.forEach(ann => {
      try {
        // Validate text exists
        if (ann.target.mode === 'text') {
          if (!problemText.includes(ann.target.text)) {
            errors.push(`Text "${ann.target.text}" not found`);
            return;  // Skip this annotation
          }
        }

        // Render annotation
        const fabricObject = createFabricObject(ann, problemText);
        canvas.add(fabricObject);

      } catch (error) {
        console.error('Render error:', error);
        errors.push(`Failed to render ${ann.type}`);
      }
    });

    setRenderErrors(errors);
    canvas.renderAll();

  }, [annotations, problemText]);

  // Show errors in dev mode only
  if (process.env.NODE_ENV === 'development' && renderErrors.length > 0) {
    console.warn('Annotation render errors:', renderErrors);
  }

  return <canvas ref={canvasRef} />;
}
```

---

### Layer 4: User-Facing Error Messages

```typescript
function MessageBubble({ message }: Props) {
  const hasAnnotations = message.annotations && message.annotations.length > 0;
  const annotationsFailed = hasAnnotations && !isCanvasRendered;

  return (
    <div>
      <p>{message.content}</p>

      {annotationsFailed && (
        <div className="text-sm text-yellow-600 mt-2">
          ⚠️ Visual aids couldn't be displayed for this message
        </div>
      )}

      {hasAnnotations && <WhiteboardCanvas {...} />}
    </div>
  );
}
```

---

## Error Recovery Strategies

### Strategy 1: Graceful Degradation

**Principle:** If anything fails, conversation continues text-only.

```typescript
try {
  renderAnnotations();
} catch (error) {
  console.error(error);
  // Don't throw - just skip annotations
}

// Message still displays, just without visual aids
```

---

### Strategy 2: Retry with Simplified Request

If annotations consistently fail, temporarily disable them:

```typescript
let annotationFailures = 0;

async function sendMessage(...) {
  const enableAnnotations = annotationFailures < 3;

  try {
    const response = await fetch('/api/chat', {
      body: JSON.stringify({
        problem,
        messages,
        enableAnnotations  // Server can skip annotation logic if false
      })
    });

    annotationFailures = 0;  // Reset on success
    return response;

  } catch (error) {
    annotationFailures++;
    throw error;
  }
}
```

---

### Strategy 3: Telemetry (Production)

Track errors to improve the system:

```typescript
function logAnnotationError(error: AnnotationError) {
  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    analytics.track('annotation_error', {
      errorType: error.type,
      annotationType: error.annotation?.type,
      problemLength: error.problemText?.length,
      timestamp: Date.now()
    });
  }

  // Always log to console
  console.warn('Annotation error:', error);
}
```

---

## Testing Strategy for Edge Cases

### Unit Tests

```typescript
describe('Text Position Finder', () => {
  it('handles multiple occurrences', () => {
    const positions = findTextPosition('x + x = 2x', 'x');
    expect(positions).toHaveLength(3);
  });

  it('handles LaTeX normalization', () => {
    const pos = findTextPosition('x^2 + 5', 'x²');
    expect(pos).toBeTruthy();
  });

  it('returns null for non-existent text', () => {
    const pos = findTextPosition('2x + 5', '3y');
    expect(pos).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Annotation Rendering', () => {
  it('gracefully handles missing text', () => {
    const annotations = [{
      type: 'highlight',
      target: { mode: 'text', text: 'MISSING' }
    }];

    const { container } = render(
      <WhiteboardCanvas problemText="2x + 5" annotations={annotations} />
    );

    // Should render canvas without errors
    expect(container.querySelector('canvas')).toBeInTheDocument();
    // Should log warning but not crash
    expect(console.warn).toHaveBeenCalled();
  });
});
```

### Manual Test Cases

Create a test suite of problematic inputs:

```typescript
export const EDGE_CASE_TESTS = [
  {
    name: 'Multiple x occurrences',
    problem: 'x + x + x = 15',
    annotation: { type: 'highlight', target: { text: 'x' } },
    expectedBehavior: 'Highlights all 3 x instances'
  },
  {
    name: 'LaTeX mismatch',
    problem: 'x^2 + 5x + 6',
    annotation: { type: 'highlight', target: { text: 'x²' } },
    expectedBehavior: 'Successfully highlights after normalization'
  },
  {
    name: 'Hallucinated text',
    problem: '2x + 5 = 13',
    annotation: { type: 'highlight', target: { text: '3y' } },
    expectedBehavior: 'Skips annotation, shows warning in console'
  },
  // ... 20 more edge cases
];
```

---

## Summary: Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| Invalid JSON from AI | Low (2%) | Low | Layer 1 validation + fallback |
| Hallucinated text | Medium (5-10%) | Low | Render-time validation |
| Multiple text matches | High (30%) | Medium | Highlight all occurrences |
| LaTeX mismatch | Medium (10%) | Medium | Text normalization |
| Canvas render fail | Low (1%) | Low | Try-catch + graceful degradation |
| Performance issues | Medium | Medium | Memoization + virtual scrolling |
| Mobile rendering | Medium | Medium | Responsive design + testing |
| Annotation overload | Medium (10%) | Medium | Prompt limits + client-side cap |

**Overall Risk Level:** **Low-Medium** with proper implementation

**Key Insight:** Every error handling layer is a safety net. If one fails, the next catches it. The conversation always continues.

---

## Recommendation

1. **Build all 4 error handling layers** - Defense in depth
2. **Test with edge case fixtures FIRST** - Before connecting AI
3. **Monitor errors in production** - Track what actually happens
4. **Iterate on prompts** - 80% of issues are fixable via better prompting
5. **Keep fallback simple** - Text-only mode is always safe

**Bottom Line:** The AI won't "break" Fabric.js. Worst case, annotations don't render and the conversation continues normally. The feature degrades gracefully.
