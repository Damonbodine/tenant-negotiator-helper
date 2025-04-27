
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, propertyDetails } = await req.json();
    
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    console.log('Analyzing address:', address);
    console.log('Property details:', propertyDetails);

    // Create a detailed context string from property details
    let propertyContext = '';
    if (propertyDetails) {
      propertyContext = `This analysis is for a specific property with these details:
- ${propertyDetails.beds} bedroom${propertyDetails.beds !== 1 ? 's' : ''}
- Listed at $${propertyDetails.rent} per month
- ${propertyDetails.sqft} square feet
- ${propertyDetails.baths} bathroom${propertyDetails.baths !== 1 ? 's' : ''}
${propertyDetails.propertyName ? `- Property name: ${propertyDetails.propertyName}` : ''}

Use these EXACT details as the basis for your analysis. Only compare with similar properties that match these specifications, especially the number of bedrooms.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a rental market expert focused on providing actionable negotiation advice and pricing insights.
            ${propertyContext}`
          },
          {
            role: 'user',
            content: `Please provide a detailed rental market analysis focused on negotiation strategy for this location: ${address}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API response:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    
    if (!text) {
      throw new Error('No analysis was generated');
    }

    return new Response(
      JSON.stringify({ 
        address,
        text,
        model: data.model || 'gpt-4o'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in address-analyzer function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during analysis',
        message: 'Please try a different address or check the format'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
