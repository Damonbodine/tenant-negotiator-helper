
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:streamGenerateContent";

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
    const { message, history } = await req.json();
    
    // Convert history to Gemini format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // Add the latest message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Add system prompt for specialized role
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: "You're a rental market expert assistant. Your goal is to help users understand rental market trends, pricing strategies, and provide data-driven advice to help them get the best rental deals. Keep responses concise and practical. Focus on rental market data." }]
        },
        ...formattedHistory
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    };

    console.log("Sending request to Gemini API:", JSON.stringify(payload));

    // Make the API call
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data));

    let responseText = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      responseText = data.candidates[0].content.parts[0].text;
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
    console.error("Error in gemini-chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
