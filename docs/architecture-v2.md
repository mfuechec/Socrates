# Architecture Document (v2.0 - Current Implementation)

## Overview
project_name: "Socrates - AI Math Tutor"
version: "v2.0 (Production)"
date: "2025-11-04"
architect: "Winston (System Architect)"
status: "Updated to reflect current implementation"

description: |
  Socrates is a full-featured AI-powered math learning platform that combines Socratic tutoring
  with research-backed learning algorithms. The system accepts problems via text or image input,
  guides students through step-by-step solutions using adaptive scaffolding, and tracks long-term
  learning progress using spaced repetition and mastery-based progression.

  **Major Evolution from MVP:** The system has evolved from a simple stateless chat app into a
  comprehensive learning platform with user authentication, persistent learning data, spaced
  repetition scheduling, adaptive problem generation, and multi-approach solution scaffolding.

## System Architecture

architecture_style: "Full-Stack Serverless with Persistent Learning State"

high_level_design: |
  Four-tier architecture with learning intelligence:

  1. **Presentation Layer (Next.js Frontend)**
     - React components for chat UI, solution path visualization, whiteboard
     - Client-side state management (conversation + solution path + learning progress)
     - Authenticated user sessions via Supabase Auth

  2. **API Layer (Next.js API Routes - 8 endpoints)**
     - Serverless functions for chat, problem analysis, problem generation, progress tracking
     - Secure proxy to OpenAI API (API key server-side only)
     - Request/response transformation with JSON parsing and validation
     - Session-based authentication middleware

  3. **AI Layer (OpenAI GPT-4o)**
     - Chat completions for Socratic dialogue
     - Vision API for image-to-text extraction
     - JSON mode for structured responses (annotations, state tracking)
     - Multi-approach solution path generation with adaptive hints

  4. **Database Layer (Supabase PostgreSQL)**
     - problem_attempts: Every solved problem with mastery level
     - topic_progress: SM-2 spaced repetition schedules per topic
     - practice_sessions: Mixed practice session tracking
     - Row-Level Security for user data isolation
     - Authentication via Supabase Auth (Email + OAuth)

  **Data Flow Examples:**

  Problem Solving Flow:
  Browser → /api/analyze-problem (generates solution path) → GPT-4o
                                   ↓
  Browser ← Solution Path (approaches, steps, hints)
                                   ↓
  Browser → /api/chat (Socratic dialogue with path context) → GPT-4o
                                   ↓
  Browser ← Tutor response with annotations, step progression
                                   ↓
  Browser → /api/save-attempt (persist result) → Supabase DB
                                   ↓
  Backend: Update topic_progress with SM-2 algorithm

  Mixed Practice Flow:
  Browser → /api/generate-mixed → Supabase (get topic progress)
                                   ↓
  Backend: prioritizeTopicsForPractice() algorithm
                                   ↓
  Backend → GPT-4o (generate 5-10 problems for selected topics)
                                   ↓
  Browser ← Problem queue for session

## Technology Stack Changes

**CRITICAL UPDATES:**

### LLM Provider: OpenAI (Changed from Claude)
- **Model:** GPT-4o (gpt-4o)
- **Decision Date:** During MVP development
- **Rationale:**
  - GPT-4o JSON mode provides structured responses for annotations/state
  - Vision capabilities for image upload
  - Faster response times for better UX
  - Lower cost at scale vs Claude Sonnet 4.5
- **API:** OpenAI SDK v6.7.0
- **Environment Variable:** OPENAI_API_KEY

### Database: Supabase PostgreSQL (Added post-MVP)
- **Decision Date:** Post-MVP expansion
- **Rationale:**
  - Spaced repetition requires persistent learning state
  - User accounts enable personalized learning paths
  - Built-in auth eliminates separate auth service
  - Free tier sufficient for development + early users
- **Schema:** 3 tables with Row-Level Security
- **Hosting:** Supabase cloud (managed PostgreSQL)

### Authentication: Supabase Auth (Added post-MVP)
- **Providers:** Email + OAuth (Google)
- **Session Management:** JWT tokens, automatic refresh
- **Security:** Row-Level Security policies enforce user data isolation

frontend:
  framework: "Next.js 14+ (Pages Router)"
  state_management: "React useState + Context for complex state (SolutionPath, Learning Progress)"
  styling: "Tailwind CSS 3.x"
  key_libraries:
    - "react-katex (math rendering)"
    - "react-dropzone (image upload)"
    - "next/image (optimized images)"
    - "fabric.js (whiteboard canvas)"
    - "@supabase/auth-helpers-nextjs (authentication)"

backend:
  language: "TypeScript"
  framework: "Next.js API Routes (serverless)"
  api_style: "REST (8 POST endpoints)"
  key_libraries:
    - "openai v6.7.0 (OpenAI API client)"
    - "@supabase/supabase-js (database + auth)"
    - "multiparty (multipart form parsing for images)"

database:
  type: "Supabase PostgreSQL"
  primary_db: "PostgreSQL 15+ (Supabase managed)"
  orm: "Supabase Client (direct SQL via TypeScript)"
  tables:
    - "problem_attempts (learning history)"
    - "topic_progress (spaced repetition state)"
    - "practice_sessions (session tracking)"
  security: "Row-Level Security (RLS) policies on all tables"

infrastructure:
  hosting: "Vercel (frontend + API routes)"
  database_hosting: "Supabase Cloud"
  ci_cd: "Vercel auto-deploy from GitHub"
  monitoring: "Vercel Analytics + Supabase Dashboard"

environment_variables: |
  Configuration via .env.local (local) and Vercel Dashboard (production)

  **CRITICAL - UPDATED LIST:**

  Required (Server-Side - Secrets):
    OPENAI_API_KEY=sk-xxx
      - Get from: platform.openai.com → API Keys
      - Security: NEVER commit to Git, server-side only
      - Cost: Pay-as-you-go (monitor usage dashboard)

    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
      - Get from: Supabase Dashboard → Settings → API
      - Public (NEXT_PUBLIC_), but specific to your project

    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
      - Get from: Supabase Dashboard → Settings → API
      - Public anon key (safe for client-side, RLS protects data)

  Optional (Tunable Parameters):
    LLM_TEMPERATURE=0.4
      - Default: 0.4
      - Range: 0.0-1.0 (lower = more consistent)

    LLM_MAX_TOKENS=500
      - Default: 500
      - Purpose: Limit tutor response length

    LLM_MODEL=gpt-4o
      - Default: gpt-4o
      - Alternatives: gpt-4o-mini (faster, cheaper, less capable)

  Example .env.local:
    OPENAI_API_KEY=sk-xxx
    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
    LLM_TEMPERATURE=0.4
    LLM_MAX_TOKENS=500

