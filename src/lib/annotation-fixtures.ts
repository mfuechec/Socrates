/**
 * Test fixtures for annotation rendering
 * Use these to test WhiteboardCanvas WITHOUT calling the AI
 */

import type { TutorResponse, Annotation } from '@/types/whiteboard';

// ============================================================================
// Basic Annotation Tests
// ============================================================================

export const SIMPLE_HIGHLIGHT: TutorResponse = {
  message: "What is the coefficient of x?",
  annotations: [
    {
      type: 'highlight',
      target: {
        mode: 'text',
        text: '2x',
      },
      style: {
        color: 'yellow',
        opacity: 0.3,
      },
    },
  ],
};

export const SIMPLE_CIRCLE: TutorResponse = {
  message: "Look at this term carefully.",
  annotations: [
    {
      type: 'circle',
      target: {
        mode: 'text',
        text: 'x²',
      },
      style: {
        color: 'red',
        strokeWidth: 2,
      },
    },
  ],
};

export const SIMPLE_LABEL: TutorResponse = {
  message: "This is called the coefficient.",
  annotations: [
    {
      type: 'label',
      target: {
        mode: 'text',
        text: '2x',
      },
      content: 'Coefficient',
      style: {
        color: 'black',
        fontSize: 12,
      },
    },
  ],
};

export const SIMPLE_UNDERLINE: TutorResponse = {
  message: "Pay attention to the constant term.",
  annotations: [
    {
      type: 'underline',
      target: {
        mode: 'text',
        text: '5',
      },
      style: {
        color: 'blue',
        strokeWidth: 2,
      },
    },
  ],
};

// ============================================================================
// Multiple Annotations
// ============================================================================

export const MULTIPLE_ANNOTATIONS: TutorResponse = {
  message: "Compare these two terms. What's different?",
  annotations: [
    {
      type: 'circle',
      target: {
        mode: 'text',
        text: '2x',
      },
      style: {
        color: 'blue',
        strokeWidth: 2,
      },
    },
    {
      type: 'circle',
      target: {
        mode: 'text',
        text: '5',
      },
      style: {
        color: 'red',
        strokeWidth: 2,
      },
    },
  ],
};

export const HIGHLIGHT_WITH_LABEL: TutorResponse = {
  message: "This is the variable term.",
  annotations: [
    {
      type: 'highlight',
      target: {
        mode: 'text',
        text: '2x',
      },
      style: {
        color: 'yellow',
        opacity: 0.3,
      },
    },
    {
      type: 'label',
      target: {
        mode: 'text',
        text: '2x',
      },
      content: 'Variable term',
      style: {
        fontSize: 12,
      },
    },
  ],
};

// ============================================================================
// Edge Cases
// ============================================================================

export const TEXT_NOT_FOUND: TutorResponse = {
  message: "Look at this term.",
  annotations: [
    {
      type: 'highlight',
      target: {
        mode: 'text',
        text: '3y', // Doesn't exist in "2x + 5 = 13"
      },
      style: {
        color: 'yellow',
      },
    },
  ],
};

export const MULTIPLE_OCCURRENCES: TutorResponse = {
  message: "Notice how x appears multiple times.",
  annotations: [
    {
      type: 'highlight',
      target: {
        mode: 'text',
        text: 'x', // Will appear multiple times in "x + x + x = 15"
      },
      style: {
        color: 'yellow',
      },
    },
  ],
};

export const LATEX_MISMATCH: TutorResponse = {
  message: "Look at the squared term.",
  annotations: [
    {
      type: 'highlight',
      target: {
        mode: 'text',
        text: 'x²', // Might be stored as "x^2"
      },
      style: {
        color: 'yellow',
      },
    },
  ],
};

export const TOO_MANY_ANNOTATIONS: TutorResponse = {
  message: "This equation has many parts.",
  annotations: [
    { type: 'highlight', target: { mode: 'text', text: '2' } },
    { type: 'highlight', target: { mode: 'text', text: 'x' } },
    { type: 'highlight', target: { mode: 'text', text: '+' } },
    { type: 'highlight', target: { mode: 'text', text: '5' } },
    { type: 'highlight', target: { mode: 'text', text: '=' } },
    { type: 'highlight', target: { mode: 'text', text: '13' } },
  ],
};

export const EMPTY_ANNOTATIONS: TutorResponse = {
  message: "What should we do first?",
  annotations: [],
};

export const NO_ANNOTATIONS: TutorResponse = {
  message: "What should we do first?",
  // annotations field omitted entirely
};

// ============================================================================
// Test Problems (matching fixtures)
// ============================================================================

export const TEST_PROBLEMS = {
  linear: '2x + 5 = 13',
  quadratic: 'x² + 5x + 6 = 0',
  multipleX: 'x + x + x = 15',
  factored: '(x + 3)(x - 2) = 0',
  complex: '3x² - 2x + 7 = 0',
};

