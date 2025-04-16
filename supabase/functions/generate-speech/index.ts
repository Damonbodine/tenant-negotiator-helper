
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
    
    // Get request body
    const requestBody = await req.json();
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = requestBody;
    
    if (!text) {
      console.error('ERROR: Text is required in the request');
      return new Response(
        JSON.stringify({ 
          error: 'Text parameter is required', 
          details: 'No text provided in the generate speech request' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log(`Attempting to generate speech for text: "${text.substring(0, 50)}..." with voice ID: ${voiceId}`);
    
    // Call ElevenLabs API to generate speech
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });
    
    console.log('ElevenLabs API Response Status:', elevenLabsResponse.status);
    
    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs API Error Response:", errorText);
      console.error("ElevenLabs API Response Status:", elevenLabsResponse.status);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate speech', 
          details: errorText,
          status: elevenLabsResponse.status 
        }), 
        {
          status: elevenLabsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Get audio as arrayBuffer
    const arrayBuffer = await elevenLabsResponse.arrayBuffer();
    console.log("Successfully got array buffer with byte length:", arrayBuffer.byteLength);
    
    // Convert audio buffer to base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );
    
    console.log("Successfully converted to base64, returning audio content");
    
    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Unexpected error in generate speech function:", error);
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