## Components (Updated)

### **NEW: Solution Path System**

components:
  - name: "Solution Path Analyzer"
    purpose: "AI-powered problem decomposition into step-by-step approaches"
    technology: "OpenAI GPT-4o with JSON mode"
    endpoint: "/api/analyze-problem"
    responsibilities:
      - "Analyze problem type (linear equations, systems, quadratics, etc.)"
      - "Generate 1-3 valid solution approaches"
      - "Break each approach into 3-5 actionable steps"
      - "Create 3-level progressive hints for each step"
      - "Identify key concepts and common mistakes"
    data_structure:
      - "SolutionPath with problemStatement, problemType, approaches[]"
      - "Each Approach has name, description, difficulty, steps[]"
      - "Each Step has action, reasoning, hints (level1/2/3), keyConcepts, commonMistakes"
    example_output: |
      Problem: "Solve 2x + 5 = 13"
      Approach: "Standard Algebraic Method" (2 steps)
        Step 1: "Subtract 5 from both sides"
          Hint 1: "What operations are applied to x?"
          Hint 2: "We multiply by 2, then add 5. Which to undo first?"
          Hint 3: "Subtract 5 from both sides. What's 13 - 5?"
        Step 2: "Divide both sides by 2"
          Hint 1: "What's still attached to x?"
          Hint 2: "x is multiplied by 2. What undoes multiplication?"
          Hint 3: "Divide both sides by 2. What's 8 ÷ 2?"

  - name: "Solution Path Manager"
    purpose: "Track step progression, struggle detection, hint selection"
    technology: "TypeScript utility module"
    file: "src/lib/solution-path-manager.ts"
    responsibilities:
      - "getCurrentStep(): Get active step from solution path"
      - "getHintForStruggleLevel(): Map struggle count to hint level"
      - "detectStruggleKeywords(): Identify 'I don't know', 'stuck', etc."
      - "calculateEffectiveStruggleLevel(): Hybrid keyword + AI assessment"
    struggle_detection: |
      Tracks two struggle metrics:
      1. Keyword-based: Count of struggle phrases in student messages
      2. AI-based: GPT-4o assesses if student is struggling
      Effective level = max(keyword_count, ai_assessment ? 2 : 0)

  - name: "Solution Path Progress (UI)"
    purpose: "Visual step indicator showing current progress"
    technology: "React component with Tailwind CSS"
    file: "src/components/SolutionPathProgress.tsx"
    display:
      - "Horizontal step indicators (1 → 2 → 3 → 4)"
      - "Current step highlighted, completed steps checkmarked"
      - "Step name and key concepts on hover"
      - "Approach selector if multiple approaches available"

### **NEW: Learning Algorithm System**

  - name: "Mastery Calculator"
    purpose: "Determine mastery level based on problem-solving efficiency"
    technology: "TypeScript algorithm"
    file: "src/lib/learning-algorithm.ts"
    algorithm: |
      function calculateMasteryLevel(turnsTaken: number): MasteryLevel {
        if (turnsTaken <= 5) return 'mastered';
        else if (turnsTaken <= 10) return 'competent';
        else return 'struggling';
      }
    implications:
      - "mastered: Unlock 'Harder Problem' button"
      - "competent: Unlock both 'Similar' and 'Harder'"
      - "struggling: Only 'Similar Problem' recommended"

  - name: "Topic Inference Engine"
    purpose: "Classify problems into 15 math topics for tracking"
    technology: "Keyword-based classification"
    file: "src/lib/learning-algorithm.ts (inferTopic())"
    topics_supported:
      - linear-equations
      - quadratic-equations
      - systems-of-equations
      - polynomials
      - exponents
      - radicals
      - rational-expressions
      - inequalities
      - absolute-value
      - functions
      - graphing
      - word-problems
      - geometry
      - trigonometry
      - calculus
    classification_method: |
      Uses regex and keyword matching:
      - "x²" or "quadratic" → quadratic-equations
      - "solve for x and y" or "system" → systems-of-equations
      - "sin", "cos", "tan" → trigonometry
      Fallback: "general" if no match

  - name: "Spaced Repetition Engine (SM-2)"
    purpose: "Calculate optimal review schedules to prevent forgetting"
    technology: "SM-2 algorithm (SuperMemo 2)"
    file: "src/lib/spaced-repetition.ts"
    algorithm_details: |
      SM-2 Parameters:
      - easeFactor: Starting at 2.5, adjusted per performance
      - interval: Days until next review (1 → 6 → 15 → 37 → 92...)
      - quality: 0-5 rating (mastered=5, competent=3, struggling=1)

      Review Schedule:
      - First review: 1 day after initial attempt
      - Second review: 6 days after first
      - Subsequent: interval * easeFactor (exponential growth)
      - Failed review (quality < 3): Reset interval to 1 day

      Strength Score:
      - 0.0-1.0 representing retention probability
      - Updated as: newStrength = oldStrength * 0.7 + masteryScore * 0.3
      - Weak topics (<0.6 strength) prioritized in mixed practice
    functions:
      - "calculateNextReview(): Core SM-2 calculation"
      - "updateTopicProgressAfterAttempt(): Update DB after problem"
      - "getTopicsDueForReview(): Query overdue topics"
      - "prioritizeTopicsForPractice(): Select 5-10 topics for mixed session"

  - name: "Mixed Practice Prioritization"
    purpose: "Interleave topics to prevent blocking and enhance retention"
    technology: "Custom prioritization algorithm"
    file: "src/lib/spaced-repetition.ts (prioritizeTopicsForPractice())"
    algorithm: |
      1. Select up to 50% due for review (overdue topics first)
      2. Fill remaining with weak topics (strength < 0.6), weakest first
      3. Add random topics for variety if still need more
      4. Shuffle to create interleaved order
    research_basis: "Interleaving improves discrimination and retention vs blocked practice"

