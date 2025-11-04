/**
 * Whiteboard Test Page
 * Test annotation rendering with fixtures (no AI required)
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import WhiteboardCanvas as client-side only (Fabric.js needs browser APIs)
const WhiteboardCanvas = dynamic(
  () => import('@/components/whiteboard/WhiteboardCanvas'),
  { ssr: false }
);
import {
  TEST_CASES,
  TEST_PROBLEMS,
  SIMPLE_HIGHLIGHT,
  SIMPLE_CIRCLE,
  SIMPLE_LABEL,
  MULTIPLE_ANNOTATIONS,
  TEXT_NOT_FOUND,
  MULTIPLE_OCCURRENCES,
  type TestCase,
} from '@/lib/annotation-fixtures';

export default function TestWhiteboardPage() {
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default
  const [selectedTest, setSelectedTest] = useState<TestCase>(TEST_CASES[0]);

  return (
    <div className={darkMode ? 'dark' : ''} style={{ overflow: 'auto', height: '100vh' }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto pb-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Whiteboard Annotation Test
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Test Case Selector */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Select Test Case
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {TEST_CASES.map((testCase, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTest(testCase)}
                  className={`p-4 rounded border-2 text-left ${
                    selectedTest === testCase
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {testCase.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {testCase.expectedBehavior}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Test Display */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Current Test: {selectedTest.name}
            </h2>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem:
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded font-mono text-gray-900 dark:text-gray-100">
                {selectedTest.problem}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Response:
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                {selectedTest.response.message}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Behavior:
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded text-gray-900 dark:text-gray-100">
                {selectedTest.expectedBehavior}
              </div>
            </div>

            {selectedTest.expectedRenderErrors && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Errors:
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded text-gray-900 dark:text-gray-100">
                  {selectedTest.expectedRenderErrors.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Canvas Rendering */}
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Rendered Output
            </h2>

            {selectedTest.response.annotations && selectedTest.response.annotations.length > 0 ? (
              <WhiteboardCanvas
                problemText={selectedTest.problem}
                annotations={selectedTest.response.annotations}
                darkMode={darkMode}
              />
            ) : (
              <div className="p-8 bg-gray-100 dark:bg-gray-700 rounded text-center text-gray-600 dark:text-gray-400">
                No annotations for this test case (text-only mode)
              </div>
            )}
          </div>

          {/* Annotation Data (Debug) */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Annotation Data (Debug)
            </h2>
            <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto text-sm text-gray-900 dark:text-gray-100">
              {JSON.stringify(selectedTest.response.annotations, null, 2)}
            </pre>
          </div>

          {/* Quick Test Buttons */}
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Quick Tests
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Highlight Test',
                    problem: TEST_PROBLEMS.linear,
                    response: SIMPLE_HIGHLIGHT,
                    expectedBehavior: 'Highlights 2x',
                    shouldRenderSuccessfully: true,
                  })
                }
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Test Highlight
              </button>
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Circle Test',
                    problem: TEST_PROBLEMS.quadratic,
                    response: SIMPLE_CIRCLE,
                    expectedBehavior: 'Circles x²',
                    shouldRenderSuccessfully: true,
                  })
                }
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Test Circle
              </button>
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Label Test',
                    problem: TEST_PROBLEMS.linear,
                    response: SIMPLE_LABEL,
                    expectedBehavior: 'Adds label',
                    shouldRenderSuccessfully: true,
                  })
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Label
              </button>
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Multiple Test',
                    problem: TEST_PROBLEMS.linear,
                    response: MULTIPLE_ANNOTATIONS,
                    expectedBehavior: 'Multiple circles',
                    shouldRenderSuccessfully: true,
                  })
                }
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Test Multiple
              </button>
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Text Not Found',
                    problem: TEST_PROBLEMS.linear,
                    response: TEXT_NOT_FOUND,
                    expectedBehavior: 'Graceful failure',
                    shouldRenderSuccessfully: true,
                    expectedRenderErrors: ['TEXT_NOT_FOUND'],
                  })
                }
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Test Error
              </button>
              <button
                onClick={() =>
                  setSelectedTest({
                    name: 'Multiple X',
                    problem: TEST_PROBLEMS.multipleX,
                    response: MULTIPLE_OCCURRENCES,
                    expectedBehavior: 'Highlights all x',
                    shouldRenderSuccessfully: true,
                  })
                }
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Multi-Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
