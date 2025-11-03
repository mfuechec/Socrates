/**
 * Main chat interface component
 * Owns ConversationState and UIState, coordinates all interactions
 */

import { useState, useRef } from 'react';
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

const MAX_MESSAGE_LENGTH = 1000;

export default function ChatInterface() {
  // Conversation state
  const [conversationState, setConversationState] =
    useState<ConversationState>({
      problemStatement: '',
      messages: [],
    });

  // UI state
  const [uiState, setUIState] = useState<UIState>({
    isLoading: false,
    error: null,
    imagePreviewUrl: null,
  });

  // Retry state
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  // Message input
  const [messageInput, setMessageInput] = useState('');

  // AbortController for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle problem submission (start conversation)
  const handleProblemSubmit = (problem: string) => {
    setConversationState({
      problemStatement: problem,
      messages: [],
    });
  };

  // Handle sending a student message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || uiState.isLoading) return;

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setUIState({ ...uiState, isLoading: true, error: null });
    setRetryAttempt(0);

    try {
      const { updatedMessages } = await sendMessage(
        conversationState,
        trimmedMessage,
        abortControllerRef.current.signal,
        (attempt) => {
          // Update retry count in UI
          setRetryAttempt(attempt);
        }
      );

      setConversationState({
        ...conversationState,
        messages: updatedMessages,
      });
      setMessageInput('');
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
    });
    setMessageInput('');
    setUIState({
      isLoading: false,
      error: null,
      imagePreviewUrl: null,
    });
    setRetryAttempt(0);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with turn counter and reset button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Socrates Math Tutor
          </h2>
          <p className="text-sm text-gray-600">
            Turn {turnCount}
            {showLengthWarning && (
              <span className="ml-2 text-yellow-600 font-medium">
                ⚠ Consider starting a new problem
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          New Problem
        </button>
      </div>

      {/* Message list */}
      <MessageList
        messages={conversationState.messages}
        problemStatement={conversationState.problemStatement}
      />

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 p-6">
        {/* Retry indicator */}
        {retryAttempt > 0 && (
          <div className="mb-4 flex items-center justify-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-yellow-700 text-sm font-medium">
              Retrying... (attempt {retryAttempt}/3)
            </span>
          </div>
        )}

        {/* Error display */}
        {uiState.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {uiState.error}
          </div>
        )}

        {/* Message input form */}
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your response..."
              disabled={uiState.isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!messageValid || uiState.isLoading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                messageValid && !uiState.isLoading
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {uiState.isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {messageInput.length}/{MAX_MESSAGE_LENGTH} characters
          </p>
        </form>
      </div>
    </div>
  );
}
