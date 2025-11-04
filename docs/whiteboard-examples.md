# Whiteboard Annotation Examples

This document provides real-world examples of how the AI will respond with annotations.

---

## Example 1: Simple Linear Equation

**Problem:** `2x + 5 = 13`

**Conversation Turn 3:**

**Student:** "I think we should subtract 5"

**AI Response (JSON):**
```json
{
  "message": "Excellent thinking! Why do you think subtracting 5 is the right first step?",
  "annotations": [
    {
      "type": "highlight",
      "target": {
        "mode": "text",
        "text": "5"
      },
      "style": {
        "color": "yellow",
        "opacity": 0.3
      }
    }
  ]
}
```

**Rendered Output:**
```
2x + [5 highlighted in yellow] = 13

Tutor: Excellent thinking! Why do you think subtracting 5 is the right first step?
```

---

## Example 2: Comparing Terms

**Problem:** `3x² - 2x + 7 = 0`

**Conversation Turn 5:**

**Student:** "What's the difference between 3x² and 2x?"

**AI Response (JSON):**
```json
{
  "message": "Great question! Look at the exponents. What do you notice about the power of x in each term?",
  "annotations": [
    {
      "type": "circle",
      "target": {
        "mode": "text",
        "text": "3x²"
      },
      "style": {
        "color": "blue",
        "strokeWidth": 2
      }
    },
    {
      "type": "circle",
      "target": {
        "mode": "text",
        "text": "2x"
      },
      "style": {
        "color": "red",
        "strokeWidth": 2
      }
    }
  ]
}
```

**Rendered Output:**
```
[3x² circled in blue] - [2x circled in red] + 7 = 0

Tutor: Great question! Look at the exponents. What do you notice about the power of x in each term?
```

---

## Example 3: Showing Relationships

**Problem:** `(x + 3)(x - 2) = 0`

**Conversation Turn 8:**

**Student:** "So I need to make each part equal zero?"

**AI Response (JSON):**
```json
{
  "message": "Exactly! If either factor equals zero, the whole product equals zero. Can you solve for x when the first factor equals zero?",
  "annotations": [
    {
      "type": "underline",
      "target": {
        "mode": "text",
        "text": "(x + 3)"
      },
      "style": {
        "color": "green",
        "strokeWidth": 2
      }
    },
    {
      "type": "label",
      "target": {
        "mode": "text",
        "text": "(x + 3)"
      },
      "content": "Factor 1",
      "style": {
        "color": "green",
        "fontSize": 12
      }
    },
    {
      "type": "underline",
      "target": {
        "mode": "text",
        "text": "(x - 2)"
      },
      "style": {
        "color": "purple",
        "strokeWidth": 2
      }
    },
    {
      "type": "label",
      "target": {
        "mode": "text",
        "text": "(x - 2)"
      },
      "content": "Factor 2",
      "style": {
        "color": "purple",
        "fontSize": 12
      }
    }
  ]
}
```

**Rendered Output:**
```
[(x + 3) underlined in green with label "Factor 1"] [(x - 2) underlined in purple with label "Factor 2"] = 0

Tutor: Exactly! If either factor equals zero, the whole product equals zero.
Can you solve for x when the first factor equals zero?
```

---

## Example 4: Minimal Annotations

**Problem:** `x = 7`

**Student:** "So x is 7?"

**AI Response (JSON):**
```json
{
  "message": "Yes! You've solved it. What made you confident in this answer?",
  "annotations": []
}
```

**Note:** No annotations needed when the answer is already clear.

---

## Example 5: Error Case - Text Not Found

**Problem:** `2x + 5 = 13`

**AI Response (JSON):**
```json
{
  "message": "What about the coefficient of x?",
  "annotations": [
    {
      "type": "highlight",
      "target": {
        "mode": "text",
        "text": "3y"
      },
      "style": {
        "color": "yellow"
      }
    }
  ]
}
```

**What Happens:**
1. Client tries to find "3y" in problem
2. Text not found → annotation is skipped
3. Console warning: `Text "3y" not found in problem`
4. Conversation continues text-only (graceful degradation)

