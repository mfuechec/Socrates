/**
 * Main chat interface component
 * Owns ConversationState and UIState, coordinates all interactions
 */

import { useState, useRef, useEffect } from 'react';
import ProblemInput from './ProblemInput';
import MessageList from './MessageList';
import type { ConversationState } from '@/types/conversation';
import type { UIState } from '@/types/ui';
import {
  sendMessage,
  getTurnCount,
  shouldWarnAboutLength,
} from '@/lib/conversation-manager';
import { getErrorMessage } from '@/lib/error-messages';
import { generateSimilarProblem, generateHarderProblem } from '@/lib/api-client';

const MAX_MESSAGE_LENGTH = 1000;

export default function ChatInterface() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(true);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  // Conversation state
  const [conversationState, setConversationState] =
    useState<ConversationState>({
      problemStatement: '',
      messages: [],
      masteryLevel: null,
    });

  // UI state
  const [uiState, setUIState] = useState<UIState>({
    isLoading: false,
    error: null,
    imagePreviewUrl: null,
  });

  // Generating similar problem state
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);

  // Generating harder problem state
  const [isGeneratingHarder, setIsGeneratingHarder] = useState(false);

  // Retry state
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  // Message input
  const [messageInput, setMessageInput] = useState('');

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Message input ref for focus management
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input after response arrives
  useEffect(() => {
    if (!uiState.isLoading && conversationState.messages.length > 0) {
      messageInputRef.current?.focus();
    }
  }, [uiState.isLoading, conversationState.messages.length]);

  // Calculate mastery level based on turn count
  const calculateMastery = (turnCount: number): import('@/types/conversation').MasteryLevel => {
    if (turnCount <= 3) return 'mastered';
    if (turnCount <= 6) return 'competent';
    return 'struggling';
  };

  // Handle problem submission (start conversation)
  const handleProblemSubmit = (problem: string) => {
    setConversationState({
      problemStatement: problem,
      messages: [],
      masteryLevel: null,
    });
  };

  // Handle sending a student message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || uiState.isLoading) return;

    // Create student message immediately
    const studentMsg: import('@/types/conversation').Message = {
      role: 'student',
      content: trimmedMessage,
      timestamp: new Date(),
    };

    // Add student message to UI immediately (optimistic update)
    const messagesWithStudent = [...conversationState.messages, studentMsg];
    setConversationState({
      ...conversationState,
      messages: messagesWithStudent,
    });

    // Clear input immediately
    setMessageInput('');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setUIState({ ...uiState, isLoading: true, error: null });
    setRetryAttempt(0);

    try {
      const { tutorMessage } = await sendMessage(
        conversationState.problemStatement,
        messagesWithStudent,
        abortControllerRef.current.signal,
        (attempt) => {
          // Update retry count in UI
          setRetryAttempt(attempt);
        }
      );

      // Add tutor response to messages
      const updatedMessages = [...messagesWithStudent, tutorMessage];
      const currentTurnCount = getTurnCount(updatedMessages);

      // Calculate mastery level when problem appears to be complete
      // (AI will say things like "correct!" or "you've solved it")
      const isComplete = tutorMessage.content.toLowerCase().includes('correct!') ||
                        tutorMessage.content.toLowerCase().includes("you've solved it");
      const mastery = isComplete ? calculateMastery(currentTurnCount) : conversationState.masteryLevel;

      setConversationState({
        ...conversationState,
        messages: updatedMessages,
        masteryLevel: mastery,
      });
      setUIState({ ...uiState, isLoading: false, error: null });
      setRetryAttempt(0);
    } catch (error: any) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        setUIState({ ...uiState, isLoading: false, error: null });
        setRetryAttempt(0);
        return;
      }

      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        isLoading: false,
        error: errorMsg,
      });
      setRetryAttempt(0);
    }
  };

  // Handle reset (new problem)
  const handleReset = () => {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setConversationState({
      problemStatement: '',
      messages: [],
      masteryLevel: null,
    });
    setMessageInput('');
    setUIState({
      isLoading: false,
      error: null,
      imagePreviewUrl: null,
    });
    setRetryAttempt(0);
  };

  // Handle generate similar problem
  const handleGenerateSimilar = async () => {
    if (isGeneratingSimilar) return;

    setIsGeneratingSimilar(true);
    setUIState({ ...uiState, error: null });

    try {
      const newProblem = await generateSimilarProblem(conversationState.problemStatement);

      // Reset conversation with new problem
      setConversationState({
        problemStatement: newProblem,
        messages: [],
        masteryLevel: null,
      });
      setMessageInput('');
      setRetryAttempt(0);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        error: errorMsg,
      });
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  // Handle generate harder problem
  const handleGenerateHarder = async () => {
    if (isGeneratingHarder) return;

    setIsGeneratingHarder(true);
    setUIState({ ...uiState, error: null });

    try {
      const newProblem = await generateHarderProblem(conversationState.problemStatement);

      // Reset conversation with new problem
      setConversationState({
        problemStatement: newProblem,
        messages: [],
        masteryLevel: null,
      });
      setMessageInput('');
      setRetryAttempt(0);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        error: errorMsg,
      });
    } finally {
      setIsGeneratingHarder(false);
    }
  };

  const turnCount = getTurnCount(conversationState.messages);
  const showLengthWarning = shouldWarnAboutLength(conversationState.messages);
  const messageValid =
    messageInput.trim().length > 0 &&
    messageInput.length <= MAX_MESSAGE_LENGTH;

  // Show problem input if no problem set yet
  if (!conversationState.problemStatement) {
    return <ProblemInput onProblemSubmit={handleProblemSubmit} />;
  }

  // Show chat interface
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with turn counter and reset button */}
      <div className="card-bg border-b border-secondary px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-heading">
            Socrates Math Tutor
          </h2>
          <p className="text-sm text-secondary">
            Turn {turnCount}
            {showLengthWarning && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-medium">
                ⚠ Consider starting a new problem
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn-secondary"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleGenerateSimilar}
            disabled={isGeneratingSimilar}
            className="btn-secondary"
            title="Generate a similar practice problem"
          >
            {isGeneratingSimilar ? 'Generating...' : 'Similar Problem'}
          </button>
          <button
            onClick={handleGenerateHarder}
            disabled={isGeneratingHarder}
            className="btn-secondary"
            title="Generate a harder problem to challenge yourself"
          >
            {isGeneratingHarder ? 'Generating...' : 'Harder Problem'}
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary"
          >
            New Problem
          </button>
        </div>
      </div>

      {/* Message list */}
      <MessageList
        messages={conversationState.messages}
        problemStatement={conversationState.problemStatement}
        isLoading={uiState.isLoading}
      />

      {/* Input area */}
      <div className="card-bg border-t border-secondary p-6">
        {/* Retry indicator */}
        {retryAttempt > 0 && (
          <div className="mb-4 flex items-center justify-center space-x-3 alert-warning">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 dark:border-yellow-500"></div>
            <span className="text-sm font-medium">
              Retrying... (attempt {retryAttempt}/3)
            </span>
          </div>
        )}

        {/* Error display */}
        {uiState.error && (
          <div className="mb-4 alert-error">
            {uiState.error}
          </div>
        )}

        {/* Message input form */}
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={messageInputRef}
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your response..."
              disabled={uiState.isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 input-field"
            />
            <button
              type="submit"
              disabled={!messageValid || uiState.isLoading}
              className="btn-primary"
            >
              {uiState.isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-tertiary mt-2">
            {messageInput.length}/{MAX_MESSAGE_LENGTH} characters
          </p>
        </form>
      </div>
    </div>
  );
}
