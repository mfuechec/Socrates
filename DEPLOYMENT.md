# Socrates Deployment Guide

## Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `socrates-math-tutor` (or your choice)
3. **Description**: "AI-powered math tutoring using the Socratic method"
4. **Visibility**: Public or Private (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. **Click**: "Create repository"

## Step 2: Push to GitHub

Copy the commands GitHub shows you, or use these:

```bash
cd "/Users/mfuechec/Desktop/Gauntlet Projects/Socrates"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/socrates-math-tutor.git

# Push code
git push -u origin master
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Recommended)

1. **Go to**: https://vercel.com/
2. **Sign in** with your GitHub account
3. **Click**: "Add New..." → "Project"
4. **Import Git Repository**: Find "socrates-math-tutor"
5. **Click**: "Import"

### Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

Click **"Deploy"** (but wait! We need environment variables first)

## Step 4: Add Environment Variables

**BEFORE deploying**, add your environment variables:

1. In Vercel project settings, go to **"Settings"** → **"Environment Variables"**

2. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` (your actual key) | Production, Preview, Development |
| `LLM_TEMPERATURE` | `0.4` | Production, Preview, Development |
| `LLM_MAX_TOKENS` | `500` | Production, Preview, Development |
| `LLM_MODEL` | `gpt-4o` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_NAME` | `Socrates` | Production, Preview, Development |

**Important:**
- Get your OpenAI API key from: https://platform.openai.com/api-keys
- **Never commit** your API key to Git (it's already in .gitignore)
- Select all three environments (Production, Preview, Development)

## Step 5: Deploy!

1. After adding environment variables, go back to **"Deployments"**
2. **Click**: "Redeploy" (if it already tried to deploy)
   - OR it will auto-deploy if you added variables before first deploy
3. **Wait**: 1-2 minutes for build and deployment
4. **Click**: "Visit" to see your live site!

Your app will be live at: `https://socrates-math-tutor-xxxxx.vercel.app`

## Step 6: Test Production Deployment

1. **Visit your Vercel URL**
2. **Test these features:**
   - ✅ Text input works
   - ✅ Chat with GPT-4o works
   - ✅ Image upload works
   - ✅ LaTeX rendering works
   - ✅ Error handling works

## Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Solution**: Make sure all dependencies in package.json are committed

**Error**: "Type errors"
- **Solution**: Run `npm run build` locally to check for TypeScript errors

### Runtime Errors

**Error**: "OpenAI API error"
- **Solution**: Check that `OPENAI_API_KEY` is set in Vercel environment variables
- **Verify**: Key starts with `sk-proj-`

**Error**: "CORS issues"
- **Solution**: Vercel URL is automatically added to CORS allowlist via `NEXT_PUBLIC_VERCEL_URL`

**Error**: Math not rendering
- **Solution**: Verify KaTeX CSS is loading (check Network tab)

## Custom Domain (Optional)

1. In Vercel, go to **"Settings"** → **"Domains"**
2. **Add**: your custom domain (e.g., `socrates-tutor.com`)
3. **Follow**: DNS configuration instructions
4. **Wait**: 5-10 minutes for DNS propagation

## Continuous Deployment

Now that it's connected to GitHub:

1. **Make changes** locally
2. **Commit**: `git commit -m "Your changes"`
3. **Push**: `git push`
4. **Vercel auto-deploys** within 1-2 minutes! 🚀

## Environment Variables Quick Reference

```bash
# Required
OPENAI_API_KEY=sk-proj-your-key-here

# Optional (defaults in code)
LLM_TEMPERATURE=0.4
LLM_MAX_TOKENS=500
LLM_MODEL=gpt-4o
NEXT_PUBLIC_APP_NAME=Socrates
```

## Monitoring

### Vercel Dashboard

- **Analytics**: See page views, unique visitors
- **Logs**: Real-time logs of API routes
- **Speed Insights**: Performance metrics

### OpenAI Dashboard

- **Usage**: https://platform.openai.com/usage
- **Monitor**: API costs, request counts
- **Set**: Spending limits to control costs

## Cost Estimates

### Vercel Hosting
- **Free tier**: Sufficient for MVP
- **Limits**: 100GB bandwidth, serverless function invocations

### OpenAI API (GPT-4o)
- **Cost**: $2.50 per 1M input tokens, $10 per 1M output tokens
- **Estimate**: ~$0.02-0.05 per conversation (10 turns)
- **Set spending limit**: Recommended $50/month for testing

## Security Checklist

✅ **API Key**
- Stored in Vercel environment variables
- Never in Git repository
- Not exposed to browser

✅ **CORS**
- Protected API routes
- Vercel URL in allowlist

✅ **Input Validation**
- Max lengths enforced
- File size limits checked
- Format validation

✅ **Error Handling**
- Sanitized error messages
- No internal details exposed

## Next Steps After Deployment

1. **Share the URL** with friends/testers
2. **Gather feedback** on Socratic dialogue quality
3. **Monitor** OpenAI costs in dashboard
4. **Iterate** based on user feedback

## Post-MVP Enhancements

Consider adding:
- User authentication (NextAuth.js)
- Conversation persistence (database)
- Progress tracking
- More problem types
- Voice input

---

**Congratulations!** Your Socrates Math Tutor is now live! 🎉

Need help? Check:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- OpenAI Docs: https://platform.openai.com/docs
