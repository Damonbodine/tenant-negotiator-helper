
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      history = [], 
      message, 
      systemPrompt = "You are a renter-advocate assistant.",
      memories = [] 
    } = await req.json();

    console.log('Processing chat message:', { message, historyLength: history.length });
    console.log('Using system prompt:', systemPrompt.substring(0, 100) + '...');
    console.log('Memories provided:', memories.length);
    console.log('Requesting GPT-4.1 model from OpenAI');

    // Construct the enhanced system prompt with memories if available
    let enhancedSystemPrompt = systemPrompt;
    if (memories && memories.length > 0) {
      const memoryContext = `
## Previous Conversation Context
The user has interacted with you before. Here are summaries of your past conversations to help you provide more relevant responses:

${memories.map((memory: string, index: number) => `Memory ${index + 1}: ${memory}`).join('\n\n')}

Please use this context to provide more personalized responses, but do not explicitly mention these previous conversations unless the user brings them up first.
`;
      enhancedSystemPrompt = `${systemPrompt}\n\n${memoryContext}`;
      console.log('Enhanced system prompt with memories');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4096
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    console.log('OpenAI response received. Model used:', data.model);
    
    const text = data.choices?.[0]?.message?.content ?? "";
    
    // Return both the text and the model used for verification purposes
    return new Response(JSON.stringify({ 
      text,
      model: data.model || 'unknown' 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