### **NEW: Problem Generation System**

  - name: "Similar Problem Generator"
    purpose: "Generate practice problems at same difficulty level"
    endpoint: "/api/generate-similar"
    technology: "OpenAI GPT-4o (temperature: 0.8 for variety)"
    requirements:
      - "Same mathematical concepts and structure"
      - "Different numbers/values"
      - "Different context for word problems"
    example: |
      Original: "Solve for x: 2x + 5 = 13"
      Similar: "Solve for y: 3y - 7 = 11"

  - name: "Harder Problem Generator"
    purpose: "Generate next-level problems for mastery progression"
    endpoint: "/api/generate-harder"
    technology: "OpenAI GPT-4o (temperature: 0.7)"
    difficulty_progression: |
      Option A - Increase complexity within concept:
        - Larger/more complex numbers
        - Additional steps
        - Fractions, decimals, negatives

      Option B - Introduce new related concept (preferred):
        - Add second variable (x → x and y)
        - Linear → quadratic
        - Single equation → system of equations
        - Arithmetic → algebraic thinking
    example: |
      Easy: "Solve 2x + 5 = 13"
      Harder (Option A): "Solve 3x + 7 = 2x + 15"
      Harder (Option B): "Solve for x and y: 2x + y = 10 and x - y = 2"

  - name: "Mixed Practice Session Generator"
    purpose: "Create interleaved problem sets of 5-10 problems"
    endpoint: "/api/generate-mixed"
    technology: "Prioritization algorithm + GPT-4o generation"
    workflow: |
      1. Query user's topic_progress from database
      2. If new user: Use foundational topics (linear-equations, polynomials, exponents, inequalities, functions)
      3. If existing user: Run prioritizeTopicsForPractice() for 5-8 topics
      4. Generate one problem per topic via GPT-4o
      5. Create practice_session record in database
      6. Return problem queue to frontend
    nice_numbers_constraint: |
      Problems designed to have clean integer or simple fraction solutions
      - Avoids complex fractions like 41/87
      - Uses small coefficients (1-10 range)
      - Focus on METHOD, not arithmetic struggle

### **UPDATED: Chat Interface & Dialogue**

  - name: "Chat Interface"
    purpose: "Main interaction surface with Socratic dialogue"
    technology: "Next.js (React), TypeScript, Tailwind CSS"
    file: "src/components/ChatInterface.tsx"
    responsibilities:
      - "Display conversation history with LaTeX rendering"
      - "Manage SolutionPath state and step progression"
      - "Track struggle level (keyword + AI hybrid)"
      - "Show practice buttons based on mastery (Similar/Harder)"
      - "Persist completed attempts to database via /api/save-attempt"
      - "Whiteboard integration for visual work"
    state_managed:
      - ConversationState: problem, messages[], solutionPath, stepIndex, struggleLevel
      - UIState: isLoading, error, imagePreviewUrl, isComplete, masteryLevel
      - LearningState: userId, sessionId, canShowHarder (based on mastery)

  - name: "Chat API (Socratic Tutor)"
    purpose: "Socratic dialogue with adaptive scaffolding"
    endpoint: "/api/chat"
    technology: "OpenAI GPT-4o with JSON response format"
    file: "pages/api/chat.ts"
    system_prompt_features: |
      1. Core Socratic Rules:
         - NEVER give direct answers
         - Ask ONE guiding question at a time
         - Validate student reasoning before advancing
         - Provide hints after 2+ struggles

      2. Solution Path Integration:
         - Current step action and reasoning injected into prompt
         - Appropriate hint level based on struggle count
         - Next step preview for context
         - Key concepts and common mistakes from path

      3. Structured Response Format (JSON):
         {
           "message": "Tutor's question/response",
           "annotations": [{ "start": 0, "end": 5, "latex": "2x" }],
           "currentState": "understanding | planning | executing | verifying",
           "isComplete": false,
           "masteryLevel": "mastered | competent | struggling",
           "stepProgression": {
             "currentStepCompleted": true,
             "studentStrugglingOnCurrentStep": false,
             "alternativeApproachDetected": false
           }
         }
    response_processing:
      - "parseWithFallback(): Handle JSON or plain text responses"
      - "sanitizeResponse(): Remove invalid annotations"
      - "hasValidAnnotations(): Check for LaTeX markup"
    error_handling:
      - "429 Rate Limit: 'Wait 30 seconds and try again'"
      - "500 Server Error: 'OpenAI API error. Please try again.'"
      - "Retry logic with exponential backoff (3 attempts)"

### **NEW: Whiteboard System**

  - name: "Whiteboard Canvas"
    purpose: "Interactive canvas for visual problem-solving"
    technology: "Fabric.js 6.7.1"
    file: "src/components/whiteboard/WhiteboardCanvas.tsx"
    features:
      - "Freehand drawing (pen tool)"
      - "Shapes (lines, circles, rectangles)"
      - "Text annotations"
      - "Undo/redo stack"
      - "Clear canvas"
      - "Export as PNG image"
    integration:
      - "Embedded in ChatInterface"
      - "Toggle visibility"
      - "Can attach drawings to messages (future feature)"
    bundle_impact: "Fabric.js adds ~300KB to bundle (lazy-loaded)"

### **NEW: Authentication System**

  - name: "Auth Button Component"
    purpose: "Sign in/sign up/sign out UI"
    technology: "React + Supabase Auth"
    file: "src/components/AuthButton.tsx"
    features:
      - "Email + password sign in/up"
      - "Google OAuth button"
      - "Session display (user email)"
      - "Sign out button"

  - name: "Auth Callback Handler"
    purpose: "Handle OAuth redirects"
    file: "pages/auth/callback.tsx"
    workflow: |
      1. User clicks "Sign in with Google"
      2. Redirects to Google OAuth
      3. Google redirects back to /auth/callback?code=xxx
      4. Exchange code for session
      5. Redirect to home page

  - name: "Auth Helpers"
    purpose: "Utility functions for authentication"
    file: "src/lib/auth.ts"
    functions:
      - "signInWithEmail(email, password)"
      - "signUpWithEmail(email, password)"
      - "signInWithGoogle()"
      - "signOut()"
      - "getCurrentUser()"
      - "getSession()"

### **UPDATED: Image Upload & Vision**

  - name: "Vision API Proxy"
    purpose: "Extract math problem text from images"
    endpoint: "/api/vision"
    technology: "OpenAI GPT-4o Vision"
    file: "pages/api/vision.ts"
    workflow: |
      1. User uploads image (drag-drop or file picker)
      2. Frontend sends multipart/form-data to /api/vision
      3. Backend converts to base64
      4. Sends to OpenAI Vision API with prompt: "Extract math problem text"
      5. Returns extracted text for user correction
      6. User edits if needed, then submits as problem
    validation:
      - "Client: Max 5MB, PNG/JPG, min 200x200px, max 4000x4000px"
      - "Server: Redundant checks, enforce limits"
    error_handling:
      - "Bad OCR: User can edit extracted text before submitting"

## API Design (Complete List - 8 Endpoints)

**All endpoints use POST method, require CORS origin check, include input validation**

