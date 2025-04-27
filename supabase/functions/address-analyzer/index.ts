
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
    const { address } = await req.json();
    
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    console.log('Analyzing address:', address);

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
            
            Analyze the provided property and create a detailed report with these sections:

            1. PRICE ANALYSIS (400+ words)
            - Current market position (over/under market)
            - Detailed price comparisons with similar properties
            - Recent pricing trends in the building/area
            
            2. NEGOTIATION STRATEGY (500+ words)
            - Specific tactics based on current market position
            - Recommended concessions to request
            - Sample negotiation script
            - Timing recommendations
            
            3. LEVERAGE POINTS (300+ words)
            - Market conditions that favor the tenant
            - Property-specific advantages/disadvantages
            - Seasonal factors
            
            4. ALTERNATIVE OPTIONS (200+ words)
            - Similar properties to consider
            - Price comparisons for alternatives
            - Trade-offs analysis
            
            Format using Markdown with clear headings. Use bullet points for key insights.
            Include specific numbers and percentages whenever possible.
            Write 1,500+ words focused on practical negotiation advice.`
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
