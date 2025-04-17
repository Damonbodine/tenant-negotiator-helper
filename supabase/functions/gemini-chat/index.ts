
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY'); // Keep for backward compatibility

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
    const { message, history, systemPrompt } = await req.json();
    
    console.log("Received request with payload:", JSON.stringify({
      messageLength: message.length,
      historyLength: history.length,
      systemPromptLength: systemPrompt ? systemPrompt.length : 'N/A'
    }, null, 2));

    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error("CRITICAL: OPENAI_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key is not configured", 
          details: "No API key found in environment" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Convert history to OpenAI format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Prepare the default system prompt if none provided
    const defaultSystemPrompt = "You're a rental market expert assistant. Your goal is to help users understand rental market trends, pricing strategies, and provide data-driven advice to help them get the best rental deals. Keep responses concise and practical. Focus on rental market data.";
    
    // Use provided system prompt or default
    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    // Create messages array with system prompt and history
    const messages = [
      {
        role: "system",
        content: finalSystemPrompt
      },
      ...formattedHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log("Sending request to OpenAI API with messages:", JSON.stringify(messages, null, 2));

    // Make the API call to OpenAI using the chat completions API with gpt-4o
    // This is more reliable than the new responses API during transition
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using a stable, available model
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    console.log("OpenAI API Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      throw new Error(`OpenAI API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Full OpenAI API response:", JSON.stringify(data, null, 2));

    let responseText = "";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      responseText = data.choices[0].message.content;
    } else {
      console.error("Unexpected OpenAI API response structure:", JSON.stringify(data));
      throw new Error("Could not extract response text from OpenAI API");
    }

    return new Response(
      JSON.stringify({ text: responseText }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Comprehensive error in chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