endpoints:
  - method: "POST"
    path: "/api/chat"
    description: "Socratic dialogue with adaptive hints and step tracking"
    request:
      headers: ["Content-Type: application/json"]
      body: |
        {
          "problem": "2x + 5 = 13",
          "messages": [
            { "role": "student", "content": "I don't know where to start", "timestamp": "2025-11-04T..." }
          ],
          "pathContext": {
            "solutionPath": { /* SolutionPath object */ },
            "approachIndex": 0,
            "stepIndex": 0,
            "struggleLevel": 1
          }
        }
    response:
      success: |
        {
          "response": "Look at 2x + 5 = 13. What operations are being applied to x?",
          "annotations": [{ "start": 8, "end": 14, "latex": "2x + 5" }],
          "currentState": "understanding",
          "isComplete": false,
          "stepProgression": {
            "currentStepCompleted": false,
            "studentStrugglingOnCurrentStep": true
          }
        }
      errors:
        - code: "500"
          message: "{ \"error\": \"OpenAI API error. Please try again.\" }"
        - code: "429"
          message: "{ \"error\": \"Rate limit exceeded. Wait 30 seconds.\" }"

  - method: "POST"
    path: "/api/analyze-problem"
    description: "Generate solution path with multiple approaches and hints"
    request:
      body: |
        {
          "problem": "Solve the system: 2x + 3y = 8 and 4x - y = 5"
        }
    response:
      success: |
        {
          "solutionPath": {
            "problemStatement": "...",
            "problemType": "System of Linear Equations",
            "approaches": [
              {
                "name": "Elimination Method",
                "description": "Eliminate one variable by combining equations",
                "difficulty": "medium",
                "steps": [
                  {
                    "stepNumber": 1,
                    "action": "Multiply first equation by 2...",
                    "reasoning": "We need 4x in both equations...",
                    "hints": {
                      "level1": "Look at the x coefficients...",
                      "level2": "Notice that 4x is double 2x...",
                      "level3": "Multiply the first equation by 2..."
                    },
                    "keyConcepts": ["Multiplication Property of Equality"],
                    "commonMistakes": ["Multiplying only left side"]
                  }
                ]
              },
              {
                "name": "Substitution Method",
                "steps": [...]
              }
            ],
            "recommendedApproachIndex": 0
          }
        }

  - method: "POST"
    path: "/api/vision"
    description: "OCR math problem from uploaded image"
    request:
      headers: ["Content-Type: multipart/form-data"]
      body: "FormData with 'image' field (PNG/JPG)"
    response:
      success: |
        {
          "extractedText": "Solve for x: 3(x - 4) = 2x + 5"
        }

  - method: "POST"
    path: "/api/generate-similar"
    description: "Generate similar problem at same difficulty"
    request:
      body: |
        {
          "originalProblem": "Solve for x: 2x + 5 = 13"
        }
    response:
      success: |
        {
          "problem": "Solve for y: 3y - 7 = 11"
        }

  - method: "POST"
    path: "/api/generate-harder"
    description: "Generate harder problem that builds on original"
    request:
      body: |
        {
          "originalProblem": "Solve for x: 2x + 5 = 13"
        }
    response:
      success: |
        {
          "problem": "Solve for x and y: 2x + y = 10 and x - y = 2"
        }

  - method: "POST"
    path: "/api/generate-mixed"
    description: "Create interleaved practice session (5-10 problems)"
    authentication: "Required (Supabase session)"
    workflow: |
      1. Get user's topic_progress from database
      2. Prioritize topics (due reviews + weak topics + variety)
      3. Generate one problem per topic via GPT-4o
      4. Create practice_session record
      5. Return problem queue
    request:
      headers: ["Cookie: sb-access-token=xxx"]
      body: "{}"
    response:
      success: |
        {
          "success": true,
          "sessionId": "uuid",
          "problems": [
            { "topic": "linear-equations", "problemText": "Solve 3x - 7 = 14" },
            { "topic": "quadratic-equations", "problemText": "Solve x² - 5x + 6 = 0" },
            ...
          ],
          "totalCount": 7
        }

  - method: "POST"
    path: "/api/save-attempt"
    description: "Persist problem attempt and update spaced repetition schedule"
    authentication: "Required (Supabase session)"
    workflow: |
      1. Receive problemText and turnsTaken
      2. Calculate masteryLevel (mastered/competent/struggling)
      3. Infer topic from problem text
      4. Insert into problem_attempts table
      5. Upsert topic_progress with new SM-2 schedule
    request:
      body: |
        {
          "problemText": "Solve for x: 2x + 5 = 13",
          "turnsTaken": 4
        }
    response:
      success: |
        {
          "success": true,
          "attempt": {
            "id": "uuid",
            "mastery_level": "mastered",
            "topic": "linear-equations",
            "turns_taken": 4
          },
          "progress": {
            "topic": "linear-equations",
            "strength": 0.76,
            "review_count": 1,
            "next_review": "2025-11-10T12:00:00Z"
          }
        }

  - method: "POST"
    path: "/api/analyze-problem-stream"
    description: "Streaming version of /api/analyze-problem for faster perceived performance"
    note: "Returns Server-Sent Events stream, not used in current UI but available"

## Database Schema

### problem_attempts
purpose: "Track every solved problem with mastery assessment"

columns:
  - name: "id"
    type: "UUID"
    description: "Primary key"
  - name: "user_id"
    type: "UUID"
    description: "Foreign key to auth.users, CASCADE delete"
  - name: "problem_text"
    type: "TEXT"
    description: "Full problem statement"
  - name: "topic"
    type: "TEXT"
    description: "Inferred topic (linear-equations, quadratic-equations, etc.)"
  - name: "mastery_level"
    type: "TEXT"
    description: "'mastered' | 'competent' | 'struggling'"
    constraint: "CHECK (mastery_level IN ('mastered', 'competent', 'struggling'))"
  - name: "turns_taken"
    type: "INTEGER"
    description: "Number of dialogue turns to solve"
  - name: "created_at"
    type: "TIMESTAMPTZ"
    description: "Timestamp of completion"

indexes:
  - "idx_problem_attempts_user_id ON user_id"
  - "idx_problem_attempts_topic ON topic"
  - "idx_problem_attempts_created_at ON created_at"

rls_policies:
  - "Users can view own attempts: auth.uid() = user_id"
  - "Users can insert own attempts: auth.uid() = user_id"

### topic_progress
purpose: "Spaced repetition state per user per topic"

