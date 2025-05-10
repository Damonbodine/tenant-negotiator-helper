
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
    const { properties } = await req.json();
    
    if (!properties || !Array.isArray(properties) || properties.length < 2 || properties.length > 4) {
      throw new Error('Invalid request: 2-4 properties required for comparison');
    }

    console.log('Property comparison requested for:', properties.length, 'properties');
    
    // Validate each property has necessary fields
    properties.forEach((property, index) => {
      if (!property.address) {
        throw new Error(`Property ${index + 1} is missing an address`);
      }
    });

    // Create prompt for OpenAI
    const systemPrompt = `You are a rental market expert who specializes in comparing properties to find the best value for renters. 
    
Your task is to analyze the following properties and provide a detailed comparison focusing on:
1. Value for money (price per square foot, amenities for the price)
2. Location comparison (if zip codes are different)
3. Size and layout efficiency based on bedroom/bathroom count
4. Overall recommendation on which property offers the best value
5. Negotiation advice specifically for the property that offers the best value

Format your response as HTML that can be directly inserted into a webpage. Use appropriate headers (<h3>), lists (<ul>, <li>), and paragraphs (<p>). 
Highlight important points using <strong> tags. DO NOT include any introductory text like "Here's my analysis" - just start with the content.`;

    // Create the comparison prompt
    const prompt = `Compare these ${properties.length} rental properties:

${properties.map((p, i) => `
PROPERTY ${i + 1}:
- Address: ${p.address}
- Zip Code: ${p.zipCode || "Not provided"}
- Bedrooms: ${p.bedrooms || "Not provided"}
- Bathrooms: ${p.bathrooms || "Not provided"}
- Square Footage: ${p.squareFootage || "Not provided"}
- Monthly Rent: $${p.price || "Not provided"}
${p.squareFootage && p.price ? `- Price per sq ft: $${(p.price / p.squareFootage).toFixed(2)}` : ""}
`).join('\n')}

COMPARISON TASKS:
1. Create a detailed analysis comparing these properties on value, location, and features
2. Identify which property offers the BEST OVERALL VALUE and explain why
3. Provide specific negotiation tactics for the best-value property
4. If any properties appear overpriced, explain why and by how much
5. Suggest what would be a fair price for each property based on the comparative market analysis`;

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Sending request to OpenAI for property comparison');
    
    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAIData = await openAIResponse.json();
    const analysis = openAIData.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error('Failed to generate property comparison');
    }

    // Find which property is the best value based on the analysis
    const bestValueIndex = findBestValueProperty(analysis, properties.length);

    // Return the comparison results
    const response = {
      properties,
      analysis,
      bestValue: bestValueIndex
    };

    console.log('Property comparison analysis complete');
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in property-comparison function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during property comparison',
        message: 'Please check your inputs and try again'
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to determine which property is identified as the best value
function findBestValueProperty(analysisText: string, propertyCount: number): number | undefined {
  const lowerText = analysisText.toLowerCase();
  
  // Look for phrases indicating best value
  for (let i = 0; i < propertyCount; i++) {
    const propertyNumber = i + 1;
    const searchTerms = [
      `property ${propertyNumber} is the best value`,
      `property ${propertyNumber} offers the best value`,
      `property ${propertyNumber} provides the best value`,
      `best value is property ${propertyNumber}`,
      `recommend property ${propertyNumber}`,
      `property ${propertyNumber} is recommended`,
    ];
    
    if (searchTerms.some(term => lowerText.includes(term))) {
      return i;
    }
  }
  
  return undefined; // No clear best value found
}
