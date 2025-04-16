
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
      console.error('CRITICAL: ElevenLabs API key is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key is missing', 
          details: 'No API key found in environment variables' 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
    
    console.log('ElevenLabs API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error Response:", errorText);
      console.error("ElevenLabs API Response Status:", response.status);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch voices', 
          details: errorText,
          status: response.status 
        }), 
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
    console.error("Unexpected error in get voices function:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

