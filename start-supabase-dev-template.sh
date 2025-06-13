#!/bin/bash

# Start Supabase local development with OpenAI API key
# Copy this file to start-supabase-dev.sh and add your API key
export OPENAI_API_KEY=your-openai-api-key-here

echo "Starting Supabase with OpenAI API key configured..."
npx supabase start

echo "Supabase is running with OpenAI TTS support!"
echo "Test TTS function with: curl -X POST http://127.0.0.1:54321/functions/v1/openai-tts"