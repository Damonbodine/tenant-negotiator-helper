# OpenAI API Setup for Voice Practice

## Required Environment Variable

The voice practice feature with high-quality TTS requires an OpenAI API key to be configured in your Supabase environment.

### Setup Steps:

1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key (starts with `sk-proj-...`)
   - Copy the key immediately (you won't be able to see it again)

2. **Configure in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **Edge Functions** → **Environment Variables**
   - Add a new environment variable:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** Your OpenAI API key (e.g., `sk-proj-abc123...`)
   - Save the configuration

3. **Deploy Edge Functions:**
   After setting the environment variable, redeploy the edge functions:
   ```bash
   supabase functions deploy openai-tts
   supabase functions deploy generate-conversation-summaries
   ```

## How It Works:

- **Primary:** Voice practice uses OpenAI's Onyx voice for high-quality TTS
- **Fallback:** If OpenAI TTS fails, automatically falls back to browser's built-in TTS
- **Cost:** OpenAI TTS costs approximately $0.015 per 1K characters

## Without OpenAI Setup:

The voice practice feature will still work using your browser's built-in text-to-speech, but with lower audio quality. The console will show:

```
OpenAI TTS error: OpenAI API key not configured
Falling back to browser TTS due to OpenAI TTS error
```

## Testing:

After setup, test the voice practice feature. You should see in the console:
```
Generated X bytes of audio
```

This indicates OpenAI TTS is working properly.