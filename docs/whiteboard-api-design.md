# Whiteboard Annotation API Design

**Version:** 1.0
**Status:** Draft
**Author:** Winston (System Architect)
**Date:** 2025-11-03

---

## Overview

This document specifies the API contract between the AI tutor (GPT-4o) and the whiteboard rendering system. The AI will return structured annotation data alongside Socratic dialogue to enable visual teaching.

---

## Design Principles

1. **Simple First**: Start with basic annotations (highlight, circle, arrow, label)
2. **Text-Based MVP**: Phase 1 supports only typed math problems (not images)
3. **Graceful Degradation**: If annotations fail, conversation continues text-only
4. **AI-Friendly**: Schema must be simple enough for GPT-4 to generate reliably
5. **Future-Proof**: Design allows for image-based annotations later

---

## Core Data Types

### TutorResponse (Enhanced)

```typescript
interface TutorResponse {
  message: string;              // Socratic dialogue (existing)
  annotations?: Annotation[];   // NEW: Visual annotations (optional)
  animationSequence?: AnimationStep[];  // NEW: For Phase 2 (optional)
}
```

### Annotation (Base Type)

```typescript
type AnnotationType = 'highlight' | 'circle' | 'arrow' | 'label' | 'underline';

interface Annotation {
  id: string;                   // Unique ID (auto-generated client-side)
  type: AnnotationType;
  target: AnnotationTarget;     // What to annotate
  style: AnnotationStyle;       // How to render it
  metadata?: AnnotationMetadata; // Optional context
}
```

### AnnotationTarget (What to Annotate)

```typescript
type AnnotationTarget = TextTarget | CoordinateTarget;

// Phase 1: Text-based (for typed problems)
interface TextTarget {
  mode: 'text';
  text: string;          // Exact text to find (e.g., "2x")
  occurrence?: number;   // Which occurrence if multiple (default: 1)
  context?: string;      // Surrounding text for disambiguation
}

// Phase 3: Coordinate-based (for images)
interface CoordinateTarget {
  mode: 'coordinate';
  x: number;            // 0-100 (percentage of canvas width)
  y: number;            // 0-100 (percentage of canvas height)
  width?: number;       // For rectangles/highlights
  height?: number;
}
```

### AnnotationStyle (How to Render)

```typescript
interface AnnotationStyle {
  color?: string;        // CSS color (default: 'yellow' for highlights, 'red' for circles)
  opacity?: number;      // 0-1 (default: 0.3 for highlights, 1.0 for shapes)
  strokeWidth?: number;  // For circles/arrows (default: 2)
  fontSize?: number;     // For labels (default: 14)
}
```

### AnnotationMetadata (Optional Context)

```typescript
interface AnnotationMetadata {
  purpose?: string;      // Why this annotation? (for debugging)
  hint?: string;         // Tooltip text
  duration?: number;     // How long to show (ms, default: permanent)
}
```

---

## Specific Annotation Types

### 1. Highlight

**Purpose:** Draw attention to specific terms/numbers

```typescript
interface HighlightAnnotation extends Annotation {
  type: 'highlight';
  target: TextTarget;
  style: {
    color: string;      // Default: 'yellow'
    opacity: number;    // Default: 0.3
  };
}
```

**Example:**
```json
{
  "type": "highlight",
  "target": {
    "mode": "text",
    "text": "2x"
  },
  "style": {
    "color": "yellow",
    "opacity": 0.3
  }
}
```

---

### 2. Circle

**Purpose:** Emphasize a term or group of terms

```typescript
interface CircleAnnotation extends Annotation {
  type: 'circle';
  target: TextTarget | CoordinateTarget;
  style: {
    color: string;        // Default: 'red'
    strokeWidth: number;  // Default: 2
  };
}
```

**Example:**
```json
{
  "type": "circle",
  "target": {
    "mode": "text",
    "text": "x²"
  },
  "style": {
    "color": "red",
    "strokeWidth": 3
  }
}
```

---

### 3. Arrow

**Purpose:** Point from one element to another, show relationships

