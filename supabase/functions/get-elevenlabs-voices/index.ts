
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!apiKey) {
      console.error('ElevenLabs API key is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }
    
    console.log('ELEVENLABS_API_KEY is present and has length:', apiKey.length);
    console.log("Fetching voices from ElevenLabs API");
    
    // Call the ElevenLabs API to get available voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    // Log the request details for debugging
    console.log("Request made to ElevenLabs API with masked key:", `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error response:", errorText);
      console.error("ElevenLabs API response status:", response.status, response.statusText);
      let errorMessage;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail?.message || errorData.detail || errorData.message || response.statusText;
        console.error("Parsed error detail:", JSON.stringify(errorData.detail || {}));
      } catch (e) {
        errorMessage = errorText || response.statusText;
        console.error("Error parsing error response:", e);
      }
      
      throw new Error(`ElevenLabs API error: ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.voices?.length || 0} voices`);
    
    return new Response(
      JSON.stringify({ voices: data.voices || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error fetching voices:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
