
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
    let systemPrompt = `You are a rental market expert focused on providing actionable negotiation advice and pricing insights.`;
    
    if (propertyDetails) {
      // Format the system prompt with actual property details
      const formattedDetails = {
        propertyName: propertyDetails.propertyName || "This property",
        address: address,
        beds: propertyDetails.beds || "unknown",
        baths: propertyDetails.baths || "unknown",
        sqft: propertyDetails.sqft || "unknown",
        rent: propertyDetails.rent || "unknown"
      };
      
      // Use the system prompt from edge-functions.ts
      systemPrompt = `You are a rental market expert focused on providing actionable negotiation advice and pricing insights.
      
YOU MUST ANALYZE THE EXACT PROPERTY DETAILS PROVIDED:
- PROPERTY NAME: ${formattedDetails.propertyName}
- ADDRESS: ${formattedDetails.address}
- BEDROOMS: ${formattedDetails.beds} (YOU MUST ONLY COMPARE WITH PROPERTIES HAVING THE SAME NUMBER OF BEDROOMS)
- BATHROOMS: ${formattedDetails.baths}
- SQUARE FOOTAGE: ${formattedDetails.sqft}
- LISTED RENT: $${formattedDetails.rent} per month

DO NOT make assumptions about property details that contradict the provided data.
DO NOT compare this property with units that have a different number of bedrooms.

Create a detailed report with these sections:

1. PRICE ANALYSIS (400+ words)
- Current market position (over/under market) based on the exact provided rent of $${formattedDetails.rent}
- Detailed price comparisons with similar properties matching the SAME NUMBER OF BEDROOMS (${formattedDetails.beds})
- Recent pricing trends in the building/area for this specific unit type (${formattedDetails.beds} bedroom)

2. NEGOTIATION STRATEGY (500+ words)
- Specific tactics based on current market position
- Recommended concessions to request
- Sample negotiation script using the exact listed price of $${formattedDetails.rent}
- Timing recommendations

3. LEVERAGE POINTS (300+ words)
- Market conditions that favor the tenant
- Property-specific advantages/disadvantages
- Seasonal factors

4. ALTERNATIVE OPTIONS (200+ words)
- Similar properties to consider with the SAME NUMBER OF BEDROOMS (${formattedDetails.beds})
- Price comparisons for alternatives
- Trade-offs analysis

Format using Markdown with clear headings. Use bullet points for key insights.
Include specific numbers and percentages whenever possible.
Write 1,500+ words focused on practical negotiation advice.`;
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
            content: systemPrompt
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
