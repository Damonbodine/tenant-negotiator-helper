
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

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
    const { address } = await req.json();
    
    if (!address) {
      throw new Error('Address is required');
    }

    if (!GOOGLE_API_KEY) {
      console.error('Google API key not configured');
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Generate URL for Google Maps Static API
    const encodedAddress = encodeURIComponent(address);
    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=${GOOGLE_API_KEY}`;
    
    // Generate Street View image URL as a fallback
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodedAddress}&key=${GOOGLE_API_KEY}`;

    return new Response(
      JSON.stringify({ 
        mapImageUrl,
        streetViewUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in google-maps-static function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while fetching map image',
        message: 'Please check your input and try again'
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
