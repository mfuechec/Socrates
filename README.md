# Socrates - AI Math Tutor

An AI-powered math tutoring application that uses the Socratic method to guide students through problem-solving. Built with Next.js, React, TypeScript, and Claude AI.

## Tech Stack

- **Framework:** Next.js 14+ (Pages Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.x
- **AI:** Claude Sonnet 4.5 (Anthropic API)
- **Math Rendering:** KaTeX via react-katex
- **Image Upload:** react-dropzone
- **Deployment:** Vercel

## Project Structure

```
/src
  /components       # React components (ChatInterface, MessageList, etc.)
  /lib             # Business logic (conversation-manager, api-client, etc.)
  /prompts         # LLM system prompts
  /types           # TypeScript type definitions
  /styles          # Global CSS and Tailwind config

/pages
  /api             # Next.js API routes (chat.ts, vision.ts)
  index.tsx        # Main page
  _app.tsx         # Next.js app wrapper

/docs              # Architecture and PRD documentation
/public            # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Claude API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Copy the `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Claude API key:
   ```
   CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Environment Variables

### Required

- `CLAUDE_API_KEY` - Your Claude API key from Anthropic

### Optional (with defaults)

- `LLM_TEMPERATURE=0.4` - Control response creativity (0.0-1.0)
- `LLM_MAX_TOKENS=500` - Limit tutor response length
- `LLM_MODEL=claude-sonnet-4-5-20241022` - Claude model version
- `NEXT_PUBLIC_APP_NAME=Socrates` - App display name

## Development Workflow

1. Review the architecture documentation in `/docs/architecture.md`
2. Implement components following the defined structure
3. Test with sample math problems
4. Run linter before committing: `npm run lint`
5. Deploy to Vercel (auto-deploys from main branch)

## Security

- API keys are stored server-side only (never exposed to browser)
- CORS protection on API routes
- HTTPS enforced by Vercel
- $50 spending limit recommended on Anthropic Console

## Architecture Highlights

- **Serverless:** Next.js API Routes proxy Claude API (keeps keys secure)
- **Stateless:** Conversation state lives in client memory (no database for MVP)
- **Simple State:** Only 2 fields (problemStatement, messages) - pedagogy logic in LLM
- **Prompt-Driven:** Socratic method rules in prompt, not hardcoded logic

## Next Steps

1. Implement core components (ChatInterface, ProblemInput, MessageList)
2. Build API routes (/api/chat, /api/vision)
3. Create Socratic tutor system prompt
4. Test with 5 problem types from PRD
5. Deploy to Vercel

## Documentation

- [Architecture Document](./docs/architecture.md) - Complete technical architecture
- [PRD](./PRD.md) - Product requirements and user stories

## Support

For issues or questions, review the architecture documentation or check the Anthropic API docs.

---

**Built with ❤️ as part of the Gauntlet Projects bootcamp**
