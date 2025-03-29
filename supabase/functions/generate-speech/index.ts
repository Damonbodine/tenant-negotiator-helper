
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
    
    // Get request body
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}..." with voice ID: ${voiceId}`);
    
    // Debugging the URL and headers
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    console.log(`Making request to: ${ttsUrl}`);
    
    // Full logging of the headers and the beginning of the request body
    const requestBody = JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });
    console.log('Request headers:', {
      'xi-api-key': `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`, // Masked for security
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    });
    console.log('Request body (truncated):', requestBody.substring(0, 100) + (requestBody.length > 100 ? '...' : ''));
    
    // Call ElevenLabs API to generate speech
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: requestBody
    });
    
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
    
    console.log("Got successful response from ElevenLabs API");
    
    // Get audio as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();
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
    console.error("Error generating speech:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