// ============================================================================
// Complete Test Cases (problem + response pairs)
// ============================================================================

export interface TestCase {
  name: string;
  problem: string;
  response: TutorResponse;
  expectedBehavior: string;
  shouldRenderSuccessfully: boolean;
  expectedRenderErrors?: string[];
}

export const TEST_CASES: TestCase[] = [
  {
    name: 'Simple highlight',
    problem: TEST_PROBLEMS.linear,
    response: SIMPLE_HIGHLIGHT,
    expectedBehavior: 'Highlights "2x" in yellow',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'Simple circle',
    problem: TEST_PROBLEMS.quadratic,
    response: SIMPLE_CIRCLE,
    expectedBehavior: 'Circles "x²" in red',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'Simple label',
    problem: TEST_PROBLEMS.linear,
    response: SIMPLE_LABEL,
    expectedBehavior: 'Adds label "Coefficient" near "2x"',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'Multiple annotations',
    problem: TEST_PROBLEMS.linear,
    response: MULTIPLE_ANNOTATIONS,
    expectedBehavior: 'Circles both "2x" and "5"',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'Text not found',
    problem: TEST_PROBLEMS.linear,
    response: TEXT_NOT_FOUND,
    expectedBehavior: 'Skips annotation, logs warning',
    shouldRenderSuccessfully: true, // Canvas renders, just skips invalid annotation
    expectedRenderErrors: ['TEXT_NOT_FOUND'],
  },
  {
    name: 'Multiple occurrences',
    problem: TEST_PROBLEMS.multipleX,
    response: MULTIPLE_OCCURRENCES,
    expectedBehavior: 'Highlights all 3 occurrences of "x"',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'Too many annotations',
    problem: TEST_PROBLEMS.linear,
    response: TOO_MANY_ANNOTATIONS,
    expectedBehavior: 'Limits to first 5 annotations',
    shouldRenderSuccessfully: true,
  },
  {
    name: 'No annotations',
    problem: TEST_PROBLEMS.linear,
    response: NO_ANNOTATIONS,
    expectedBehavior: 'No canvas rendered (text-only)',
    shouldRenderSuccessfully: true,
  },
];

// ============================================================================
// Mock AI Responses (for integration testing)
// ============================================================================

export const MOCK_AI_RESPONSES: Record<string, TutorResponse> = {
  opening: {
    message: "I see you want to solve 2x + 5 = 13. What do you think we should do first to isolate x?",
    annotations: [
      {
        type: 'highlight',
        target: { mode: 'text', text: 'x' },
        style: { color: 'yellow' },
      },
    ],
  },

  guidingSubtraction: {
    message: "Good thinking! When we subtract 5 from both sides, what are we trying to do to the equation?",
    annotations: [
      {
        type: 'highlight',
        target: { mode: 'text', text: '5' },
        style: { color: 'yellow' },
      },
    ],
  },

  comparingTerms: {
    message: "Compare the left side and right side. What's different after subtracting 5?",
    annotations: [
      {
        type: 'circle',
        target: { mode: 'text', text: '2x' },
        style: { color: 'blue', strokeWidth: 2 },
      },
      {
        type: 'circle',
        target: { mode: 'text', text: '8' },
        style: { color: 'red', strokeWidth: 2 },
      },
    ],
  },

  finalStep: {
    message: "Great! Now we have 2x = 8. What operation will give us x by itself?",
    annotations: [
      {
        type: 'highlight',
        target: { mode: 'text', text: '2x' },
      },
      {
        type: 'label',
        target: { mode: 'text', text: '2x' },
        content: 'Divide both sides by 2',
        style: { fontSize: 12 },
      },
    ],
  },

  celebration: {
    message: "Correct! You've solved it. x = 4. How does it feel to work through that step by step?",
    annotations: [], // No annotations needed for celebration
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a random test case for quick testing
 */
export function getRandomTestCase(): TestCase {
  return TEST_CASES[Math.floor(Math.random() * TEST_CASES.length)];
}

/**
 * Get all valid test cases (should render successfully)
 */
export function getValidTestCases(): TestCase[] {
  return TEST_CASES.filter((tc) => tc.shouldRenderSuccessfully);
}

/**
 * Get error test cases (edge cases that should handle errors gracefully)
 */
export function getErrorTestCases(): TestCase[] {
  return TEST_CASES.filter((tc) => tc.expectedRenderErrors && tc.expectedRenderErrors.length > 0);
}

/**
 * Simulate AI response delay (for realistic testing)
 */
export async function mockAIDelay(ms: number = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get a mock AI response with delay (simulates real API call)
 */
export async function getMockAIResponse(key: keyof typeof MOCK_AI_RESPONSES): Promise<TutorResponse> {
  await mockAIDelay(800);
  return MOCK_AI_RESPONSES[key];
}
