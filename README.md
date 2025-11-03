# Socrates - AI Math Tutor

An AI-powered math tutoring application that uses the Socratic method to guide students through problem-solving. Built with Next.js, React, TypeScript, and OpenAI GPT-4o.

## Features

✅ **Socratic Dialogue** - Never gives direct answers, guides through questions
✅ **Dual Input** - Type problems or upload images with OCR
✅ **LaTeX Math Rendering** - Beautiful equation display with KaTeX
✅ **Smart Error Handling** - Exponential backoff retry with AbortController
✅ **Turn Counter** - Track conversation length with warnings
✅ **Responsive UI** - Clean, accessible chat interface with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.x
- **AI:** OpenAI GPT-4o (with Vision for OCR)
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
- OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Create a `.env.local` file in the project root:
   ```bash
   touch .env.local
   ```

   Add your OpenAI API key and optional config:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   LLM_TEMPERATURE=0.4
   LLM_MAX_TOKENS=500
   LLM_MODEL=gpt-4o
   NEXT_PUBLIC_APP_NAME=Socrates
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

- `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-proj-`)

### Optional (with defaults)

- `LLM_TEMPERATURE=0.4` - Control response creativity (0.0-1.0)
- `LLM_MAX_TOKENS=500` - Limit tutor response length
- `LLM_MODEL=gpt-4o` - OpenAI model version
- `NEXT_PUBLIC_APP_NAME=Socrates` - App display name

## Security

- API keys stored server-side only (never exposed to browser)
- CORS protection on API routes with origin allowlist
- Input validation (client and server-side)
- HTTPS enforced by Vercel
- Sanitized error messages (no internal details exposed)
- Set spending limits on OpenAI dashboard (recommended: $50/month for testing)

## Architecture Highlights

- **Serverless:** Next.js API Routes proxy OpenAI API (keeps keys secure)
- **Stateless:** Conversation state lives in client memory (no database for MVP)
- **Simple State:** Only 2 fields (problemStatement, messages) - pedagogy logic in LLM
- **Prompt-Driven:** Socratic method rules in system prompt, not hardcoded logic
- **Resilient:** Exponential backoff retry (500ms → 1s → 2s) for 500/429/503 errors
- **Cancellable:** AbortController support for clean request cancellation

## Cost Estimates

### OpenAI API (GPT-4o)
- **Input:** $2.50 per 1M tokens
- **Output:** $10 per 1M tokens
- **Estimate:** ~$0.02-$0.05 per 10-turn conversation
- **Recommendation:** Set $50/month spending limit for testing

## Documentation

- [Architecture Document](./docs/architecture.md) - Complete technical architecture
- [PRD](./PRD.md) - Product requirements and user stories
- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step Vercel deployment
- [OpenAI Migration](./docs/OPENAI_MIGRATION.md) - Why we switched from Claude
- [Testing Guides](./docs/stories/) - Story-specific testing instructions

## Support

For issues or questions:
- Review the [Architecture Documentation](./docs/architecture.md)
- Check [OpenAI API Docs](https://platform.openai.com/docs)
- See [Testing Guides](./docs/stories/) for story-specific help

---

**Built with ❤️ as part of the Gauntlet Projects bootcamp**
