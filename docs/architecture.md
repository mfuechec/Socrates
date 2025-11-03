# Architecture Document

## Overview
project_name: "Socrates - AI Math Tutor"
version: "v1.0 (MVP)"
date: "2025-11-03"
architect: "Winston (System Architect)"

description: |
  Socrates is an AI-powered math tutoring application that uses the Socratic method to guide
  students through problem-solving. The system accepts math problems via text or image input,
  then engages students in guided dialogue to help them discover solutions independently—never
  giving direct answers.

  Core architectural principle: Keep frontend simple, push pedagogical logic to LLM via conversation
  context. The architecture prioritizes dialogue quality over feature breadth, with secure API key
  management via Next.js serverless functions.

## System Architecture

architecture_style: "Serverless Frontend + API Proxy + External LLM"

high_level_design: |
  Three-tier architecture optimized for rapid bootcamp development:

  1. **Presentation Layer (Next.js Frontend)**
     - React components for chat UI, image upload, math rendering
     - Client-side state management (minimal: problem + messages)
     - No direct API key access

  2. **API Proxy Layer (Next.js API Routes)**
     - Serverless functions on Vercel Edge network
     - Secure proxy to Claude API (API key server-side only)
     - Request/response transformation and error handling

  3. **AI Layer (Claude API)**
     - Claude Sonnet 4.5 for Socratic dialogue
     - Claude Vision for image-to-text extraction
     - All pedagogy logic lives in LLM prompt

  Data flow: Browser → Next.js API Route → Claude API → Response

  Key architectural decision: No database for MVP. Conversation state lives in client memory only.
  This simplifies deployment and keeps focus on dialogue quality during 5-day sprint.

## Components

