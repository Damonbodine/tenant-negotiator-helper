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

    console.log("🚀 Attempting to use GPT-4.1 Responses API");
    console.log("Request Details:", {
      messageLength: message.length,
      historyLength: history.length,
      systemPromptLength: finalSystemPrompt.length
    });
    
    // Build the proper context containing system prompt and conversation history
    const context = {
      system: finalSystemPrompt,
      messages: formattedHistory
    };
    
    // Make the API call to OpenAI using the new responses API endpoint
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "responses=v1"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: {
          role: "user",
          content: message,
          context: context
        },
        text: { format: "plain" }
      })
    });

    console.log("🔍 GPT-4.1 API Response Status:", response.status);

    if (!response.ok) {
      console.error("❌ GPT-4.1 API Call Failed. Falling back to GPT-4o.");
      
      // Fallback to GPT-4o logging added
      const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: finalSystemPrompt },
            ...formattedHistory,
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      if (!fallbackResponse.ok) {
        const fallbackErrorText = await fallbackResponse.text();
        console.error("❌ Fallback API Error:", fallbackErrorText);
        throw new Error(`Both APIs failed. Latest error: ${fallbackErrorText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      console.log("✅ Successfully received response from fallback API (GPT-4o)");
      
      return new Response(
        JSON.stringify({ 
          text: fallbackData.choices[0].message.content,
          model: "gpt-4o (fallback)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Full OpenAI API response structure:", JSON.stringify(data, null, 2));

    // Extract text from the new response format
    let responseText = "";
    if (data.result && data.result.output && data.result.output.text) {
      responseText = data.result.output.text;
      console.log("✅ Successfully used GPT-4.1 Responses API");
    } else {
      console.error("❌ Unexpected OpenAI API response structure:", JSON.stringify(data));
      throw new Error("Could not extract response text from OpenAI API");
    }

    return new Response(
      JSON.stringify({ 
        text: responseText,
        model: "gpt-4.1" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Comprehensive error in chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        model: "error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
