
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get required secrets
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, memories = [] } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: address',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing address: ${address}`);

    // First get geocoding data from Google
    let location;
    if (GOOGLE_API_KEY) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.results && geocodeData.results.length > 0) {
          const result = geocodeData.results[0];
          location = {
            address: result.formatted_address,
            location: result.geometry.location,
            neighborhood: "",
            city: "",
            state: "",
            zip: ""
          };

          // Extract address components
          for (const component of result.address_components) {
            if (component.types.includes('neighborhood')) {
              location.neighborhood = component.long_name;
            } else if (component.types.includes('locality')) {
              location.city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              location.state = component.short_name;
            } else if (component.types.includes('postal_code')) {
              location.zip = component.long_name;
            }
          }
        }
      } catch (error) {
        console.error('Error getting geocoding data:', error);
      }
    }

    // Prepare system prompt
    let systemPrompt = `You are a rental market expert specializing in local analysis. You provide accurate, data-driven insights about rental markets to help renters make informed decisions and negotiate effectively.

Your task:
1. Based on the provided address, give an analysis of the local rental market.
2. Include information about typical rental prices for different unit types.
3. Mention recent market trends (whether prices are rising, falling, or stable).
4. Note the seasonality of the market (when are the best/worst times to rent).
5. Provide specific advice for negotiating in this particular area.
6. Organize your response with headings and bullet points for clarity.

Keep your response concise and focused on actionable insights that would help someone renting in this area. Use specific numbers when available.`;

    // Add memory context if available
    if (memories && memories.length > 0) {
      const memoryContext = `
## Previous Conversation Context
The user has interacted with you before. Here are summaries of your past conversations to help you provide more personalized responses:

${memories.map((memory, index) => `Memory ${index + 1}: ${memory}`).join('\n\n')}

Please use this context to provide more personalized responses, but do not explicitly mention these previous conversations unless the user brings them up first.
`;
      systemPrompt = `${systemPrompt}\n\n${memoryContext}`;
    }

    // Add location context when available
    if (location) {
      systemPrompt += `\n\nThe address has been geocoded to: ${location.address}`;
      if (location.neighborhood) systemPrompt += `\nNeighborhood: ${location.neighborhood}`;
      if (location.city) systemPrompt += `\nCity: ${location.city}`;
      if (location.state) systemPrompt += `\nState: ${location.state}`;
      if (location.zip) systemPrompt += `\nZIP code: ${location.zip}`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please provide rental market analysis for: ${address}` }
        ],
        temperature: 0.7,
        max_tokens: 1200
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error from OpenAI API');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        address: location ? location.address : address,
        text,
        model: data.model
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