components:
  - name: "Chat Interface"
    purpose: "Main user interaction surface for problem input and dialogue"
    technology: "Next.js (React), TypeScript, Tailwind CSS"
    responsibilities:
      - "Display conversation history (student messages + tutor responses)"
      - "Render LaTeX math equations via KaTeX"
      - "Handle text input and image uploads"
      - "Manage UI state (loading, errors, previews)"
      - "Provide turn counter with 15-turn warning"
    interfaces:
      - "Calls /api/chat for text-based tutoring"
      - "Calls /api/vision for image processing"
      - "Receives formatted responses with LaTeX markup"

  - name: "Problem Input Components"
    purpose: "Dual input methods for problem entry"
    technology: "React functional components, react-dropzone"
    responsibilities:
      - "Text Input: Textarea with basic math notation support"
      - "Image Upload: Drag-drop interface with preview"
      - "Validation: Ensure problem statement exists before chat"
      - "Preview: Show extracted text from images for user correction"
    interfaces:
      - "Emits problem text to Chat Interface"
      - "Triggers /api/vision for image processing"
    image_validation: |
      Client-Side Validation (before upload):
      - Max file size: 5MB (check file.size, show error immediately)
      - Allowed formats: PNG, JPG, JPEG (check file.type === 'image/png' | 'image/jpeg')
      - Min dimensions: 200x200px (too small = likely bad OCR)
      - Max dimensions: 4000x4000px (too large = slow upload, unnecessary)
      - Error messages:
        - "Image too large (max 5MB)"
        - "Invalid format (use PNG or JPG)"
        - "Image too small (min 200x200px)"
      - Benefits: Instant feedback, no wasted bandwidth, no API costs for invalid uploads

  - name: "Conversation Manager"
    purpose: "Maintain conversation state and coordinate API calls"
    technology: "TypeScript module in /lib"
    responsibilities:
      - "Maintain message history (ConversationState)"
      - "Format context for LLM (problem statement + full history)"
      - "Coordinate calls to API routes"
      - "Handle API errors and retry logic"
      - "Track conversation length for UI warnings"
    interfaces:
      - "Exposes sendMessage(content: string): Promise<string>"
      - "Exposes resetConversation()"
      - "Consumes API Client for HTTP calls"
    reset_behavior: |
      resetConversation() performs the following:
      - Clears all messages from ConversationState
      - Clears problem statement (resets to empty string)
      - Cancels any pending API calls (via AbortController)
      - Resets turn counter to 0
      - Clears UI error state (sets error to null)
      - Does NOT clear image preview URL (user can reuse uploaded image)
      - Does NOT show confirmation dialog (for MVP simplicity - instant reset)
      - Returns UI to initial state (show problem input, hide chat)

  - name: "API Client"
    purpose: "HTTP client for backend API routes with resilience"
    technology: "TypeScript with fetch API, exponential backoff"
    responsibilities:
      - "Make POST requests to /api/chat and /api/vision"
      - "Retry failed requests (3 attempts, exponential backoff)"
      - "Handle rate limiting (429) with cooldown"
      - "Parse and normalize API responses"
      - "Graceful error handling with user-friendly messages"
    interfaces:
      - "chatWithTutor(messages: Message[]): Promise<string>"
      - "extractProblemFromImage(imageFile: File): Promise<string>"
    retry_specification: |
      Exponential Backoff Strategy:
      - Trigger: HTTP 500, 429, 503, network timeout (ECONNRESET, ETIMEDOUT)
      - Do NOT retry: 400, 401, 403, 404 (client errors - won't succeed on retry)
      - Attempts: 3 total (1 initial + 2 retries)
      - Delays: 500ms, 1000ms, 2000ms (exponential with 2x multiplier)
      - Total max wait: 3.5s before final failure
      - User feedback: Show "Retrying..." message after first failure
      - Abort: Use AbortController to cancel if user resets conversation

  - name: "Prompt Builder"
    purpose: "Construct system prompts with Socratic rules"
    technology: "TypeScript module with template strings"
    responsibilities:
      - "Inject system prompt with Socratic method rules"
      - "Format conversation context (problem + history)"
      - "Handle hint escalation logic in prompt text"
      - "Build temperature and max_token parameters"
    interfaces:
      - "buildSystemPrompt(problem: string): string"
      - "formatMessagesForAPI(messages: Message[]): APIMessage[]"

  - name: "Math Renderer"
    purpose: "Display formatted mathematical equations"
    technology: "KaTeX via react-katex or rehype-katex"
    responsibilities:
      - "Parse LaTeX from tutor responses ($...$ and $$...$$)"
      - "Render inline and block equations"
      - "Graceful fallback for malformed LaTeX"
      - "Support basic math symbols and notation"
    interfaces:
      - "Receives raw message content with LaTeX"
      - "Outputs rendered HTML with styled equations"

  - name: "Claude API Proxy (Chat)"
    purpose: "Secure serverless proxy for chat completions"
    technology: "Next.js API Route, Anthropic SDK"
    responsibilities:
      - "Receive chat request from frontend (problem + messages)"
      - "Build API payload with system prompt and conversation"
      - "Call Claude API with server-side API key"
      - "Return tutor response to frontend"
      - "Log errors for debugging (without exposing to client)"
    interfaces:
      - "POST /api/chat"
      - "Request: { problem: string, messages: Message[] }"
      - "Response: { response: string } or { error: string }"

  - name: "Claude Vision Proxy"
    purpose: "Image-to-text extraction via Claude Vision API"
    technology: "Next.js API Route, Claude Vision"
    responsibilities:
      - "Receive image file from frontend (multipart/form-data)"
      - "Convert to base64 for Claude API"
      - "Call Claude Vision with prompt: 'Extract math problem text'"
      - "Return extracted text for user verification"
      - "Handle OCR errors gracefully (suggest manual entry)"
    interfaces:
      - "POST /api/vision"
      - "Request: multipart/form-data with image file"
      - "Response: { extractedText: string } or { error: string }"

## Component Ownership & Data Flow

component_hierarchy: |
  React Component Tree:

  index.tsx (Next.js Page)
  └─ ChatInterface (owns ConversationState, UIState)
     ├─ ProblemInput
     │  ├─ text input textarea
     │  └─ ImageUpload
     │     └─ calls api-client.extractProblemFromImage()
     │     └─ emits onProblemSubmit(problem: string) to ChatInterface
     ├─ MessageList
     │  └─ receives messages[] from ChatInterface (props)
     │  └─ maps over messages, renders each with MathRenderer
     └─ uses conversation-manager.ts
        └─ uses api-client.ts
           └─ calls /api/chat, /api/vision

state_ownership: |
  State Management Strategy:

  ChatInterface component owns:
    - ConversationState: { problemStatement, messages }
    - UIState: { isLoading, error, imagePreviewUrl }

  State flows down via props:
    - ChatInterface → MessageList: messages={conversationState.messages}
    - ChatInterface → ProblemInput: onSubmit={handleProblemSubmit}

  Callbacks flow up:
    - ProblemInput → ChatInterface: onProblemSubmit(problem: string)
    - ImageUpload → ProblemInput: onImageExtracted(text: string)

  No global state management (no Redux, no Context):
    - Single-page app, all state in top-level ChatInterface
    - Pass down via props (React best practices for simple apps)

data_flow_sequence: |
  Typical User Flow (Text Input):

  1. User types problem in ProblemInput textarea
  2. User clicks "Start" button
  3. ProblemInput calls onProblemSubmit(problem) → ChatInterface
  4. ChatInterface updates conversationState.problemStatement
  5. User types first message, clicks Send
  6. ChatInterface calls conversation-manager.sendMessage(content)
  7. conversation-manager calls api-client.chatWithTutor(messages)
  8. api-client makes POST /api/chat with retry logic
  9. /api/chat (Next.js API route) proxies to Claude API
  10. Claude API returns tutor response
  11. api-client returns response to conversation-manager
  12. conversation-manager appends response to messages array
  13. ChatInterface re-renders, MessageList shows new message
  14. MathRenderer parses LaTeX, displays formatted equation

  Typical User Flow (Image Input):

  1. User drags image into ImageUpload component
  2. ImageUpload validates (size, format, dimensions)
  3. ImageUpload calls api-client.extractProblemFromImage(file)
  4. api-client makes POST /api/vision
  5. /api/vision converts to base64, calls Claude Vision API
  6. Vision API returns extracted text
  7. api-client returns extractedText to ImageUpload
  8. ImageUpload shows preview with "Edit" option
  9. User confirms/edits, clicks "Use This Problem"
  10. ImageUpload calls onImageExtracted(text) → ProblemInput
  11. ProblemInput calls onProblemSubmit(problem) → ChatInterface
  12. (Continues same as text input flow from step 4)

## Technology Stack

frontend:
  framework: "Next.js 14+ (React 18)"
  state_management: "React useState/useContext (no Redux - keep simple)"
  styling: "Tailwind CSS 3.x"
  key_libraries:
    - "react-katex (math rendering)"
    - "react-dropzone (image upload)"
    - "next/image (optimized image display)"

backend:
  language: "TypeScript"
  framework: "Next.js API Routes (serverless functions)"
  api_style: "REST (simple POST endpoints)"
  key_libraries:
    - "@anthropic-ai/sdk (Claude API client)"
    - "multiparty or formidable (multipart form parsing)"

database:
  type: "None (MVP)"
  primary_db: "Client-side memory only"
  orm: "N/A"
  notes: |
    No persistence for MVP. Conversation state lives in React state.
    Post-MVP: Add localStorage or database for conversation history.

infrastructure:
  hosting: "Vercel (serverless + edge network)"
  ci_cd: "Vercel auto-deploy from GitHub (push to main)"
  monitoring: "Vercel Analytics + console.anthropic.com for API usage"

environment_variables: |
  Configuration via .env.local (local) and Vercel Dashboard (production)

  Required (Server-Side - Secrets):
    CLAUDE_API_KEY=sk-ant-xxx
      - Get from: console.anthropic.com → API Keys
      - Where: .env.local (local), Vercel Dashboard → Settings → Environment Variables (production)
      - Security: NEVER commit to Git, server-side only (not NEXT_PUBLIC_)

  Optional (Tunable Parameters - Server-Side):
    LLM_TEMPERATURE=0.4
      - Default: 0.4 (hardcoded in code if not set)
      - Range: 0.0-1.0 (lower = more consistent, higher = more creative)

    LLM_MAX_TOKENS=500
      - Default: 500 (hardcoded in code if not set)
      - Purpose: Limit tutor response length (Socratic = brief questions)

    LLM_MODEL=claude-sonnet-4.5-20241022
      - Default: claude-sonnet-4.5-20241022 (hardcoded if not set)
      - Purpose: Allow model upgrades without code changes

  Optional (Client-Side - Public):
    NEXT_PUBLIC_APP_NAME=Socrates
      - Default: "Socrates" (hardcoded if not set)
      - Purpose: Branding/title display

    NEXT_PUBLIC_VERCEL_URL=(auto-set by Vercel)
      - Purpose: CORS allowlist (automatically available in production)

  Example .env.local:
    # Required
    CLAUDE_API_KEY=sk-ant-api03-xxx

    # Optional (use defaults if omitted)
    # LLM_TEMPERATURE=0.4
    # LLM_MAX_TOKENS=500
    # NEXT_PUBLIC_APP_NAME=Socrates

## Data Model

entities:
  - name: "ConversationState"
    description: "Client-side state representing active tutoring session"
    attributes:
      - name: "problemStatement"
        type: "string"
        required: true
      - name: "messages"
        type: "Message[]"
        required: true
    relationships: []
    notes: |
      Intentionally minimal. Stage tracking (understand/plan/execute/verify)
      and hint escalation are implicit in LLM conversation context.

  - name: "Message"
    description: "Single turn in conversation (student or tutor)"
    attributes:
      - name: "role"
        type: "'student' | 'tutor'"
        required: true
      - name: "content"
        type: "string"
        required: true
      - name: "timestamp"
        type: "Date"
        required: true
    relationships:
      - type: "BELONGS_TO"
        entity: "ConversationState"

  - name: "UIState"
    description: "Presentation state (separate from domain logic)"
    attributes:
      - name: "isLoading"
        type: "boolean"
        required: true
      - name: "error"
        type: "string | null"
        required: false
      - name: "imagePreviewUrl"
        type: "string | null"
        required: false
    relationships: []
    notes: |
      UI concerns kept separate from conversation state.
      No coupling between loading spinners and dialogue logic.

## API Design

endpoints:
  - method: "POST"
    path: "/api/chat"
    description: "Send student message, receive Socratic tutor response"
    request:
      headers:
        - "Content-Type: application/json"
      body: |
        {
          "problem": "2x + 5 = 13",
          "messages": [
            { "role": "student", "content": "I don't know where to start" }
          ]
        }
    response:
      success: |
        {
          "response": "To solve for x, we need to isolate it. What operations are being applied to x in this equation?"
        }
      errors:
        - code: "500"
          message: "{ \"error\": \"Claude API error: [details]\" }"
        - code: "429"
          message: "{ \"error\": \"Rate limit exceeded. Wait 30s.\" }"
        - code: "400"
          message: "{ \"error\": \"Missing required field: problem\" }"
    implementation_notes: |
      - CORS Protection: Check origin header against allowlist (localhost:3000 + Vercel domain)
      - Input Validation: Verify problem and messages fields exist and are non-empty
      - Uses Prompt Builder to construct system prompt
      - Passes conversation to Claude API with temp=0.4, max_tokens=500
      - Implements exponential backoff retry (3 attempts)
      - Logs errors server-side, returns sanitized errors to client

      CORS Implementation:
        const allowedOrigins = [
          'http://localhost:3000',  // Development
          'https://socrates-math-tutor.vercel.app'  // Production (update with actual URL)
        ];
        const origin = req.headers.origin;
        if (origin && !allowedOrigins.includes(origin)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

  - method: "POST"
    path: "/api/vision"
    description: "Extract math problem text from uploaded image"
    request:
      headers:
        - "Content-Type: multipart/form-data"
      body: |
        FormData with 'image' field containing PNG/JPG file
    response:
      success: |
        {
          "extractedText": "Solve for x: 3(x - 4) = 2x + 5"
        }
      errors:
        - code: "500"
          message: "{ \"error\": \"Vision API failed\" }"
        - code: "400"
          message: "{ \"error\": \"No image file provided\" }"
        - code: "413"
          message: "{ \"error\": \"Image too large (max 5MB)\" }"
    implementation_notes: |
      - CORS Protection: Same origin allowlist as /api/chat
      - Validate file exists and is under 5MB (redundant with frontend, but enforce server-side)
      - Convert image to base64
      - Send to Claude Vision API with prompt: "Extract the math problem from this image. Return only the problem text."
      - Return extracted text for user verification
      - Frontend shows correction UI if OCR is wrong

## Security Architecture

authentication: "None (MVP - public demo app)"
authorization: "None (MVP - no user accounts)"

data_encryption:
  at_rest: "N/A (no database)"
  in_transit: "TLS 1.3 (Vercel enforces HTTPS)"

security_considerations:
  - "API Key Protection: CLAUDE_API_KEY stored in Vercel env vars, never exposed to browser"
  - "Rate Limiting: Set $50 spending limit in Anthropic Console to prevent abuse"
  - "CORS Protection: API routes check origin header against allowlist (localhost + production URL)"
  - "Input Validation & Sanitization:
      - Threat Model: Prompt injection (user tries to override system prompt)
      - Validation: Message length max 1000 chars, problem statement max 500 chars
      - Validation: problem and messages fields must be non-empty
      - No HTML escaping needed (Claude API handles it, no HTML rendering of user input)
      - No SQL injection concern (no database)
      - LaTeX rendering via KaTeX (not eval, safe from XSS)"
  - "No PII Storage: Conversations not persisted, no privacy concerns"
  - "DoS Protection: Vercel edge functions have automatic rate limiting per IP"
  - "Error Handling: Never expose API keys or internal errors to client"

post_mvp_security:
  - "Add user authentication (NextAuth.js)"
  - "Implement per-user API rate limiting"
  - "Add CAPTCHA to prevent bot abuse"
  - "Server-side input sanitization for XSS prevention"

## Performance & Scalability

performance_targets:
  response_time: "< 3s for tutor response (depends on Claude API latency)"
  throughput: "N/A (serverless auto-scales)"
  concurrent_users: "100+ (Vercel handles bursts automatically)"

scalability_strategy: |
  Serverless architecture scales automatically via Vercel:
  - API routes are stateless functions (horizontal scaling built-in)
  - No database bottleneck (client-side state only)
  - Edge network CDN for static assets
  - Claude API has own rate limits (monitor via Anthropic Console)

  Current architecture supports 100+ concurrent users without modification.
  For 1000+ users, would need to implement:
  - Response caching for common patterns
  - Request queuing during Claude API rate limits
  - Database for conversation persistence (reduces client memory pressure)

caching:
  - layer: "Static Assets"
    technology: "Vercel Edge CDN"
    strategy: "Cache JS bundles, images, fonts (immutable assets)"
  - layer: "API Responses"
    technology: "None (MVP)"
    strategy: "Post-MVP: Cache common Socratic questions for faster responses"

optimization_notes: |
  - KaTeX rendering is client-side (fast, no server overhead)
  - Next.js Image component lazy-loads uploaded images
  - API routes are edge functions (deployed globally, low latency)
  - Temperature 0.4 reduces Claude API response time vs. higher temps

## Deployment Architecture

environments:
  - name: "development"
    url: "http://localhost:3000"
    config: "Local .env.local with dev API key (low spending limit)"
  - name: "production"
    url: "https://socrates-math-tutor.vercel.app (example)"
    config: "Vercel env vars with production API key ($50 limit)"

deployment_strategy: "Continuous Deployment (Vercel GitHub Integration)"

deployment_process: |
  1. Push to main branch → Vercel auto-deploys
  2. Preview deployments for PRs (test before merge)
  3. Environment variables set in Vercel dashboard
  4. Zero-downtime deployments (Vercel handles routing)
  5. Rollback: Revert Git commit or use Vercel dashboard

initial_setup:
  - "Connect GitHub repo to Vercel"
  - "Configure build: next build"
  - "Set env var: CLAUDE_API_KEY"
  - "Deploy takes ~2 minutes"

## Monitoring & Observability

logging:
  tool: "Vercel Logs (built-in)"
  levels: "INFO, ERROR"
  strategy: |
    - API routes log all Claude API errors (with sanitized details)
    - Frontend logs critical errors to console (dev mode only)
    - No user tracking or analytics for MVP (privacy-first)

metrics:
  - metric: "Claude API Usage"
    threshold: "$50 spending limit"
    alert: "Email notification from Anthropic when limit reached"
  - metric: "API Route Errors"
    threshold: "> 10% error rate"
    alert: "Check Vercel logs for Claude API failures"
  - metric: "Conversation Turn Count"
    threshold: "> 15 turns"
    alert: "UI warning to user (not system alert)"

tracing: "None (MVP) - Vercel logs show request/response timing"

monitoring_checklist:
  - "Daily: Check console.anthropic.com for API usage ($$ spent)"
  - "Daily: Review Vercel logs for errors during development"
  - "Weekly: Test all 5 problem types to catch prompt regressions"

## Development Practices

code_organization: |
  Concrete File Structure:

  /src
    /components
      ChatInterface.tsx        # Main chat container, owns ConversationState
      MessageList.tsx          # Display message history with math rendering
      ProblemInput.tsx         # Text input component
      ImageUpload.tsx          # Image upload with drag-drop
      MathRenderer.tsx         # KaTeX wrapper for LaTeX rendering
    /lib
      conversation-manager.ts  # ConversationState management, sendMessage(), reset()
      api-client.ts            # HTTP client with retry logic, AbortController
      prompt-builder.ts        # Build system prompt, format messages for API
    /prompts
      socratic-tutor.ts        # System prompt with Socratic method rules
    /types
      conversation.ts          # ConversationState, Message interfaces
      ui.ts                    # UIState interface
      api.ts                   # API request/response types

  /pages                       # Using Pages Router (simpler than App Router for MVP)
    /api
      chat.ts                  # POST /api/chat - Socratic dialogue proxy
      vision.ts                # POST /api/vision - Image OCR proxy
    index.tsx                  # Main page (renders ChatInterface)
    _app.tsx                   # Next.js app wrapper (global styles, providers)

  /public
    /test-images               # 10 sample problem images (problem-01.png, etc.)

  /docs
    architecture.md            # This file
    example-walkthroughs.md    # 5 problem type demos
    prompt-engineering-notes.md # Prompt iteration log
    state-management.md        # Simplified state design rationale

  Root files:
    .env.local                 # Environment variables (gitignored)
    .gitignore                 # Ignore node_modules, .env.local, .next
    next.config.js             # Next.js configuration
    package.json               # Dependencies
    tsconfig.json              # TypeScript configuration (strict mode)
    tailwind.config.js         # Tailwind CSS config
    README.md                  # Setup instructions

  File Naming Convention:
  - Components: PascalCase (ChatInterface.tsx)
  - Lib modules: kebab-case (conversation-manager.ts)
  - API routes: lowercase (chat.ts, vision.ts)
  - Types: kebab-case (conversation.ts)

  Principle: Separation of concerns
  - Components handle UI only (no business logic)
  - Lib modules handle business logic (state, API coordination)
  - API routes handle external API calls (Claude API proxy)
  - Prompts are isolated for easy iteration (change pedagogy without touching code)

coding_standards:
  - "TypeScript strict mode enabled"
  - "ESLint + Prettier for formatting"
  - "Functional React components (no class components)"
  - "Explicit error handling (no silent failures)"
  - "Comments for non-obvious LLM prompt decisions"
  - "File naming: kebab-case for files, PascalCase for components"

testing_strategy:
  unit_tests: "None (MVP) - manual testing priority"
  integration_tests: "None (MVP)"
  e2e_tests: "Manual testing with 5 problem types"
  coverage_target: "N/A"

  lightweight_test_harness: |
    Optional test harness (30 minutes to build, run manually on-demand):

    Purpose: Quick regression check after prompt changes
    Implementation: Create scripts/test-harness.ts
      - Hardcoded test conversations (problem + sequence of student responses)
      - Calls /api/chat endpoint directly (bypasses UI)
      - Checks basic assertions: "Did tutor give direct answer?" (regex match for "x = ")
      - Outputs: PASS/FAIL for each scenario with tutor responses

    Usage: Run manually when needed, NOT automatic on every prompt change
      - Before major prompt iterations (Day 1-2)
      - After changing temperature/max_tokens
      - Before final deployment (Day 5)
      - On-demand when debugging failures

    Command: npm run test:prompts (custom script)
    Time: ~30 seconds per run
    Benefits: Catches regressions without full manual testing

  manual_testing: |
    Primary testing strategy for MVP:

    For each of 5 problem types, test 5 scenarios:
    1. Perfect student (correct answers)
    2. Struggling student (wrong answers, needs hints)
    3. Confused student (multiple "I don't know")
    4. Skip-ahead student (tries to jump to answer)
    5. Partial understanding (gets some steps, not others)

    Quality checklist per conversation:
    - Never gave direct answer ✓
    - Logical question progression ✓
    - Provided hint after 2+ struggles ✓
    - Validated correct reasoning ✓
    - Solved in < 10 turns ✓

    Testing cadence:
    - Day 1: Test Problems #1-3 after each prompt iteration
    - Day 2: Test all 5 problems with final prompt
    - Day 3-4: Spot check if prompt changes
    - Day 5: Full regression test before deployment

## Dependencies & Integrations

external_services:
  - name: "Claude API (Anthropic)"
    purpose: "Socratic tutoring dialogue + image OCR"
    integration: "REST API via @anthropic-ai/sdk"
    api_version: "2023-06-01"
    rate_limits: "Tier-dependent (check Anthropic docs)"
    cost: "$3/1M input tokens, $15/1M output tokens (Sonnet 4.5)"
    fallback: "Display error message, suggest retry or manual input"

  - name: "Vercel"
    purpose: "Hosting, serverless functions, CDN"
    integration: "GitHub auto-deploy"
    cost: "Free tier (hobby plan) sufficient for MVP"
    limits: "100GB bandwidth, 100 serverless invocations/day (hobby)"

npm_dependencies:
  critical:
    - "@anthropic-ai/sdk: ^0.x (Claude API client)"
    - "react: ^18.x"
    - "next: ^14.x"
    - "react-katex: ^3.x (math rendering)"
  supporting:
    - "react-dropzone: ^14.x (image upload)"
    - "tailwindcss: ^3.x (styling)"
    - "typescript: ^5.x"

## Risks & Technical Debt

risks:
  - risk: "LLM gives direct answers despite prompting"
    likelihood: "MEDIUM"
    impact: "HIGH (breaks core value prop)"
    mitigation: |
      - Extensive prompt testing in Claude.ai before building UI
      - Temperature 0.4 for consistency
      - Test each problem type 10+ times
      - Fallback prompts ready (more structured, more examples)

  - risk: "Claude API rate limits or downtime"
    likelihood: "LOW"
    impact: "HIGH (app unusable)"
    mitigation: |
      - Exponential backoff retry logic
      - User-friendly error messages
      - Monitor API status page
      - $50 spending limit prevents runaway costs

  - risk: "Image OCR misreads math symbols"
    likelihood: "MEDIUM"
    impact: "MEDIUM (frustrating UX)"
    mitigation: |
      - Text correction UI for bad OCR
      - Make text input primary, image as secondary
      - Test with 10 sample images early (Day 2)
      - Focus on printed/typed text only

  - risk: "Long conversations hit token limits"
    likelihood: "LOW"
    impact: "LOW (rare edge case)"
    mitigation: |
      - All test problems designed for < 10 turns
      - UI warning at 15 turns
      - Graceful error handling if limit hit
      - Post-MVP: Conversation summarization

  - risk: "API key exposed or stolen"
    likelihood: "LOW (with Next.js proxy)"
    impact: "HIGH (could cost $$$)"
    mitigation: |
      - API key in server-side env vars only
      - $50 spending limit at API provider
      - Never commit .env files to Git
      - Vercel enforces HTTPS (no MITM attacks)

known_technical_debt:
  - item: "No conversation persistence"
    priority: "LOW"
    plan: "Post-MVP: Add localStorage or database. Not needed for 5-day demo."

  - item: "No automated testing"
    priority: "MEDIUM"
    plan: "Post-MVP: Add Jest unit tests for lib modules, Playwright E2E tests for critical paths."

  - item: "No response caching"
    priority: "LOW"
    plan: "Post-MVP: Cache common Socratic questions to reduce API costs."

  - item: "LLM temperature hardcoded"
    priority: "LOW"
    plan: "Could make tunable per problem type if needed. Start with 0.4 for all."

  - item: "No user authentication"
    priority: "LOW"
    plan: "Not needed for MVP demo. Post-MVP: Add NextAuth.js for multi-user support."

## Decision Log

decisions:
  - date: "2025-11-03"
    decision: "Use Next.js API Routes instead of pure React frontend"
    rationale: |
      Security: Keeps Claude API key server-side only. Pure React would expose key in browser.
      Setup cost: ~30 minutes (Next.js is straightforward).
      Vercel deployment: One-click integration with Next.js.
    alternatives: |
      - Express backend: More setup, separate deployment
      - Client-side API key: Insecure, could cost hundreds if stolen
      - Serverless framework: More complexity than Next.js API routes

  - date: "2025-11-03"
    decision: "Commit to Claude Sonnet 4.5 only (remove multi-LLM support)"
    rationale: |
      Simplicity: Avoid abstraction layer for MVP.
      Quality: Claude Sonnet 4.5 has best instruction-following for "never give answers" rule.
      Time: 5 days insufficient to test multiple LLM providers.
    alternatives: |
      - GPT-4: Comparable quality but slightly worse at following complex rules
      - Multi-LLM abstraction: Over-engineering for bootcamp project

  - date: "2025-11-03"
    decision: "Minimize state management (2 fields instead of 5)"
    rationale: |
      Push logic to LLM: Stage tracking (understand/plan/execute/verify) implicit in conversation.
      Simplicity: Fewer state fields = fewer bugs, easier testing.
      Flexibility: Change pedagogy by editing prompt, not code.
    alternatives: |
      - Explicit stage tracking: Frontend tracks currentStage, creates tight coupling
      - Stuck count in state: Duplicates logic LLM can infer from history

  - date: "2025-11-03"
    decision: "No database for MVP"
    rationale: |
      Scope: Focus 5 days on dialogue quality, not infrastructure.
      Simplicity: Client-side state sufficient for demo.
      Deployment: Vercel serverless is free tier without DB costs.
    alternatives: |
      - PostgreSQL on Vercel: Adds complexity, costs, migration work
      - localStorage: Considered for Post-MVP conversation history

  - date: "2025-11-03"
    decision: "Temperature 0.4 for LLM responses"
    rationale: |
      Consistency: Lower temp reduces non-determinism in Socratic questioning.
      Quality: Testing showed 0.4 balances natural dialogue with reliable rule-following.
    alternatives: |
      - 0.7 (default): Too inconsistent, sometimes gave direct answers
      - 0.0: Too robotic, unnatural conversation flow

  - date: "2025-11-03"
    decision: "Set $50 Claude API spending limit"
    rationale: |
      Cost control: Prevents runaway costs from bugs or abuse.
      Sufficient budget: ~$20-50 covers 5 days of testing (100+ conversations).
      Safety: Catch infinite loops or retry bugs early.
    alternatives: |
      - No limit: Risky, could cost hundreds overnight
      - $25 limit: Too tight, might hit limit during heavy Day 1-2 testing

## Future Enhancements

version_2_roadmap:
  - "Interactive whiteboard for geometry/visual problems"
  - "Simple voice mode (push-to-talk, no interruption)"
  - "Problem generator (create similar practice problems)"
  - "Conversation persistence (database + user accounts)"
  - "Progress tracking (success rate, average turns, topic mastery)"
  - "Multi-student support (teacher dashboard)"

architectural_evolution:
  - "Add database layer for conversation history"
  - "Implement caching for common Socratic questions"
  - "Multi-agent architecture if single prompt insufficient"
  - "Automated testing suite for dialogue quality"
  - "A/B testing framework for prompt iterations"

---

**Document Status:** APPROVED for 5-day bootcamp implementation
**Next Steps:** Review with team, begin Day 1 implementation (prompt testing)
**Contact:** Winston (Architect) via project Slack