columns:
  - name: "id"
    type: "UUID"
    description: "Primary key"
  - name: "user_id"
    type: "UUID"
    description: "Foreign key to auth.users"
  - name: "topic"
    type: "TEXT"
    description: "Math topic identifier"
    constraint: "UNIQUE(user_id, topic)"
  - name: "strength"
    type: "FLOAT"
    description: "Retention score 0.0-1.0"
    constraint: "CHECK (strength >= 0 AND strength <= 1)"
  - name: "review_count"
    type: "INTEGER"
    description: "Number of successful reviews (SM-2)"
  - name: "last_reviewed"
    type: "TIMESTAMPTZ"
    description: "Last practice timestamp"
  - name: "next_review"
    type: "TIMESTAMPTZ"
    description: "Next scheduled review (SM-2 calculated)"
  - name: "created_at"
    type: "TIMESTAMPTZ"
    description: "First practice timestamp"

indexes:
  - "idx_topic_progress_user_id ON user_id"
  - "idx_topic_progress_next_review ON next_review"

rls_policies:
  - "Users can view own progress: auth.uid() = user_id"
  - "Users can insert own progress: auth.uid() = user_id"
  - "Users can update own progress: auth.uid() = user_id"

### practice_sessions
purpose: "Track mixed practice sessions for analytics"

columns:
  - name: "id"
    type: "UUID"
    description: "Primary key"
  - name: "user_id"
    type: "UUID"
    description: "Foreign key to auth.users"
  - name: "session_type"
    type: "TEXT"
    description: "'mixed' | 'targeted' | 'review'"
  - name: "problems_count"
    type: "INTEGER"
    description: "Total problems in session"
  - name: "completed_count"
    type: "INTEGER"
    description: "Problems completed so far"
  - name: "status"
    type: "TEXT"
    description: "'in_progress' | 'completed' | 'abandoned'"
  - name: "created_at"
    type: "TIMESTAMPTZ"
    description: "Session start time"
  - name: "updated_at"
    type: "TIMESTAMPTZ"
    description: "Last activity timestamp"

indexes:
  - "idx_practice_sessions_user_id ON user_id"

rls_policies:
  - "Users can view own sessions: auth.uid() = user_id"
  - "Users can insert own sessions: auth.uid() = user_id"
  - "Users can update own sessions: auth.uid() = user_id"

## Security Architecture

authentication: "Supabase Auth (Email + OAuth)"
authorization: "Row-Level Security (RLS) on all database tables"

authentication_details:
  - "Email + password authentication (built-in)"
  - "Google OAuth (configured in Supabase dashboard)"
  - "JWT session tokens (automatic refresh)"
  - "Session stored in httpOnly cookies"
  - "Session expiry: 7 days (configurable)"

data_encryption:
  at_rest: "Supabase PostgreSQL encryption (AES-256)"
  in_transit: "TLS 1.3 (Vercel + Supabase enforce HTTPS)"

security_considerations:
  - "API Key Protection: OPENAI_API_KEY in Vercel env vars, never exposed to browser"
  - "Rate Limiting: OpenAI tier-based limits (monitor via dashboard)"
  - "CORS Protection: API routes check origin header (localhost + Vercel domain)"
  - "Input Validation:
      - Problem statement max 500 chars
      - Message max 1000 chars
      - Image max 5MB
      - Server-side validation redundant with client-side"
  - "Row-Level Security:
      - All tables enforce auth.uid() = user_id
      - Users cannot access other users' data
      - Supabase enforces policies at database level"
  - "No PII Leakage: Problem text may contain student info, stored with RLS protection"
  - "DoS Protection: Vercel serverless functions auto-scale, rate limit per IP"
  - "Error Handling: Never expose API keys or internal errors to client"

session_management:
  - "Supabase automatically refreshes JWT tokens"
  - "Client-side: @supabase/auth-helpers-nextjs handles refresh"
  - "Server-side: createServerSupabaseClient validates session"
  - "Logout clears session cookie and invalidates token"

## Performance & Scalability

performance_targets:
  tutor_response_time: "< 3s (depends on OpenAI latency + JSON parsing)"
  solution_path_generation: "< 5s (GPT-4o generates multi-approach paths)"
  problem_generation: "< 2s per problem (mixed practice generates 5-10 in parallel)"
  throughput: "Serverless auto-scales (no hard limit)"
  concurrent_users: "500+ (Vercel + Supabase free tiers)"

scalability_strategy: |
  Serverless + Managed Database:
  - Vercel Edge Functions: Auto-scale horizontally, global distribution
  - Supabase PostgreSQL: Scales to 500MB DB (free tier), paid tiers to 8GB+
  - OpenAI API: Rate limits tier-dependent (pay for higher limits)
  - Connection pooling: Supabase Realtime handles pooling automatically

  Current architecture supports 500+ concurrent users without modification.
  For 5000+ users, consider:
  - Supabase Pro plan ($25/month, higher limits)
  - OpenAI tier upgrade (higher rate limits)
  - Response caching for common Socratic questions
  - CDN caching for solution path templates

database_performance:
  - "Indexes on user_id, topic, created_at, next_review"
  - "Queries typically <50ms (single-user lookups)"
  - "Mixed practice query: 100-200ms (fetches all topic_progress)"
  - "No N+1 queries (use .select() to fetch related data)"

optimization_notes: |
  - KaTeX rendering: Client-side (fast, no server load)
  - Fabric.js whiteboard: Lazy-loaded (300KB) only when used
  - Next.js Image: Automatic optimization + lazy loading
  - API routes: Edge functions deployed globally (low latency)
  - JSON mode: Structured responses parsed once (no regex guessing)
  - Parallel problem generation: Promise.all for mixed practice (5-10 problems in parallel)

## Deployment Architecture

environments:
  - name: "development"
    url: "http://localhost:3000"
    config: |
      .env.local with dev keys:
      - OPENAI_API_KEY (low spending limit)
      - NEXT_PUBLIC_SUPABASE_URL (dev project)
      - NEXT_PUBLIC_SUPABASE_ANON_KEY

  - name: "production"
    url: "TBD (Vercel auto-generated or custom domain)"
    config: |
      Vercel Dashboard → Environment Variables:
      - OPENAI_API_KEY (production key with higher limit)
      - NEXT_PUBLIC_SUPABASE_URL (production project)
      - NEXT_PUBLIC_SUPABASE_ANON_KEY
      - LLM_TEMPERATURE, LLM_MAX_TOKENS (optional overrides)

deployment_strategy: "Continuous Deployment via Vercel GitHub Integration"

deployment_process: |
  1. Push to main branch → Vercel auto-deploys frontend + API routes
  2. Preview deployments for PRs (test before merge)
  3. Environment variables: Set in Vercel dashboard
  4. Database migrations: Run in Supabase SQL Editor before deploying code
  5. Zero-downtime: Vercel atomic deployments
  6. Rollback: Revert Git commit or use Vercel dashboard