```typescript
interface ArrowAnnotation extends Annotation {
  type: 'arrow';
  target: {
    from: TextTarget | CoordinateTarget;
    to: TextTarget | CoordinateTarget;
  };
  style: {
    color: string;        // Default: 'blue'
    strokeWidth: number;  // Default: 2
    arrowheadSize?: number; // Default: 10
  };
}
```

**Example:**
```json
{
  "type": "arrow",
  "target": {
    "from": {
      "mode": "text",
      "text": "2x"
    },
    "to": {
      "mode": "text",
      "text": "x"
    }
  },
  "style": {
    "color": "blue",
    "strokeWidth": 2
  }
}
```

---

### 4. Label

**Purpose:** Add explanatory text near an element

```typescript
interface LabelAnnotation extends Annotation {
  type: 'label';
  target: TextTarget | CoordinateTarget;
  content: string;         // Label text
  style: {
    color: string;         // Default: 'black'
    fontSize: number;      // Default: 14
    backgroundColor?: string; // Default: 'white'
  };
}
```

**Example:**
```json
{
  "type": "label",
  "target": {
    "mode": "text",
    "text": "2x"
  },
  "content": "Coefficient",
  "style": {
    "color": "black",
    "fontSize": 12,
    "backgroundColor": "rgba(255, 255, 255, 0.9)"
  }
}
```

---

### 5. Underline

**Purpose:** Emphasize without obscuring (lighter than highlight)

```typescript
interface UnderlineAnnotation extends Annotation {
  type: 'underline';
  target: TextTarget;
  style: {
    color: string;        // Default: 'red'
    strokeWidth: number;  // Default: 2
  };
}
```

---

## Phase 2: Animation Support (Future)

```typescript
interface AnimationStep {
  delay: number;           // ms after previous step
  annotationId: string;    // Which annotation to animate
  animation: {
    type: 'fadeIn' | 'slideIn' | 'trace' | 'pulse';
    duration: number;      // ms
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  };
}
```

---

## AI Integration

### System Prompt Addition

```
ANNOTATION PROTOCOL:
When explaining mathematical concepts, you may include visual annotations to help students.
Return your response as JSON in this format:

{
  "message": "Your Socratic question here",
  "annotations": [
    {
      "type": "highlight",
      "target": {"mode": "text", "text": "2x"},
      "style": {"color": "yellow", "opacity": 0.3}
    }
  ]
}

ANNOTATION RULES:
1. Use sparingly (1-3 annotations per message max)
2. Only annotate text that exists in the current problem
3. Choose annotation types based on purpose:
   - highlight: Draw attention to a term
   - circle: Group related terms
   - arrow: Show relationships between terms
   - label: Add brief explanations
   - underline: Emphasize without obscuring

4. Provide exact text matches for target.text
5. Use simple colors: 'yellow', 'red', 'blue', 'green'
6. If uncertain, omit annotations (text-only is always safe)

EXAMPLE:
Problem: "Solve 2x + 5 = 13"
Good response:
{
  "message": "What operation would help us isolate the variable term?",
  "annotations": [
    {
      "type": "highlight",
      "target": {"mode": "text", "text": "2x"},
      "style": {"color": "yellow"}
    }
  ]
}
```

