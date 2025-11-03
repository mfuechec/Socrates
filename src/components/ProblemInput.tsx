/**
 * Problem input component
 * Allows student to enter math problem via text or image
 */

import { useState } from 'react';
import ImageUpload from './ImageUpload';

interface ProblemInputProps {
  onProblemSubmit: (problem: string) => void;
}

const MAX_PROBLEM_LENGTH = 500;

type InputMode = 'text' | 'image';

export default function ProblemInput({ onProblemSubmit }: ProblemInputProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [problemText, setProblemText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemText.trim()) {
      onProblemSubmit(problemText.trim());
    }
  };

  const handleImageExtracted = (text: string) => {
    onProblemSubmit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isValid) {
        onProblemSubmit(problemText.trim());
      }
    }
  };

  const isValid =
    problemText.trim().length > 0 && problemText.length <= MAX_PROBLEM_LENGTH;
  const remaining = MAX_PROBLEM_LENGTH - problemText.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="card-bg rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-heading mb-2">
          Socrates Math Tutor
        </h1>
        <p className="text-secondary mb-6">
          Enter your math problem below. I'll guide you to the solution using
          the Socratic method.
        </p>

        {/* Tab selector */}
        <div className="flex space-x-2 mb-6 border-b border-secondary">
          <button
            onClick={() => setMode('text')}
            className={`tab-button ${
              mode === 'text'
                ? 'tab-button-active'
                : 'tab-button-inactive'
            }`}
          >
            ✏️ Type Problem
          </button>
          <button
            onClick={() => setMode('image')}
            className={`tab-button ${
              mode === 'image'
                ? 'tab-button-active'
                : 'tab-button-inactive'
            }`}
          >
            📷 Upload Image
          </button>
        </div>

        {/* Text input mode */}
        {mode === 'text' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="problem"
                className="block text-sm font-medium text-label mb-2"
              >
                Your Math Problem
              </label>
              <textarea
                id="problem"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Example: Solve for x: 2x + 5 = 13"
                className="w-full input-field resize-none"
                rows={4}
                maxLength={MAX_PROBLEM_LENGTH}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-tertiary">
                  Press Enter to submit • Shift+Enter for new line
                </p>
                <p className="text-sm text-tertiary">
                  {remaining} remaining
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full btn-primary"
            >
              Start Tutoring Session
            </button>
          </form>
        )}

        {/* Image upload mode */}
        {mode === 'image' && (
          <ImageUpload onImageExtracted={handleImageExtracted} />
        )}
        </div>
      </div>
    </div>
  );
}
