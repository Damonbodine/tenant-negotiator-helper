
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
    
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
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

    // Add system prompt and latest message
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

    console.log("Sending request to OpenAI API:", JSON.stringify(messages));

    // Make the API call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-preview", // Updated to use GPT-4.1
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI API response:", JSON.stringify(data));

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
    console.error("Error in chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