### OpenAI API Configuration

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: SOCRATIC_PROMPT_WITH_ANNOTATIONS },
    ...conversationHistory
  ],
  response_format: { type: "json_object" },  // Force JSON output
  temperature: 0.4,
  max_tokens: 800  // Increased from 500 to allow annotations
});
```

---

## Validation Layer

### Response Validation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitizedResponse?: TutorResponse;
}

function validateTutorResponse(rawResponse: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Check required fields
  if (!rawResponse.message || typeof rawResponse.message !== 'string') {
    errors.push({ field: 'message', error: 'Missing or invalid message' });
  }

  // 2. Validate annotations array (optional)
  if (rawResponse.annotations) {
    if (!Array.isArray(rawResponse.annotations)) {
      errors.push({ field: 'annotations', error: 'Must be an array' });
    } else {
      // Validate each annotation
      rawResponse.annotations.forEach((ann, idx) => {
        const annErrors = validateAnnotation(ann, idx);
        errors.push(...annErrors);
      });
    }
  }

  // 3. Check annotation count (safety limit)
  if (rawResponse.annotations?.length > 5) {
    errors.push({
      field: 'annotations',
      error: 'Too many annotations (max 5 per message)'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedResponse: errors.length === 0 ? rawResponse : undefined
  };
}

function validateAnnotation(ann: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `annotations[${index}]`;

  // Required fields
  if (!ann.type || !['highlight', 'circle', 'arrow', 'label', 'underline'].includes(ann.type)) {
    errors.push({ field: `${prefix}.type`, error: 'Invalid annotation type' });
  }

  if (!ann.target) {
    errors.push({ field: `${prefix}.target`, error: 'Missing target' });
  } else {
    // Validate target based on mode
    if (ann.target.mode === 'text') {
      if (!ann.target.text || typeof ann.target.text !== 'string') {
        errors.push({ field: `${prefix}.target.text`, error: 'Missing text' });
      }
    } else if (ann.target.mode === 'coordinate') {
      if (typeof ann.target.x !== 'number' || typeof ann.target.y !== 'number') {
        errors.push({ field: `${prefix}.target`, error: 'Invalid coordinates' });
      }
    }
  }

  return errors;
}
```

### Fallback Strategy

```typescript
async function sendMessageWithAnnotations(
  problem: string,
  messages: Message[],
  signal: AbortSignal
): Promise<TutorResponse> {
  try {
    const rawResponse = await callOpenAI(problem, messages, signal);

    // Try to parse as JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (e) {
      // Fallback: treat as plain text
      console.warn('AI returned non-JSON response, falling back to text-only');
      return { message: rawResponse, annotations: [] };
    }

    // Validate structure
    const validation = validateTutorResponse(parsed);

    if (!validation.valid) {
      console.warn('Invalid annotation structure:', validation.errors);
      // Fallback: use message only, discard annotations
      return {
        message: parsed.message || rawResponse,
        annotations: []
      };
    }

    return validation.sanitizedResponse!;

  } catch (error) {
    throw error; // Let existing error handling catch this
  }
}
```

---

## Error Handling

### Error Types

```typescript
type AnnotationError =
  | 'TEXT_NOT_FOUND'      // Target text doesn't exist in problem
  | 'INVALID_COORDINATE'  // Coordinate out of bounds
  | 'INVALID_SCHEMA'      // Malformed annotation
  | 'RENDERING_FAILED';   // Canvas error

interface AnnotationRenderResult {
  success: boolean;
  error?: AnnotationError;
  message?: string;
}
```

### Render-Time Validation

```typescript
function renderAnnotation(
  annotation: Annotation,
  problemText: string,
  canvas: CanvasContext
): AnnotationRenderResult {

  // 1. Find target element
  if (annotation.target.mode === 'text') {
    const position = findTextPosition(problemText, annotation.target.text);
    if (!position) {
      console.warn(`Text "${annotation.target.text}" not found in problem`);
      return {
        success: false,
        error: 'TEXT_NOT_FOUND',
        message: `Cannot find "${annotation.target.text}"`
      };
    }
  }

  // 2. Render with try-catch
  try {
    switch (annotation.type) {
      case 'highlight':
        renderHighlight(annotation, canvas);
        break;
      // ... other types
    }
    return { success: true };
  } catch (error) {
    console.error('Rendering failed:', error);
    return {
      success: false,
      error: 'RENDERING_FAILED',
      message: 'Failed to render annotation'
    };
  }
}
```

---

## Implementation Checklist

### Phase 1: Static Annotations (MVP)

- [ ] Update `Message` type to include `annotations?: Annotation[]`
- [ ] Add `response_format: { type: "json_object" }` to OpenAI call
- [ ] Update system prompt with annotation protocol
- [ ] Implement `validateTutorResponse()` function
- [ ] Implement `findTextPosition()` for text-based targets
- [ ] Create `WhiteboardCanvas` component with Fabric.js
- [ ] Implement render functions for each annotation type
- [ ] Add fallback logic (text-only mode if annotations fail)
- [ ] Test with manual annotation JSON first (before AI)
- [ ] Test with AI-generated annotations
- [ ] Handle edge cases (text not found, malformed JSON)

