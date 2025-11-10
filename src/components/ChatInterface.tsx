/**
 * Main chat interface component
 * Owns ConversationState and UIState, coordinates all interactions
 */

import { useState, useRef, useEffect } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import MessageList from './MessageList';
import MathRenderer from './MathRenderer';
import SolutionPathProgress from './SolutionPathProgress';
import MixedPracticeModal from './MixedPracticeModal';
import WhiteboardCanvas from './whiteboard/WhiteboardCanvas';
import AuthButton from './AuthButton';
import UserReport from './UserReport';
import type { ConversationState } from '@/types/conversation';
import type { UIState } from '@/types/ui';
import type { Annotation } from '@/types/whiteboard';
import type { Database } from '@/lib/supabase';
import {
  sendMessage,
  getTurnCount,
  shouldWarnAboutLength,
  saveProblemAttempt,
} from '@/lib/conversation-manager';
import { getErrorMessage } from '@/lib/error-messages';
import { generateSimilarProblem, generateHarderProblem, analyzeProblem } from '@/lib/api-client';
import {
  detectStruggleKeywords,
  updateStruggleState,
  resetStruggleState,
  handleStepProgression,
} from '@/lib/solution-path-manager';

const MAX_MESSAGE_LENGTH = 1000;

export default function ChatInterface() {
  // Auth
  const session = useSession();
  const supabase = useSupabaseClient<Database>();
  const [signingOut, setSigningOut] = useState(false);

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
      solutionPath: undefined,
      currentApproachIndex: 0,
      currentStepIndex: 0,
      struggleState: resetStruggleState(),
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

  // Show report modal state
  const [showReport, setShowReport] = useState(false);

  // Report refresh trigger (increment to force refresh)
  const [reportRefreshTrigger, setReportRefreshTrigger] = useState(0);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Mixed practice session state
  const [practiceSession, setPracticeSession] = useState<{
    sessionId: string;
    problems: Array<{ topic: string; problemText: string }>;
    currentIndex: number;
    completedStats: { mastered: number; competent: number; struggling: number };
  } | null>(null);

  // Starting mixed practice state
  const [isStartingMixedPractice, setIsStartingMixedPractice] = useState(false);

  // Mixed practice modal state
  const [mixedPracticeModal, setMixedPracticeModal] = useState<{
    mode: 'preview' | 'celebration';
    data?: any;
  } | null>(null);

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

  // Get current annotations from most recent tutor message
  const getCurrentAnnotations = (): Annotation[] => {
    // Find the most recent tutor message with annotations
    for (let i = conversationState.messages.length - 1; i >= 0; i--) {
      const message = conversationState.messages[i];
      if (message.role === 'tutor' && message.annotations && message.annotations.length > 0) {
        return message.annotations;
      }
    }
    return [];
  };

  // Get current equation state from most recent tutor message
  const getCurrentState = (): string | undefined => {
    // Find the most recent tutor message with currentState
    for (let i = conversationState.messages.length - 1; i >= 0; i--) {
      const message = conversationState.messages[i];
      if (message.role === 'tutor' && message.currentState) {
        return message.currentState;
      }
    }
    return undefined;
  };

  // Handle problem submission (start conversation)
  const handleProblemSubmit = async (problem: string) => {
    // Immediately transition to chat mode with the problem
    setConversationState({
      problemStatement: problem,
      messages: [],
      masteryLevel: null,
      solutionPath: undefined, // Will be populated in background
      currentApproachIndex: 0,
      currentStepIndex: 0,
      struggleState: resetStruggleState(),
    });

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setUIState({ ...uiState, isLoading: true, error: null });

    try {
      // Start both API calls in parallel
      const pathPromise = analyzeProblem(problem, abortControllerRef.current.signal)
        .then((path) => {
          // Render solution path immediately when ready
          console.log(`✅ Solution path generated: ${path.approaches.length} approach(es)`);
          setConversationState((prev) => ({
            ...prev,
            solutionPath: path,
          }));
          return path;
        })
        .catch((pathError: any) => {
          console.warn('⚠️  Failed to generate solution path, continuing without it:', pathError.message);
          return undefined;
        });

      const messagePromise = sendMessage(
        problem,
        [], // Empty messages array for opening
        undefined, // No path context yet for opening message
        abortControllerRef.current.signal,
        (attempt) => setRetryAttempt(attempt)
      );

      // Wait for chat message (required), solution path updates state independently
      const { tutorMessage, masteryLevel: aiMasteryLevel } = await messagePromise;

      // Add opening message to conversation
      const mastery = tutorMessage.isComplete && aiMasteryLevel ? aiMasteryLevel : null;

      setConversationState((prev) => ({
        ...prev,
        messages: [tutorMessage],
        masteryLevel: mastery,
      }));
      setUIState({ ...uiState, isLoading: false, error: null });
      setRetryAttempt(0);
    } catch (error: any) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return;
      }

      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        isLoading: false,
        error: errorMsg,
      });
    }
  };

  // Handle sending a student message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || uiState.isLoading) return;

    // If no problem statement exists, treat this message as the problem
    if (!conversationState.problemStatement) {
      setMessageInput(''); // Clear input immediately
      handleProblemSubmit(trimmedMessage);
      return;
    }

    // Create student message immediately
    const studentMsg: import('@/types/conversation').Message = {
      role: 'student',
      content: trimmedMessage,
      timestamp: new Date(),
    };

    // Add student message to UI immediately (optimistic update)
    const messagesWithStudent = [...conversationState.messages, studentMsg];

    // Detect struggle keywords in student message (hybrid tracking - part 1)
    const hasStruggleKeywords = detectStruggleKeywords(trimmedMessage);

    // Update conversation state immediately
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
      // Build path context if solution path available
      const pathContext = conversationState.solutionPath
        ? {
            solutionPath: conversationState.solutionPath,
            approachIndex: conversationState.currentApproachIndex,
            stepIndex: conversationState.currentStepIndex,
            struggleLevel: conversationState.struggleState.effectiveStruggleLevel,
          }
        : undefined;

      const { tutorMessage, masteryLevel: aiMasteryLevel, stepProgression } = await sendMessage(
        conversationState.problemStatement,
        messagesWithStudent,
        pathContext,
        abortControllerRef.current.signal,
        (attempt) => {
          // Update retry count in UI
          setRetryAttempt(attempt);
        }
      );

      // Add tutor response to messages
      const updatedMessages = [...messagesWithStudent, tutorMessage];

      // Determine mastery level
      let mastery = conversationState.masteryLevel;

      if (tutorMessage.isComplete) {
        // Use AI's assessment if provided, otherwise fall back to turn count
        if (aiMasteryLevel) {
          mastery = aiMasteryLevel;
        } else {
          const currentTurnCount = getTurnCount(updatedMessages);
          mastery = calculateMastery(currentTurnCount);
        }

        // Save attempt to database when problem is completed
        if (mastery) {
          console.log('[ChatInterface] Problem completed! Saving attempt...', {
            problem: conversationState.problemStatement.substring(0, 50),
            mastery,
            turnCount: getTurnCount(updatedMessages),
          });
          saveProblemAttempt(conversationState.problemStatement, updatedMessages)
            .then(() => {
              // Trigger report refresh
              setReportRefreshTrigger(prev => prev + 1);
              console.log('✅ Attempt saved, report will refresh');
            })
            .catch((error) => {
              console.error('Failed to save problem attempt:', error);
              // Don't show error to user - this is background operation
            });

          // Update practice session if one is active
          console.log('[ChatInterface] Practice session state:', practiceSession);
          if (practiceSession?.sessionId) {
            console.log('[ChatInterface] Updating practice session:', practiceSession.sessionId);
            fetch('/api/update-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: practiceSession.sessionId }),
            })
              .then(async (response) => {
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Practice session updated:', data.session);
                } else {
                  console.error('Failed to update practice session');
                }
              })
              .catch((error) => {
                console.error('Error updating practice session:', error);
              });
          }
        } else {
          console.log('[ChatInterface] Problem completed but no mastery level detected');
        }
      }

      // Update struggle state (hybrid tracking - part 2: combine keyword + AI assessment)
      let newStruggleState = conversationState.struggleState;
      if (hasStruggleKeywords) {
        newStruggleState = {
          ...newStruggleState,
          keywordStruggleCount: newStruggleState.keywordStruggleCount + 1,
        };
      }
      newStruggleState = updateStruggleState(
        newStruggleState,
        trimmedMessage,
        stepProgression
      );

      // Handle step progression if solution path exists
      let newApproachIndex = conversationState.currentApproachIndex;
      let newStepIndex = conversationState.currentStepIndex;

      if (conversationState.solutionPath && stepProgression) {
        const progression = handleStepProgression(
          stepProgression,
          conversationState.currentApproachIndex,
          conversationState.currentStepIndex,
          conversationState.solutionPath
        );

        if (progression.changed) {
          newApproachIndex = progression.approachIndex;
          newStepIndex = progression.stepIndex;
          // Reset struggle state when advancing to new step
          newStruggleState = resetStruggleState();
          console.log(`📈 Advanced to Step ${newStepIndex + 1} of approach ${newApproachIndex}`);
        }
      }

      setConversationState({
        ...conversationState,
        messages: updatedMessages,
        masteryLevel: mastery,
        currentApproachIndex: newApproachIndex,
        currentStepIndex: newStepIndex,
        struggleState: newStruggleState,
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
      solutionPath: undefined,
      currentApproachIndex: 0,
      currentStepIndex: 0,
      struggleState: resetStruggleState(),
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

      // Restart with new problem (will trigger solution path analysis)
      await handleProblemSubmit(newProblem);
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

  // Handle generate problem by type
  const handleGenerateProblemByType = async (type: string) => {
    const topics: Record<string, string> = {
      'linear': 'linear-equations',
      'quadratic': 'quadratic-equations',
      'systems': 'systems-of-equations',
      'calculus': 'calculus',
      'trigonometry': 'trigonometry',
    };

    const topic = topics[type];
    if (!topic) return;

    console.log('[Generate Problem] Type:', type, 'Topic:', topic);

    setUIState({ ...uiState, isLoading: true, error: null });

    try {
      // Use the generate-mixed API to create a single problem of this type
      const response = await fetch('/api/generate-mixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id || 'anonymous',
          count: 1,
          topics: [topic],
        }),
      });

      console.log('[Generate Problem] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to generate problem');
      }

      const data = await response.json();
      const problem = data.problems?.[0]?.problemText;

      console.log('[Generate Problem] Generated problem:', problem);

      if (!problem) {
        throw new Error('No problem generated');
      }

      // Now submit the actual problem
      await handleProblemSubmit(problem);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        isLoading: false,
        error: errorMsg,
      });
    }
  };

  // Handle generate harder problem
  const handleGenerateHarder = async () => {
    if (isGeneratingHarder) return;

    setIsGeneratingHarder(true);
    setUIState({ ...uiState, error: null });

    try {
      const newProblem = await generateHarderProblem(conversationState.problemStatement);

      // Restart with new problem (will trigger solution path analysis)
      await handleProblemSubmit(newProblem);
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

  // Handle start mixed practice session
  const handleStartMixedPractice = async () => {
    if (isStartingMixedPractice) return;

    setIsStartingMixedPractice(true);
    setUIState({ ...uiState, error: null });

    try {
      const response = await fetch('/api/generate-mixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate practice session');
      }

      const data = await response.json();

      // Show preview modal instead of immediately starting
      setMixedPracticeModal({
        mode: 'preview',
        data: {
          sessionId: data.sessionId,
          problems: data.problems,
          totalCount: data.totalCount,
        },
      });
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setUIState({
        ...uiState,
        error: errorMsg,
      });
    } finally {
      setIsStartingMixedPractice(false);
    }
  };

  // Actually start the session after preview confirmation
  const handleConfirmStartSession = async () => {
    if (!mixedPracticeModal?.data) return;

    const data = mixedPracticeModal.data;

    console.log(`✅ Mixed practice session started: ${data.totalCount} problems`);

    // Store session data with stats tracking
    setPracticeSession({
      sessionId: data.sessionId,
      problems: data.problems,
      currentIndex: 0,
      completedStats: { mastered: 0, competent: 0, struggling: 0 },
    });

    // Close modal
    setMixedPracticeModal(null);

    // Start with first problem
    await handleProblemSubmit(data.problems[0].problemText);
  };

  // Handle next problem in session
  const handleNextInSession = async () => {
    if (!practiceSession) return;

    // Track completion stats
    const mastery = conversationState.masteryLevel;
    const updatedStats = { ...practiceSession.completedStats };
    if (mastery === 'mastered') updatedStats.mastered++;
    else if (mastery === 'competent') updatedStats.competent++;
    else if (mastery === 'struggling') updatedStats.struggling++;

    const nextIndex = practiceSession.currentIndex + 1;

    if (nextIndex >= practiceSession.problems.length) {
      // Session complete - show celebration modal
      console.log('✅ Practice session completed!');

      const uniqueTopics = Array.from(new Set(practiceSession.problems.map(p => p.topic)));

      setMixedPracticeModal({
        mode: 'celebration',
        data: {
          totalProblems: practiceSession.problems.length,
          mastered: updatedStats.mastered,
          competent: updatedStats.competent,
          struggling: updatedStats.struggling,
          topicsEncountered: uniqueTopics,
        },
      });

      setPracticeSession(null);
      handleReset();
      return;
    }

    // Move to next problem
    setPracticeSession({
      ...practiceSession,
      currentIndex: nextIndex,
      completedStats: updatedStats,
    });

    const nextProblem = practiceSession.problems[nextIndex];
    await handleProblemSubmit(nextProblem.problemText);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const turnCount = getTurnCount(conversationState.messages);
  const showLengthWarning = shouldWarnAboutLength(conversationState.messages);
  const messageValid =
    messageInput.trim().length > 0 &&
    messageInput.length <= MAX_MESSAGE_LENGTH;

  // Check if in practice session
  const inPracticeSession = practiceSession !== null;
  const sessionProgress = inPracticeSession
    ? `Problem ${practiceSession!.currentIndex + 1} of ${practiceSession!.problems.length}`
    : null;

  // Single-screen layout with sidebar
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Collapsible Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-72'
        } transition-all duration-300 card-bg border-r border-secondary flex flex-col shadow-lg`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-secondary flex items-center justify-between">
          {!sidebarCollapsed && (
            <AuthButton />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-100 ${
              sidebarCollapsed ? 'mx-auto' : ''
            }`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Sidebar Buttons */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {/* New Problem Button */}
          <button
            onClick={handleReset}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
            } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100`}
            title="Start a new problem"
          >
            {sidebarCollapsed ? '✨' : '✨ New Problem'}
          </button>

          {/* Similar Problem Button - Always visible, greyed out when not available */}
          <button
            onClick={handleGenerateSimilar}
            disabled={isGeneratingSimilar || !(conversationState.masteryLevel === 'struggling' || conversationState.masteryLevel === 'competent')}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
            } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={(conversationState.masteryLevel === 'struggling' || conversationState.masteryLevel === 'competent') ? "Generate a similar practice problem" : "Complete a problem first"}
          >
            {sidebarCollapsed ? '📋' : isGeneratingSimilar ? 'Generating...' : '📋 Similar Problem'}
          </button>

          {/* Harder Problem Button - Always visible, greyed out when not available */}
          <button
            onClick={handleGenerateHarder}
            disabled={isGeneratingHarder || !(conversationState.masteryLevel === 'mastered' || conversationState.masteryLevel === 'competent')}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
            } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={(conversationState.masteryLevel === 'mastered' || conversationState.masteryLevel === 'competent') ? "Generate a harder problem to challenge yourself" : "Complete a problem first"}
          >
            {sidebarCollapsed ? '⬆️' : isGeneratingHarder ? 'Generating...' : '⬆️ Harder Problem'}
          </button>

          {/* Mixed Practice Button */}
          {!inPracticeSession ? (
            <button
              onClick={handleStartMixedPractice}
              disabled={isStartingMixedPractice}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
              } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Start an interleaved practice session with mixed topics"
            >
              {sidebarCollapsed ? '🎯' : isStartingMixedPractice ? 'Starting...' : '🎯 Mixed Practice'}
            </button>
          ) : (
            <button
              onClick={conversationState.masteryLevel ? handleNextInSession : undefined}
              disabled={!conversationState.masteryLevel}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
              } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={conversationState.masteryLevel ? 'Continue to next problem in session' : 'Complete the current problem first'}
            >
              {sidebarCollapsed
                ? '⏭️'
                : !conversationState.masteryLevel
                ? '⏭️ Solve Current Problem'
                : practiceSession && practiceSession.currentIndex < practiceSession.problems.length - 1
                ? '⏭️ Next Problem'
                : '✓ Complete Session'}
            </button>
          )}

        </div>

        {/* Session Progress in Sidebar */}
        {!sidebarCollapsed && sessionProgress && (
          <div className="px-4 py-3 border-t border-secondary bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold mb-1">
              🎯 {sessionProgress}
            </p>
            {practiceSession && (
              <p className="text-xs text-blue-600 dark:text-blue-500 capitalize">
                {practiceSession.problems[practiceSession.currentIndex].topic.replace(/-/g, ' ')}
              </p>
            )}
          </div>
        )}

        {/* Length Warning in Sidebar */}
        {!sidebarCollapsed && showLengthWarning && (
          <div className="px-4 py-3 border-t border-secondary bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-500 font-semibold">
              ⚠️ Consider starting a new problem
            </p>
          </div>
        )}

        {/* Report, Dark Mode Toggle and Sign Out */}
        <div className="p-3 border-t border-secondary space-y-2">
          {/* Report Button */}
          {session && (
            <button
              onClick={() => setShowReport(true)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
              } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100`}
              title="View your data report"
            >
              {sidebarCollapsed ? '📊' : '📊 Report'}
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
            } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {sidebarCollapsed ? (darkMode ? '☀️' : '🌙') : (darkMode ? '☀️ Light Mode' : '🌙 Dark Mode')}
          </button>

          {/* Sign Out Button */}
          {session && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                sidebarCollapsed ? 'flex justify-center text-xl' : 'text-left'
              } bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Sign out of your account"
            >
              {signingOut ? (sidebarCollapsed ? '...' : 'Signing out...') : (sidebarCollapsed ? '🚪' : '🚪 Sign Out')}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title Section - Always visible */}
        <div className="card-secondary-bg border-b border-secondary px-6 py-3">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-heading">Socrates</h1>
          </div>
        </div>

        {/* Whiteboard Section - Only when problem exists */}
        {conversationState.problemStatement && (
          <div className="card-secondary-bg border-b border-secondary px-4 py-3">
            {/* Step circles at top of whiteboard */}
            {conversationState.solutionPath && (
              <div className="flex justify-center mb-3 animate-fade-in">
                <SolutionPathProgress
                  solutionPath={conversationState.solutionPath}
                  currentApproachIndex={conversationState.currentApproachIndex}
                  currentStepIndex={conversationState.currentStepIndex}
                  masteryLevel={conversationState.masteryLevel}
                  darkMode={darkMode}
                />
              </div>
            )}

            <WhiteboardCanvas
              problemText={conversationState.problemStatement}
              currentState={getCurrentState()}
              annotations={getCurrentAnnotations()}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto relative">
          <MessageList
            messages={conversationState.messages}
            problemStatement={conversationState.problemStatement}
            isLoading={uiState.isLoading}
            darkMode={darkMode}
            showWhiteboards={false}
          />
        </div>

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
                placeholder={
                  conversationState.problemStatement
                    ? 'Type your response...'
                    : 'Type or paste a math problem, or ask a question...'
                }
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

      {/* Mixed Practice Modal */}
      {mixedPracticeModal && (
        <MixedPracticeModal
          mode={mixedPracticeModal.mode}
          darkMode={darkMode}
          onClose={() => setMixedPracticeModal(null)}
          onStart={mixedPracticeModal.mode === 'preview' ? handleConfirmStartSession : handleStartMixedPractice}
          sessionData={mixedPracticeModal.mode === 'preview' ? mixedPracticeModal.data : undefined}
          completionStats={mixedPracticeModal.mode === 'celebration' ? mixedPracticeModal.data : undefined}
        />
      )}

      {/* User Report Modal */}
      {showReport && (
        <UserReport
          key={reportRefreshTrigger}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
