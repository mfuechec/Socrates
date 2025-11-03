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

  const isValid =
    problemText.trim().length > 0 && problemText.length <= MAX_PROBLEM_LENGTH;
  const remaining = MAX_PROBLEM_LENGTH - problemText.length;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Socrates Math Tutor
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your math problem below. I'll guide you to the solution using
          the Socratic method.
        </p>

        {/* Tab selector */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setMode('text')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              mode === 'text'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✏️ Type Problem
          </button>
          <button
            onClick={() => setMode('image')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              mode === 'image'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
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
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Math Problem
              </label>
              <textarea
                id="problem"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Example: Solve for x: 2x + 5 = 13"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={MAX_PROBLEM_LENGTH}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {remaining} characters remaining
                </p>
                {problemText.length > MAX_PROBLEM_LENGTH * 0.9 && (
                  <p className="text-sm text-orange-600">
                    Approaching character limit
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
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
  );
}
