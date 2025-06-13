# OpenAI API Key Deployment Guide

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit API keys to git**
2. **Always use environment variables**
3. **Different keys for development vs production**

## Local Development Setup ✅

The OpenAI API key has been configured for local development:
- Supabase Edge Functions: Use `OPENAI_API_KEY` environment variable
- Frontend (Vite): Use `VITE_OPENAI_API_KEY` in `.env.local`

## Production Deployment Checklist

### 1. Vercel/Netlify Environment Variables
Add these environment variables in your hosting platform:
```
OPENAI_API_KEY=your-production-api-key
```

### 2. Supabase Production
In Supabase Dashboard > Settings > Edge Functions:
1. Add `OPENAI_API_KEY` secret
2. Optionally add `OPENAI_RENTERS_MENTOR_KEY` if using legacy functions

### 3. Frontend Security
For production, AVOID exposing API keys in the browser:
- Use edge functions as proxy for all OpenAI calls
- Remove `VITE_OPENAI_API_KEY` from production builds
- The RealtimeVoicePractice component already has fallback to use server endpoint

## Current Configuration

### Edge Functions Using OpenAI:
- `chat-ai-enhanced` - Main chat functionality
- `openai-tts` - Text-to-speech
- `openai-realtime-session` - Voice practice sessions
- `listing-analyzer` - Property analysis
- `address-analyzer` - Address lookup
- `script-generator` - Email script generation
- `lease-doc-analyzer` - Lease document analysis

### Rate Limiting Protection:
- Global rate limiter: 30 calls/minute max
- Memory save throttling: 1 save per 30 seconds
- Emergency shutdown after 100 rapid calls

## Testing Your Setup

1. Test chat functionality:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/chat-ai-enhanced \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, test message"}'
   ```

2. Check logs in Supabase Dashboard for any API key errors

## Security Best Practices

1. **Rotate keys regularly** - Every 3-6 months
2. **Set usage limits** in OpenAI Dashboard
3. **Monitor usage** - Set up billing alerts
4. **Use different keys** for dev/staging/production
5. **Audit access** - Review who has access to keys

## Troubleshooting

If you see "OpenAI API key not configured" errors:
1. Check Supabase secrets: `supabase secrets list`
2. Verify edge function deployment: `supabase functions list`
3. Check function logs in Supabase Dashboard
4. Ensure environment variable names match exactly

Remember: The system now has comprehensive rate limiting to prevent the $100+ incident from recurring!