### Phase 2: Animations (Future)

- [ ] Add `animationSequence` to `TutorResponse`
- [ ] Implement `AnimationController` component
- [ ] Add timeline controls (play/pause/scrub)
- [ ] Update system prompt for animation support

### Phase 3: Image Support (Future)

- [ ] Switch to coordinate-based annotation system
- [ ] Update system prompt for spatial reasoning
- [ ] Add coordinate validation
- [ ] Test with uploaded image problems

---

## Testing Strategy

### Unit Tests

```typescript
describe('Annotation Validation', () => {
  it('accepts valid highlight annotation', () => {
    const response = {
      message: "What is the coefficient?",
      annotations: [{
        type: 'highlight',
        target: { mode: 'text', text: '2x' },
        style: { color: 'yellow' }
      }]
    };
    expect(validateTutorResponse(response).valid).toBe(true);
  });

  it('rejects annotation with missing target', () => {
    const response = {
      message: "Test",
      annotations: [{ type: 'highlight', style: { color: 'yellow' } }]
    };
    expect(validateTutorResponse(response).valid).toBe(false);
  });
});
```

### Integration Tests

1. **Text-only fallback**: Force JSON parse error, verify text-only mode
2. **Missing text**: AI highlights "xyz" but problem has "2x + 5"
3. **Too many annotations**: AI returns 10 annotations, verify limit enforcement
4. **Graceful degradation**: Canvas rendering fails, conversation continues

### Manual Testing

Create test fixtures with predefined annotation JSON:

```typescript
const TEST_RESPONSES = {
  simpleHighlight: {
    message: "What is this term called?",
    annotations: [{
      type: 'highlight',
      target: { mode: 'text', text: '2x' },
      style: { color: 'yellow' }
    }]
  },
  multipleAnnotations: {
    message: "Compare these two terms",
    annotations: [
      { type: 'circle', target: { mode: 'text', text: '2x' } },
      { type: 'circle', target: { mode: 'text', text: '5' } }
    ]
  }
};
```

---

## Performance Considerations

1. **Canvas Re-renders**: Memoize annotation renders, only redraw on state change
2. **Text Search**: Cache text position results (problem text doesn't change)
3. **Validation**: Run validation server-side AND client-side for defense in depth
4. **Token Usage**: Annotations add ~100-200 tokens per response (monitor costs)

---

## Migration Path

### Current State
```typescript
interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}
```

### After Phase 1
```typescript
interface Message {
  role: 'student' | 'tutor';
  content: string;
  annotations?: Annotation[];  // NEW
  timestamp: Date;
}
```

**Migration:** Existing messages without `annotations` still work (optional field).

---

## Cost Estimate

### Token Impact
- **Current response:** ~150-300 tokens
- **With annotations:** ~250-500 tokens (67% increase)
- **Cost per 10-turn conversation:** ~$0.03-$0.08 (up from $0.02-$0.05)

### Development Time
- API design: ✅ Done (this document)
- Implementation: 2-3 days
- Testing: 1 day
- **Total:** 3-4 days for Phase 1

---

## Open Questions

1. **Color Palette**: Should we limit colors to a predefined set?
   - **Recommendation:** Yes, use 5 colors (yellow, red, blue, green, purple)

2. **Annotation Persistence**: Should annotations persist when scrolling chat history?
   - **Recommendation:** Yes, store in message objects

3. **Student Annotations**: Should students be able to add their own annotations?
   - **Recommendation:** Phase 2 feature, not MVP

4. **Mobile Support**: How do annotations render on small screens?
   - **Recommendation:** Test early, may need responsive sizing

---

## References

- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Fabric.js Documentation: http://fabricjs.com/docs/
- KaTeX Math Rendering: https://katex.org/

---

**Status:** Ready for implementation review
**Next Steps:** Review with team, then proceed to implementation
