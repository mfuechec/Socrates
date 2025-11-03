# Story 1: API Security Testing Guide

## Prerequisites

1. **Get your Claude API key** from https://console.anthropic.com/
2. **Add it to `.env.local`**:
   ```bash
   CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
   ```

## Testing Steps

### Step 1: Start the Dev Server

```bash
npm run dev
```

Server should start at `http://localhost:3000`

### Step 2: Test Input Validation (No API Key Needed)

Open a new terminal and run these curl commands:

**Test: Missing problem field (should return 400)**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "messages": []
  }'
```

Expected: `{"error":"Missing required field: problem"}`

**Test: Problem too long (should return 400)**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "problem": "'$(printf 'x%.0s' {1..501})'",
    "messages": []
  }'
```

Expected: `{"error":"Problem too long (max 500 chars)"}`

**Test: CORS protection (should return 403)**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-site.com" \
  -d '{
    "problem": "2x + 5 = 13",
    "messages": []
  }'
```

Expected: `{"error":"Forbidden"}`

### Step 3: Test With Real API Key

**IMPORTANT:** Make sure you added your real API key to `.env.local` first!

**Test: Valid request (should return Socratic response)**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "problem": "Solve for x: 2x + 5 = 13",
    "messages": [
      {
        "role": "student",
        "content": "I don'\''t know where to start",
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
      }
    ]
  }'
```

Expected: `{"response":"What operation is being applied to x in this equation?"}`
(The exact response will vary, but it should be a Socratic question, NOT a direct answer)

### Step 4: Test Vision API

**Test: Missing image field (should return 400)**
```bash
curl -X POST http://localhost:3000/api/vision \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{}'
```

Expected: `{"error":"No image file provided"}`

**Test: Invalid mime type (should return 400)**
```bash
curl -X POST http://localhost:3000/api/vision \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "image": "base64string",
    "mimeType": "image/gif"
  }'
```

Expected: `{"error":"Invalid image format (use PNG or JPG)"}`

## Automated Test Script

Run the validation tests automatically:

```bash
bash test-validation-only.sh
```

Or use the Node.js test script:

```bash
# In one terminal:
npm run dev

# In another terminal:
node test-api.js
```

## What to Look For

✅ **Security Checklist:**
- [ ] API key never appears in browser/client code
- [ ] CORS rejects unauthorized origins (403)
- [ ] Invalid inputs return 400 errors
- [ ] Error messages don't expose internal details
- [ ] Valid requests work with real API key

✅ **Socratic Behavior (with real API key):**
- [ ] Tutor asks questions (not declarative statements)
- [ ] Tutor never gives direct answers (no "x = 4")
- [ ] Responses are brief (1-3 sentences)
- [ ] LaTeX rendering syntax used ($...$)

## Troubleshooting

**Error: "Claude API error. Please try again."**
- Check that you added a valid API key to `.env.local`
- Restart the dev server after adding the key
- Verify the key starts with `sk-ant-`

**Error: "Forbidden"**
- This is normal for unauthorized origins (CORS protection working)
- Make sure to include `-H "Origin: http://localhost:3000"` in curl commands

**Error: "Cannot connect to server"**
- Make sure dev server is running (`npm run dev`)
- Check that it's running on port 3000

## Next Steps

Once all tests pass, Story 1 is complete! Move on to Story 2: Chat Interface.
