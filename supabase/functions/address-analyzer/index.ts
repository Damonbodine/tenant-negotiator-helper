
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
    const { address } = await req.json();
    
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    console.log('Analyzing address:', address);

    // Quick validation - don't process very short inputs or obviously not addresses
    if (address.length < 5 || address.split(' ').length < 2) {
      throw new Error('Please provide a more specific address for analysis');
    }

    // Call OpenAI to analyze the address and provide market insights
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
            content: `You are a rental market expert that provides detailed insights about rental prices, 
                     market conditions, and negotiation tips. When given an address or location, 
                     analyze thoroughly and provide:
                     1. General market trends and dynamics for that specific area
                     2. Average prices for different apartment types with recent data
                     3. Detailed factors affecting pricing in that location
                     4. Multiple specific negotiation strategies for that market
                     5. Notable amenities and features of the area
                     6. Recent market changes and future predictions
                     
                     Format your response with Markdown for better readability.
                     Be thorough and detailed in your analysis.`
          },
          {
            role: 'user',
            content: `Please provide a comprehensive rental market analysis for this location: ${address}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
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