database_deployment:
  - "Supabase project created via dashboard"
  - "Run SQL migrations manually in SQL Editor"
  - "No automatic migrations (intentional for bootcamp simplicity)"
  - "Migration files: supabase-migration-practice-sessions.sql, SUPABASE_SETUP.md"

initial_setup:
  - "1. Create Supabase project → Get URL + anon key"
  - "2. Run SQL migrations (see SUPABASE_SETUP.md)"
  - "3. Connect GitHub repo to Vercel"
  - "4. Configure build: next build"
  - "5. Set environment variables (OpenAI + Supabase)"
  - "6. Deploy: ~3-5 minutes"

## Monitoring & Observability

logging:
  tool: "Vercel Logs + Supabase Logs"
  levels: "INFO, ERROR"
  strategy: |
    - API routes log:
      - Problem analysis requests with timing
      - OpenAI errors with sanitized details
      - Database errors (without sensitive data)
      - Mastery level calculations
      - Spaced repetition schedule updates
    - Frontend: console.error for critical errors (dev only)
    - No user tracking/analytics for MVP (privacy-first)

metrics:
  - metric: "OpenAI API Usage"
    threshold: "Monitor spend via platform.openai.com dashboard"
    alert: "Set billing alerts in OpenAI dashboard"

  - metric: "Supabase Database Size"
    threshold: "500MB (free tier limit)"
    alert: "Dashboard shows usage percentage"

  - metric: "API Route Errors"
    threshold: "> 5% error rate"
    alert: "Check Vercel logs, investigate OpenAI failures"

  - metric: "Database Query Performance"
    threshold: "> 500ms per query"
    alert: "Check Supabase Performance tab, review indexes"

tracing: |
  Vercel logs show:
  - Request timing (API route latency)
  - Cold start timing (serverless function initialization)
  - Database query timing (implicit in request duration)

  For detailed tracing, consider:
  - OpenAI response time logging (already present)
  - Database query logging with timestamps
  - Step progression tracking (already logged)

monitoring_checklist:
  - "Daily: Check OpenAI dashboard for API spend"
  - "Daily: Review Vercel logs for errors"
  - "Weekly: Check Supabase database size (approaching limit?)"
  - "Weekly: Test full flow (problem solve + save + mixed practice)"
  - "Monthly: Review RLS policies (ensure no data leakage)"

## Development Practices

code_organization: |
  Actual File Structure:

  /src
    /components
      ChatInterface.tsx           # Main chat, owns ConversationState + SolutionPath
      MessageList.tsx             # Display messages with LaTeX
      ProblemInput.tsx            # Text input
      ImageUpload.tsx             # Drag-drop image upload
      MathRenderer.tsx            # KaTeX wrapper
      SolutionPathProgress.tsx    # Step indicator UI
      AuthButton.tsx              # Sign in/out UI
      /whiteboard
        WhiteboardCanvas.tsx      # Fabric.js canvas

    /lib
      conversation-manager.ts     # sendMessage(), reset()
      api-client.ts               # HTTP client with retry
      solution-path-manager.ts    # Step tracking, struggle detection
      learning-algorithm.ts       # Mastery calculation, topic inference
      spaced-repetition.ts        # SM-2 algorithm, review scheduling
      annotation-validator.ts     # JSON parsing, sanitization
      auth.ts                     # Auth helper functions
      supabase.ts                 # Supabase client setup
      error-messages.ts           # User-friendly error messages

    /prompts
      socratic-tutor.ts           # System prompt builder with path context

    /types
      conversation.ts             # ConversationState, Message
      solution-path.ts            # SolutionPath, Step, Hints
      learning.ts                 # MasteryLevel, TopicProgress, MathTopic
      api.ts                      # API request/response types
      ui.ts                       # UIState
      whiteboard.ts               # Whiteboard types

  /pages
    /api
      chat.ts                     # Socratic dialogue
      analyze-problem.ts          # Generate solution paths
      analyze-problem-stream.ts   # Streaming version (not used)
      vision.ts                   # Image OCR
      generate-similar.ts         # Similar problem generation
      generate-harder.ts          # Harder problem generation
      generate-mixed.ts           # Mixed practice session
      save-attempt.ts             # Persist to database

    /auth
      callback.tsx                # OAuth callback handler

    index.tsx                     # Main page (ChatInterface)
    _app.tsx                      # Global providers, styles

  /docs
    architecture.md               # Original architecture (OUTDATED)
    architecture-v2.md            # This file (CURRENT)
    PRD.md                        # Product requirements
    LEARNING_STRATEGIES.md        # Learning algorithm documentation
    SUPABASE_SETUP.md             # Database setup guide

  Root:
    .env.local                    # Environment variables (gitignored)
    package.json                  # Dependencies
    tsconfig.json                 # TypeScript strict mode
    tailwind.config.js            # Tailwind CSS config
    supabase-migration-practice-sessions.sql  # Database migration

  Naming Conventions:
  - Components: PascalCase (ChatInterface.tsx)
  - Libraries: kebab-case (spaced-repetition.ts)
  - API routes: kebab-case (generate-mixed.ts)
  - Types: kebab-case (solution-path.ts)

coding_standards:
  - "TypeScript strict mode enabled"
  - "ESLint + Prettier for formatting"
  - "Functional React components (no classes)"
  - "Explicit error handling (no silent failures)"
  - "Comments for non-obvious logic (especially learning algorithms)"
  - "File naming: kebab-case for files, PascalCase for components"

testing_strategy:
  unit_tests: "None (MVP manual testing priority)"
  integration_tests: "None (MVP)"
  e2e_tests: "Manual testing with 5+ problem types"
  coverage_target: "N/A"

  manual_testing: |
    Primary testing approach:
    1. Problem Solving Flow:
       - Text input → Socratic dialogue → completion → save
       - Image upload → OCR → correction → dialogue
       - Multi-step problems with hint progression

    2. Learning Features:
       - Similar/Harder button appears based on mastery
       - Mixed practice generates interleaved problems
       - Topic progress updates in database

    3. Authentication:
       - Email sign up/sign in
       - Google OAuth
       - Session persistence across page reloads
       - RLS enforcement (can't access other users' data)

    4. Edge Cases:
       - Bad image upload (corrupted, wrong format)
       - Very long problems (truncation)
       - Rapid-fire messages (concurrent requests)
       - OpenAI rate limit errors

## Dependencies & Integrations