**Rendered Output:**
```
2x + 5 = 13

Tutor: What about the coefficient of x?
```

---

## Example 6: Validation Failure - Invalid Type

**AI Response (JSON):**
```json
{
  "message": "Let's look at this term",
  "annotations": [
    {
      "type": "sparkles",
      "target": {
        "mode": "text",
        "text": "2x"
      }
    }
  ]
}
```

**What Happens:**
1. Validation catches invalid type "sparkles"
2. Annotation is discarded
3. Console warning: `Invalid annotation type: sparkles`
4. Message still displays

**Rendered Output:**
```
2x + 5 = 13

Tutor: Let's look at this term
```

---

## Example 7: Too Many Annotations

**AI Response (JSON):**
```json
{
  "message": "This equation has many parts",
  "annotations": [
    {"type": "highlight", "target": {"mode": "text", "text": "2"}},
    {"type": "highlight", "target": {"mode": "text", "text": "x"}},
    {"type": "highlight", "target": {"mode": "text", "text": "+"}},
    {"type": "highlight", "target": {"mode": "text", "text": "5"}},
    {"type": "highlight", "target": {"mode": "text", "text": "="}},
    {"type": "highlight", "target": {"mode": "text", "text": "13"}}
  ]
}
```

**What Happens:**
1. Validation catches > 5 annotations
2. All annotations discarded (too noisy)
3. Console warning: `Too many annotations (6), limit is 5`

**Rendered Output:**
```
2x + 5 = 13

Tutor: This equation has many parts
```

---

## Example 8: Malformed JSON

**AI Response (Raw Text):**
```
{
  "message": "What should we do first?",
  "annotations": [
    {
      "type": "highlight",
      "target": {"mode": "text", "text": "2x"}
      // Missing closing brace
    }
  ]
}
```

**What Happens:**
1. JSON.parse() throws error
2. Fallback: treat entire response as plain text
3. Console warning: `AI returned non-JSON response, falling back to text-only`

**Rendered Output:**
```
2x + 5 = 13

Tutor: { "message": "What should we do first?", "annotations": [...]
```

**Better Fallback (Extract Message):**
We can attempt to extract the message field even from malformed JSON:

```typescript
function parseWithFallback(rawResponse: string): TutorResponse {
  try {
    return JSON.parse(rawResponse);
  } catch (e) {
    // Try to extract message field with regex
    const messageMatch = rawResponse.match(/"message"\s*:\s*"([^"]+)"/);
    if (messageMatch) {
      return { message: messageMatch[1], annotations: [] };
    }
    // Last resort: return raw text
    return { message: rawResponse, annotations: [] };
  }
}
```

---

## Testing Fixtures

Use these to test rendering without calling the AI:

```typescript
// src/lib/__tests__/annotation-fixtures.ts

export const ANNOTATION_TEST_CASES = {
  validHighlight: {
    problem: "2x + 5 = 13",
    response: {
      message: "What is the coefficient?",
      annotations: [{
        type: "highlight",
        target: { mode: "text", text: "2x" },
        style: { color: "yellow", opacity: 0.3 }
      }]
    },
    expectedValid: true
  },

  textNotFound: {
    problem: "2x + 5 = 13",
    response: {
      message: "Look at this term",
      annotations: [{
        type: "highlight",
        target: { mode: "text", text: "3y" },  // Doesn't exist
        style: { color: "yellow" }
      }]
    },
    expectedValid: true,  // Valid schema, but won't render
    expectedRenderErrors: ["TEXT_NOT_FOUND"]
  },

  invalidType: {
    problem: "2x + 5 = 13",
    response: {
      message: "Test",
      annotations: [{
        type: "invalid_type",
        target: { mode: "text", text: "2x" }
      }]
    },
    expectedValid: false
  },

  missingTarget: {
    problem: "2x + 5 = 13",
    response: {
      message: "Test",
      annotations: [{
        type: "highlight",
        style: { color: "yellow" }
        // Missing target
      }]
    },
    expectedValid: false
  },

  tooManyAnnotations: {
    problem: "2x + 5 = 13",
    response: {
      message: "Test",
      annotations: Array(10).fill({
        type: "highlight",
        target: { mode: "text", text: "x" },
        style: { color: "yellow" }
      })
    },
    expectedValid: false
  }
};
```

