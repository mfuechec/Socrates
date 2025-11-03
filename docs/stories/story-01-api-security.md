# Story 1: API Security & Proxy Setup

**As a** developer
**I want** secure API key management and proxy endpoints
**So that** the Claude API key is never exposed and the app is protected from abuse

## Acceptance Criteria

- API key in .env.local (gitignored) and Vercel env vars
- Two API routes created: POST /api/chat and POST /api/vision
- CORS protection: Allowlist localhost:3000 + production URL
- Input validation: Problem max 500 chars, messages max 1000 chars, images max 5MB
- Server-side validation for all requests (reject invalid origins/data)
- $50 spending limit set in Anthropic Console
- API routes return sanitized errors (never expose keys/internals)

## Priority
MVP Critical - **Build First**

## Effort
Medium (4-5 hours)

## Dependencies
None (foundational)

## Technical Notes

### API Routes Implementation
```typescript
// pages/api/chat.ts
- Validate CORS origin
- Validate request body (problem, messages)
- Call Claude API with system prompt
- Return sanitized response

// pages/api/vision.ts
- Validate CORS origin
- Validate multipart form data
- Convert image to base64
- Call Claude Vision API
- Return extracted text
```

### Environment Variables
```bash
# .env.local (gitignored)
CLAUDE_API_KEY=sk-ant-xxx

# Optional tuning (defaults in code)
LLM_TEMPERATURE=0.4
LLM_MAX_TOKENS=500
LLM_MODEL=claude-sonnet-4.5-20241022
```

### CORS Allowlist
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_VERCEL_URL
];
```

## Definition of Done
- [ ] .env.local created with CLAUDE_API_KEY
- [ ] .gitignore includes .env.local
- [ ] /api/chat route implemented and tested
- [ ] /api/vision route implemented and tested
- [ ] CORS protection verified (rejected unauthorized origin)
- [ ] Input validation tested (rejected oversized/invalid inputs)
- [ ] $50 spending limit set in console.anthropic.com
- [ ] Vercel environment variables configured