external_services:
  - name: "OpenAI API"
    purpose: "Socratic dialogue + problem analysis + problem generation"
    integration: "REST API via openai npm package v6.7.0"
    models_used:
      - "gpt-4o: Chat, analysis, generation"
      - "gpt-4o-vision: Image OCR"
    api_version: "v1 (latest)"
    rate_limits: "Tier-dependent (see platform.openai.com/account/limits)"
    cost: |
      GPT-4o pricing:
      - $2.50 per 1M input tokens
      - $10.00 per 1M output tokens
      Estimated cost per problem: ~$0.02-0.05
    fallback: "Display user-friendly error, suggest retry"

  - name: "Supabase"
    purpose: "PostgreSQL database + authentication + hosting"
    integration: "@supabase/supabase-js v2.79.0 + auth-helpers"
    features_used:
      - "PostgreSQL database (3 tables)"
      - "Supabase Auth (Email + OAuth)"
      - "Row-Level Security"
      - "Realtime (not currently used, available for future)"
    cost: "Free tier (500MB DB, 50k monthly active users)"
    limits:
      - "Database size: 500MB (free) → 8GB (Pro $25/mo)"
      - "API requests: Unlimited"
      - "Auth users: 50,000 MAU (free) → 100,000 (Pro)"

  - name: "Vercel"
    purpose: "Frontend + API routes hosting, CI/CD"
    integration: "GitHub auto-deploy"
    cost: "Free tier (Hobby plan)"
    limits:
      - "Bandwidth: 100GB/month"
      - "Serverless function executions: 100GB-hrs/month"
      - "Build time: 6000 minutes/month"

npm_dependencies:
  critical:
    - "openai: ^6.7.0 (OpenAI API client)"
    - "@supabase/supabase-js: ^2.79.0 (database + auth)"
    - "@supabase/auth-helpers-nextjs: ^0.10.0 (Next.js auth integration)"
    - "react: ^19.2.0"
    - "next: ^16.0.1"
    - "katex: ^0.16.25 + react-katex: ^3.1.0 (math rendering)"

  supporting:
    - "fabric: ^6.7.1 (whiteboard canvas)"
    - "react-dropzone: ^14.3.8 (image upload)"
    - "tailwindcss: ^3.4.18 (styling)"
    - "typescript: ^5.9.3"

  note: |
    Both openai and @anthropic-ai/sdk are installed (package.json).
    Only openai is used in current implementation.
    Recommend removing @anthropic-ai/sdk to reduce bundle size.

## Risks & Technical Debt

risks:
  - risk: "OpenAI API downtime or rate limits"
    likelihood: "MEDIUM"
    impact: "HIGH (app unusable)"
    mitigation: |
      - Exponential backoff retry (3 attempts)
      - User-friendly error messages
      - Monitor OpenAI status page (status.openai.com)
      - Set billing alerts to prevent surprise overages

  - risk: "Database connection exhaustion (Supabase)"
    likelihood: "LOW (free tier sufficient for now)"
    impact: "MEDIUM (can't save progress)"
    mitigation: |
      - Supabase handles connection pooling automatically
      - Monitor database size in Supabase dashboard
      - Upgrade to Pro plan if approaching limits

  - risk: "RLS policy misconfiguration (data leakage)"
    likelihood: "LOW (policies are simple)"
    impact: "CRITICAL (user privacy violation)"
    mitigation: |
      - Manual testing: Create two accounts, verify data isolation
      - Supabase provides RLS preview tool
      - Code review all database queries

  - risk: "JSON parsing failures (OpenAI response)"
    likelihood: "MEDIUM (occasional malformed JSON)"
    impact: "MEDIUM (tutor response fails, user must retry)"
    mitigation: |
      - parseWithFallback(): Graceful fallback to plain text
      - sanitizeResponse(): Remove invalid annotations
      - Log all parsing errors for debugging

  - risk: "Spaced repetition drift (incorrect calculations)"
    likelihood: "LOW (SM-2 is well-tested)"
    impact: "MEDIUM (suboptimal learning)"
    mitigation: |
      - Unit tests for calculateNextReview() (not yet implemented)
      - Manual verification with sample data
      - Logging all schedule updates for audit

  - risk: "Bundle size bloat (Fabric.js)"
    likelihood: "MEDIUM"
    impact: "LOW (slower initial load)"
    mitigation: |
      - Lazy-load Fabric.js only when whiteboard opened
      - Consider lighter alternatives (Excalidraw, Tldraw)
      - Monitor bundle size with next bundle-analyzer

known_technical_debt:
  - item: "No automated testing"
    priority: "HIGH"
    plan: |
      Implement:
      1. Unit tests for learning algorithms (Jest)
      2. Integration tests for API routes (supertest)
      3. E2E tests for critical paths (Playwright)
    effort: "8-12 hours"

  - item: "Dual API dependency (OpenAI + Anthropic SDK)"
    priority: "MEDIUM"
    plan: "Remove @anthropic-ai/sdk from package.json"
    effort: "5 minutes"

  - item: "No database migrations system"
    priority: "MEDIUM"
    plan: |
      Manual SQL migrations work for bootcamp, but production needs:
      - Migration versioning (e.g., Prisma Migrate, Supabase CLI)
      - Rollback capability
      - Automated testing migrations
    effort: "4-6 hours"

  - item: "Hardcoded mastery thresholds"
    priority: "LOW"
    plan: |
      Make configurable:
      - turnsTaken <= 5 → mastered
      - turnsTaken <= 10 → competent
      - Should be env vars or database config
    effort: "1-2 hours"

  - item: "No response caching"
    priority: "LOW"
    plan: |
      Cache common Socratic questions:
      - "What operations are applied to x?" (frequently reused)
      - Store in Redis or Vercel KV
      - Reduce OpenAI API costs by ~20-30%
    effort: "4-6 hours"

  - item: "Limited error recovery"
    priority: "MEDIUM"
    plan: |
      Improve:
      - Auto-retry failed database saves
      - Resume interrupted practice sessions
      - Recover from partial solution path generation
    effort: "3-4 hours"

## Decision Log (Updated)