---

## Implementation Code Snippets

### 1. Updated API Client

```typescript
// src/lib/api-client.ts

export async function sendMessage(
  problem: string,
  messages: Message[],
  signal: AbortSignal
): Promise<TutorResponse> {

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem,
      messages,
      enableAnnotations: true  // NEW flag
    }),
    signal
  });

  const data = await response.json();

  // Validate structure
  const validation = validateTutorResponse(data);

  if (!validation.valid) {
    console.warn('Invalid annotation structure:', validation.errors);
    // Fallback to text-only
    return {
      message: data.message || data,
      annotations: []
    };
  }

  return validation.sanitizedResponse!;
}
```

### 2. Validation Function

```typescript
// src/lib/annotation-validator.ts

import type { TutorResponse, Annotation } from '@/types/whiteboard';

interface ValidationError {
  field: string;
  error: string;
}

export function validateTutorResponse(data: any): {
  valid: boolean;
  errors: ValidationError[];
  sanitizedResponse?: TutorResponse;
} {
  const errors: ValidationError[] = [];

  // Check message
  if (!data.message || typeof data.message !== 'string') {
    errors.push({ field: 'message', error: 'Missing or invalid message' });
  }

  // Check annotations (optional)
  if (data.annotations !== undefined) {
    if (!Array.isArray(data.annotations)) {
      errors.push({ field: 'annotations', error: 'Must be an array' });
    } else if (data.annotations.length > 5) {
      errors.push({ field: 'annotations', error: 'Too many annotations (max 5)' });
    } else {
      // Validate each annotation
      data.annotations.forEach((ann: any, idx: number) => {
        if (!ann.type || !['highlight', 'circle', 'arrow', 'label', 'underline'].includes(ann.type)) {
          errors.push({ field: `annotations[${idx}].type`, error: 'Invalid type' });
        }
        if (!ann.target) {
          errors.push({ field: `annotations[${idx}].target`, error: 'Missing target' });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedResponse: errors.length === 0 ? data : undefined
  };
}
```

### 3. Text Position Finder

```typescript
// src/lib/text-position-finder.ts

interface TextPosition {
  index: number;      // Character index in string
  x: number;          // Pixel X coordinate
  y: number;          // Pixel Y coordinate
  width: number;      // Width of text
  height: number;     // Height of text
}

export function findTextPosition(
  problemText: string,
  searchText: string,
  occurrence: number = 1,
  context?: CanvasRenderingContext2D
): TextPosition | null {

  // Find text index
  let index = -1;
  let count = 0;
  let searchIndex = 0;

  while (count < occurrence) {
    index = problemText.indexOf(searchText, searchIndex);
    if (index === -1) return null;
    count++;
    searchIndex = index + 1;
  }

  // Calculate pixel position (simplified - real implementation needs canvas context)
  // This is a placeholder - actual implementation depends on how you render the problem text
  const charWidth = 10; // Approximate
  const lineHeight = 20;

  return {
    index,
    x: index * charWidth,
    y: lineHeight,
    width: searchText.length * charWidth,
    height: lineHeight
  };
}
```

---

## Next Steps

1. **Review this API design** - Make sure it fits your needs
2. **Set up test fixtures** - Start with manual annotation JSON before AI
3. **Implement validation layer** - Ensure robust error handling
4. **Build WhiteboardCanvas component** - Render static annotations first
5. **Update OpenAI integration** - Add JSON response format
6. **Test with AI** - See how well GPT-4 generates annotations
7. **Iterate on prompt** - Refine based on AI behavior

---

**Key Insight:** Build the rendering layer FIRST with test fixtures, THEN connect the AI. This de-risks the hardest part (AI reliability) by proving the UI works independently.