decisions:
  - date: "2025-11-03"
    decision: "Use Next.js API Routes (confirmed from original)"
    status: "✅ Implemented"
    outcome: "Working well, API keys secure, Vercel deployment smooth"

  - date: "2025-11-03"
    decision: "Switch from Claude Sonnet 4.5 to OpenAI GPT-4o"
    status: "✅ Implemented"
    rationale: |
      Original plan: Claude for best "never give answers" instruction-following
      Switch rationale:
      - GPT-4o JSON mode enables structured responses (annotations, state tracking)
      - Vision API for image upload (Claude Vision also available, but OpenAI SDK simpler)
      - Faster response times (~2s vs ~3s)
      - Lower cost at scale ($2.50/$10 vs $3/$15 per 1M tokens)
    alternatives: "Claude Sonnet 4.5, GPT-4-turbo"
    notes: "No issues with 'giving away answers' observed in testing"

  - date: "Post-MVP"
    decision: "Add Supabase database for learning state"
    status: "✅ Implemented"
    rationale: |
      Original plan: Client-side state only (5-day MVP focus)
      Expansion rationale:
      - Spaced repetition requires persistent schedules
      - Multi-device learning (desktop + mobile)
      - User accounts enable personalized paths
      - Progress tracking motivates continued practice
    alternatives: "LocalStorage (single-device), Firebase (similar to Supabase)"
    cost: "Free tier sufficient for development + 50k MAU"

  - date: "Post-MVP"
    decision: "Add Supabase Auth (Email + OAuth)"
    status: "✅ Implemented"
    rationale: |
      Original plan: No authentication (public demo)
      Expansion rationale:
      - Database requires user accounts (can't store progress without user ID)
      - RLS policies enforce data isolation
      - OAuth reduces signup friction
    alternatives: "NextAuth.js (more complex), Auth0 (overkill), custom auth (insecure)"

  - date: "Post-MVP"
    decision: "Implement solution path scaffolding system"
    status: "✅ Implemented"
    rationale: |
      Original plan: Single system prompt with implicit stage tracking
      Expansion rationale:
      - Multi-step problems need structured guidance
      - Progressive hints (level 1-2-3) based on struggle
      - Multiple valid approaches (elimination vs substitution)
      - Students need to see progress (step 2 of 4)
    alternatives: "Keep implicit (simpler but less transparent)"
    outcome: "Significantly improved UX, students understand where they are in problem"

  - date: "Post-MVP"
    decision: "Add problem generation (similar/harder/mixed)"
    status: "✅ Implemented"
    rationale: |
      Original plan: "Problem generation out of scope for MVP"
      Expansion rationale:
      - Mastery-based progression requires endless practice problems
      - Manual problem creation doesn't scale
      - GPT-4o generates high-quality, contextually appropriate problems
    alternatives: "Problem database (requires curation), manual entry"
    outcome: "Enables unlimited practice, adaptive difficulty progression"

  - date: "Post-MVP"
    decision: "Implement SM-2 spaced repetition"
    status: "✅ Implemented"
    rationale: |
      Research-backed algorithm for optimal review timing
      - Prevents forgetting (Ebbinghaus forgetting curve)
      - Exponential interval growth (1 → 6 → 15 → 37 days)
      - Adaptive based on performance
    alternatives: "Leitner system (simpler, less optimal), custom algorithm"
    outcome: "Long-term retention, students review at optimal times"

  - date: "Post-MVP"
    decision: "Add whiteboard canvas (Fabric.js)"
    status: "✅ Implemented"
    rationale: |
      Original plan: "Out of scope (geometry requires visual diagrams)"
      Expansion rationale:
      - Some students prefer visual problem-solving
      - Geometry/graphing problems benefit from drawing
      - Export drawing to share work (future feature)
    alternatives: "Excalidraw (lighter), Tldraw (modern), canvas-only (no library)"
    bundle_impact: "300KB (lazy-loaded)"
    outcome: "Used occasionally, valuable for geometry students"

## Future Enhancements

### Priority 1: Complete Learning System (from LEARNING_STRATEGIES.md)
  - "Targeted Practice button (focus on weak topics)"
  - "Daily Practice mode with streak counter"
  - "Non-interference logic (space similar topics apart)"
  - "Progress visualization dashboard"

  Estimated effort: 8-12 hours
  Impact: Completes core pedagogical engine

### Priority 2: Engagement Features
  - "Streak counter (daily practice incentive)"
  - "Achievement badges (milestones, mastery)"
  - "Progress charts (strength over time per topic)"
  - "Leaderboards (optional, privacy-controlled)"

  Estimated effort: 12-18 hours
  Impact: Increases user retention

### Priority 3: Advanced Features
  - "Topic dependency tree (prerequisites enforcement)"
  - "Fluency drills (timed practice for automaticity)"
  - "Voice mode (speech-to-text input)"
  - "Conversation history export (PDF)"
  - "Teacher dashboard (multi-student management)"

  Estimated effort: 30-40 hours
  Impact: Feature-complete learning platform

### Technical Improvements
  - "Automated test suite (Jest + Playwright)"
  - "Database migration system (Prisma or Supabase CLI)"
  - "Response caching (Redis/Vercel KV)"
  - "Bundle optimization (remove Anthropic SDK, lazy-load more)"
  - "Performance monitoring (Sentry, LogRocket)"
  - "A/B testing framework (prompt variations)"

## Architectural Evolution Notes

**How We Got Here:**

v1.0 (5-day MVP - Nov 3-7):
- Simple Socratic tutor
- Text + image input
- Claude Sonnet 4.5
- No database
- No auth
- Single system prompt

v1.5 (Post-MVP Enhancements):
- Switched to OpenAI GPT-4o
- Added solution path system
- Added problem generation
- Still client-side state only

v2.0 (Current Production):
- Full database (Supabase)
- Authentication (Email + OAuth)
- Spaced repetition (SM-2)
- Learning algorithms (mastery, topic inference)
- Mixed practice sessions
- Whiteboard canvas
- 8 API endpoints

**Key Architectural Shifts:**
1. Stateless → Stateful (database added)
2. Anonymous → Authenticated (user accounts added)
3. Single prompt → Multi-component (solution path scaffolding)
4. Manual problem entry → Generated problems (OpenAI generation)
5. Simple retry → Advanced learning (spaced repetition)

**Why Documentation Fell Behind:**
- Rapid iteration during bootcamp sprint
- Focus on features over docs
- No time allocated for architecture updates
- MVP assumptions (no database, no auth) invalidated quickly

**Lessons Learned:**
- Update architecture doc after major decisions (not just at end)
- Decision log should be updated in real-time
- Document "why" decisions, not just "what" (invaluable for future reference)

---

**Document Status:** CURRENT (Reflects actual implementation as of 2025-11-04)
**Supersedes:** docs/architecture.md (v1.0, outdated)
**Next Steps:**
1. Review learning algorithm optimizations (separate report)
2. Prioritize LEARNING_STRATEGIES.md roadmap
3. Implement automated testing
4. Set up monitoring dashboards

**Contact:** Winston (Architect) for questions
